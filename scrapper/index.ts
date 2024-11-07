require('dotenv').config()
import logger from "./src/logger";
import {HTTPResponse} from 'puppeteer'
import {
    buildContext,
    clickDirection,
    connect,
    loadSaveFolder,
    parseCoordinatesFromUrl,
    randomSleep,
    saveToFolder
} from "./src/utils"
import {Context, Coordinates, Direction} from "./types";

const mapBounds = [
    [-93, -98],
    [49, 58]
]
let data: any = {}
let nameIdData: any = {}
// buffer which position/direction has been fetched
let fetchedBuffer: any = {}

const getHintsForPosition = async (ctx: Context, {x, y}: Coordinates, direction?: Direction) => {
    if (!ctx.lastCoordinates || ctx.lastCoordinates.x !== x) {
        await ctx.cursor.move(ctx.elements.x)
        await ctx.elements.x.click({count: 3})
        await ctx.elements.x.press('Backspace')
        await ctx.elements.x.type(x.toString(), {delay: 100})
    }
    if (!ctx.lastCoordinates || ctx.lastCoordinates.y !== y) {
        await ctx.cursor.move(ctx.elements.y)
        await ctx.elements.y.click({count: 3})
        await ctx.elements.y.press('Backspace')
        await ctx.elements.y.type(y.toString(), {delay: 100})
    }
    await randomSleep()
    if (direction !== undefined) {
        await clickDirection(ctx, direction)
    } else {
        for (let i = 0; i < 4; i++) {
            await clickDirection(ctx, i as Direction)
            await randomSleep()
        }
    }

    ctx.lastCoordinates = {x, y}
}

const handleNetworkResponse = async (ctx: Context, response: HTTPResponse) => {
    const [coordinates, direction] = parseCoordinatesFromUrl(response.url())
    let responseData: any;

    if (!response.ok()) {
        if (response.status() === 503) {
            logger.warn('Request blocked by reCAPTCHA, adding to retry queue')
            ctx.retryQueue.push({coordinates, direction})
            return
        }

        // 404, no hints for this position
        responseData = []
    } else {
        responseData = await response.json()
    }

    const key = `${coordinates.x}/${coordinates.y}`
    const hintMap = new Map<number, any>()
    let keyData = data[key] || [null, null, null, null]

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

        const existingHint = hintMap.get(hint.distance) || keyData[direction].find((h: any) => h.dist === hint.distance)

        if (existingHint) {
            existingHint.ids.push(...hint.pois.map((poi: any) => poi.nameId))
        } else {
            const newHint = {
                dist: hint.distance,
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

        if (hintCount === 0) {
            keyData = null;
        }
        delete fetchedBuffer[key]
        logger.info(`Fetched all hints for ${key} (${hintCount} hints)`)
    }

    data[key] = keyData
}

(async () => {
    if (process.env.LOAD_SAVE === 'true') {
        const {data: loadedData, nameIdData: loadedNameIdData} = await loadSaveFolder(process.env.SAVE_PATH)

        data = loadedData
        nameIdData = loadedNameIdData
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
        await saveToFolder(process.env.OUTPUT_PATH, data, nameIdData)
        process.exit(0)
    })

    await page.waitForNetworkIdle()

    if (!manual) {
        for (let x = mapBounds[0][0]; x <= mapBounds[1][0]; x++) {
            for (let y = mapBounds[0][1]; y <= mapBounds[1][1]; y++) {
                await getHintsForPosition(context, {x, y})
            }
        }
    }
})()

const handleExit = async (signal: string) => {
    logger.warn(`Received ${signal}, saving state and exiting...`);
    await saveToFolder(process.env.OUTPUT_PATH, data, nameIdData)
    process.exit(0);
}

process.on('SIGINT', handleExit)
process.on('SIGTERM', handleExit)
