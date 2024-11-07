require('dotenv').config()
import logger from "./src/logger";
import {mapCoordinatesBounds} from "./src/data";
import {HTTPResponse} from 'puppeteer'
import {
    buildContext, buildKeyFromCoordinates,
    clickDirection,
    connect,
    loadSaveFolder,
    parseCoordinatesFromUrl,
    randomSleep,
    saveToFolderSync,
    updateInputValue
} from "./src/utils"
import {Context, Coordinates, Direction} from "./types";

let excludedCoordinates = new Set<string>()
let data: any = {}
let nameIdData: any = {}
// buffer which position/direction has been fetched
let fetchedBuffer: any = {}

const getHintsForPosition = async (ctx: Context, {x, y}: Coordinates, direction?: Direction) => {
    if (!ctx.lastCoordinates || ctx.lastCoordinates.x !== x) {
        await updateInputValue(ctx.elements.x, x.toString(), ctx.cursor)
    }
    if (!ctx.lastCoordinates || ctx.lastCoordinates.y !== y) {
        await updateInputValue(ctx.elements.y, y.toString(), ctx.cursor)
    }

    await randomSleep()

    if (direction !== undefined) {
        await clickDirection(ctx, direction)
    } else {
        for (let i = 0; i < 4; i++) {
            await clickDirection(ctx, i as Direction)
        }
    }

    ctx.lastCoordinates = {x, y}
}

const handleNetworkResponse = async (ctx: Context, response: HTTPResponse) => {
    const [coordinates, direction] = parseCoordinatesFromUrl(response.url())
    let responseData: any;

    if (!response.ok()) {
        if (response.status() === 503) {
            logger.warn(`Request blocked by reCAPTCHA (${coordinates.x},${coordinates.y} -> ${Direction[direction]}), adding to retry queue`)
            ctx.retryQueue.push({coordinates, direction})
            return
        }

        // 404, no hints for this position
        responseData = []
    } else {
        responseData = (await response.json()).data
    }

    const key = buildKeyFromCoordinates(coordinates)
    const hintMap = new Map<number, any>()
    let keyData = data[key] || new Array(4)

    if (responseData.length > 0) {
        keyData[direction] = []
    }

    responseData.forEach((hint: any) => {
        hint.pois.forEach((poi: any) => {
            if (!nameIdData[poi.nameId]) {
                delete poi.name.id
                nameIdData[poi.nameId] = poi.name
            }
        })

        const existingHint = hintMap.get(hint.distance) || keyData[direction].find((h: any) => h.d === hint.distance)

        if (existingHint) {
            existingHint.ids.push(...hint.pois.map((poi: any) => poi.nameId))
        } else {
            const newHint = {
                d: hint.distance,
                x: hint.posX,
                y: hint.posY,
                ids: hint.pois.map((poi: any) => poi.nameId)
            }

            keyData[direction].push(newHint)
            hintMap.set(hint.distance, newHint)
        }
    })

    // increment associated buffer and log if all hints have been fetched
    fetchedBuffer[key] = (fetchedBuffer[key] || 0) + 1
    if (fetchedBuffer[key] === 4) {
        let hintCount = 0

        for (const directionHints of keyData) {
            hintCount += directionHints ? directionHints.length : 0
        }

        delete fetchedBuffer[key]
        logger.info(`Fetched all hints for ${key} (${hintCount} hints)`)

        if (hintCount === 0) {
            delete data[key]
            excludedCoordinates.add(key)
            return
        }
    }

    data[key] = keyData
}

(async () => {
    if (process.env.LOAD_SAVE === 'true') {
        const {
            data: loadedData,
            nameIdData: loadedNameIdData,
            excludedCoordinates: excludedCoordinatesData
        } = await loadSaveFolder(process.env.SAVE_PATH)

        data = loadedData
        nameIdData = loadedNameIdData
        excludedCoordinates = excludedCoordinatesData
    }

    const manual = process.env.MANUAL === 'true'
    const headless = process.env.HEADLESS ? process.env.HEADLESS === 'true' : !manual
    const {browser, page} = await connect({
        headless,
        executablePath: process.env.EXECUTABLE_PATH,
        userDataDir: process.env.USER_DATA_DIR,
    })
    const context = await buildContext(browser, page)

    page.on('response', response => {
        if (response.url().startsWith('https://api.dofusdb.fr/treasure-hunt') && response.request().method() === "GET") {
            handleNetworkResponse(context, response)
        }
    })
    page.on('close', async () => {
        logger.warn('Browser closed, saving state and exiting...')
        saveToFolderSync(process.env.OUTPUT_PATH, {data, nameIdData, excludedCoordinates})
        process.exit(0)
    })

    await page.waitForNetworkIdle()

    if (!manual) {
        for (let y = mapCoordinatesBounds.minY; y <= mapCoordinatesBounds.maxY; y++) {
            for (let x = mapCoordinatesBounds.minX; x <= mapCoordinatesBounds.maxX; x++) {
                const key = buildKeyFromCoordinates({x, y})

                if (excludedCoordinates.has(key)) {
                    logger.info(`Skipping excluded coordinates: ${key}`)
                    continue
                }
                await getHintsForPosition(context, {x, y})
            }
        }

        await browser.close()
    }
})()

const handleExit = async (signal: string) => {
    logger.warn(`Received ${signal}, saving state and exiting...`);

    saveToFolderSync(process.env.OUTPUT_PATH, {data, nameIdData, excludedCoordinates})
    process.exit(0)
}

process.on('SIGINT', handleExit)
process.on('SIGTERM', handleExit)
