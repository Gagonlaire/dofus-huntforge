require('dotenv').config()
import logger from "./src/utils/logger";
import chalk from "chalk";
import {ElementHandle} from "puppeteer";
import {Context, Coordinates, Direction, PageInstance} from "./types";
import {
    createQueue,
    handleExit,
    loadSaveFolder, parseConfigFromEnv,
    randomSleep, sleep,
} from "./src/utils/common";
import {connect} from "./src/core";
import {GhostCursor} from "ghost-cursor";
import {header} from "./src/utils/data";

const updateInputValue = async (element: ElementHandle, value: string, cursor?: GhostCursor) => {
    if (cursor) {
        await cursor.move(element)
    }
    await element.click({count: 3})
    await element.press('Backspace')
    await element.type(value, {delay: 100})
}

const clickDirection = async (instance: PageInstance, direction: Direction) => {
    await instance.cursor.click(instance.elements.directions[direction])

    // todo: this might not be necessary, maybe just put a lil sleep
    await instance.page.waitForNetworkIdle()
}

const getHintsForPosition = async (
    ctx: Context,
    instance: PageInstance,
    {x, y}: Coordinates,
    direction?: Direction
) => {
    if (!instance.lastCoordinates || instance.lastCoordinates.x !== x) {
        await updateInputValue(instance.elements.x, x.toString(), instance.cursor)
    }
    if (!instance.lastCoordinates || instance.lastCoordinates.y !== y) {
        await updateInputValue(instance.elements.y, y.toString(), instance.cursor)
    }
    instance.lastCoordinates = {x, y}

    await randomSleep()

    if (direction !== undefined) {
        ctx.onGoingRequests++
        await clickDirection(instance, direction)
    } else {
        for (let i = 0; i < 4; i++) {
            ctx.onGoingRequests++
            await clickDirection(instance, i as Direction)
        }
    }
}

(async () => {
    console.log(chalk.red(header))
    // we need to register the exit handler before starting the browser
    process.on('SIGINT', (signal) => handleExit(ctx, signal))
    process.on('SIGTERM', (signal) => handleExit(ctx, signal))

    const config = parseConfigFromEnv();
    const save = await loadSaveFolder(config.saveInputPath)
    const ctx = await connect(config)

    if (save) {
        ctx.data = save.data
        ctx.nameData = save.nameData
        ctx.excludedCoordinates = save.excludedCoordinates
    }

    if (config.manual) {
        logger.warn('Manual mode enabled. Go to the opened browser and start scraping.')
    } else {
        ctx.queue = createQueue(ctx)

        while (ctx.queue.length !== 0) {
            const items = ctx.queue.splice(0, config.instanceCount)

            try {
                await Promise.all(items.map(([coordinates, direction], idx) => {
                    return getHintsForPosition(ctx, ctx.pages[idx], coordinates, direction)
                }))   
            } catch (e) {
                handleExit(ctx, (e as Error).message)
            }
        }

        while (ctx.onGoingRequests > 0) {
            await sleep(250)
        }

        handleExit(ctx, 'Scraping finished')
    }
})()
