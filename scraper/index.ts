require('dotenv').config()
import chalk from "chalk";
import {HTTPResponse} from 'puppeteer'
import {mapCoordinatesBounds} from "./src/data";
import logger from "./src/logger";
import {Context, Coordinates, Direction} from "./types";
import {
    buildContext,
    buildKeyFromCoordinates, formatCoordinates,
    loadSaveFolder,
    parseCoordinatesFromUrl,
    randomSleep, saveToFolderSync, shouldScrapeCoordinate
} from "./src/common";
import {clickDirection, updateInputValue, connect} from "./src/puppeteer";

let excludedCoordinates = new Set<string>()
let data: any = {}
let nameIdData: any = {}
// buffer which position/direction has been fetched
let fetchedBuffer: any = {}

const handleExit = (reason: string) => {
    logger.warn(`${reason}, saving state and exiting...`);

    saveToFolderSync(process.env.OUTPUT_PATH, {data, nameIdData, excludedCoordinates})
    process.exit(0)
}

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
            // todo: when a position has some blocked requests, the data always result in a nullish array
            logger.warn(`Request blocked by reCAPTCHA for ${formatCoordinates(coordinates)} -> ${chalk.bold(Direction[direction])}, adding to retry queue`)
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
        // todo: fix the calculation of the hint count -> direction has a number of hints, not the total
        logger.info(`Fetched ${chalk.bold(hintCount)} hints for ${formatCoordinates(coordinates)}`)

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
        excludedCoordinates = new Set(excludedCoordinatesData)
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
    page.on('close', () => handleExit('Browser closed'))

    await page.waitForNetworkIdle()

    if (!manual) {
        let skipCount = 0;
        let skipStart: Coordinates;
        let skipEnd: Coordinates;

        for (let y = mapCoordinatesBounds.minY; y <= mapCoordinatesBounds.maxY; y++) {
            for (let x = mapCoordinatesBounds.minX; x <= mapCoordinatesBounds.maxX; x++) {
                const coordinates: Coordinates = {x, y}

                if (shouldScrapeCoordinate(coordinates, {data, nameIdData, excludedCoordinates})) {
                    if (skipCount !== 0) {
                        logger.info(`Skipping ${chalk.bold(skipCount)} positions from ${formatCoordinates(skipStart!)} to ${formatCoordinates(skipEnd!)}`)
                        skipCount = 0
                    }

                    try {
                        await getHintsForPosition(context, coordinates)
                    } catch (e: any) {
                        logger.error(e.message)
                        handleExit('Error occurred')
                    }
                } else {
                    if (skipCount === 0) {
                        skipStart = coordinates;
                    }
                    skipEnd = coordinates;
                    skipCount++;
                }
            }
        }

        await browser.close()
    }
})()

process.on('SIGINT', handleExit)
process.on('SIGTERM', handleExit)
