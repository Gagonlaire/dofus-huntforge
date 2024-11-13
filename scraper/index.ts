require('dotenv').config()
import {ElementHandle} from "puppeteer";
import {Coordinates, Direction, PageInstance} from "./types";
import {
    handleExit,
    loadSaveFolder,
    randomSleep,
} from "./src/utils/common";
import {start} from "./src/core";
import {GhostCursor} from "ghost-cursor";

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
    await instance.page.waitForNetworkIdle()
}

const getHintsForPosition = async (instance: PageInstance, {x, y}: Coordinates, direction?: Direction) => {
    if (!instance.lastCoordinates || instance.lastCoordinates.x !== x) {
        await updateInputValue(instance.elements.x, x.toString(), instance.cursor)
    }
    if (!instance.lastCoordinates || instance.lastCoordinates.y !== y) {
        await updateInputValue(instance.elements.y, y.toString(), instance.cursor)
    }

    await randomSleep()

    if (direction !== undefined) {
        await clickDirection(instance, direction)
    } else {
        for (let i = 0; i < 4; i++) {
            await clickDirection(instance, i as Direction)
        }
    }

    instance.lastCoordinates = {x, y}
}

(async () => {
    // we need to register the exit handler before starting the browser
    process.on('SIGINT', (signal) => handleExit(ctx, signal))
    process.on('SIGTERM', (signal) => handleExit(ctx, signal))

    const instanceCount = Number(process.env.INSTANCE_COUNT) || 1
    const manual = process.env.MANUAL === 'true'
    const headless = process.env.HEADLESS ? process.env.HEADLESS === 'true' : !manual
    const ctx = await start({
        headless,
        executablePath: process.env.EXECUTABLE_PATH,
        userDataDir: process.env.USER_DATA_DIR,
    }, instanceCount)

    if (process.env.LOAD_SAVE === 'true') {
        const save = await loadSaveFolder(process.env.SAVE_PATH)

        if (save) {
            ctx.data = save.data
            ctx.nameData = save.nameData
            ctx.excludedCoordinates = save.excludedCoordinates
        }
    }
})()
