require('dotenv').config()
import {ElementHandle} from "puppeteer";
import chalk from 'chalk';
import {siteHeader} from "./src/utils/data";
import {Coordinates, Direction, PageInstance} from "./types";
import {
    handleExit,
    loadSaveFolder,
    randomSleep,
} from "./src/utils/common";
import {start} from "./src/core";
import {GhostCursor} from "ghost-cursor";

export const updateInputValue = async (element: ElementHandle, value: string, cursor?: GhostCursor) => {
    if (cursor) {
        await cursor.move(element)
    }
    await element.click({count: 3})
    await element.press('Backspace')
    await element.type(value, {delay: 100})
}

export const clickDirection = async (instance: PageInstance, direction: Direction) => {
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
    console.log(chalk.red(siteHeader))
    // todo: add a config parsing
    // todo: use the real instance count
    let instanceCount = 1

    /*if (process.env.LOAD_SAVE === 'true') {
        const {
            data: loadedData,
            nameIdData: loadedNameIdData,
            excludedCoordinates: excludedCoordinatesData
        } = await loadSaveFolder(process.env.SAVE_PATH)

        data = loadedData
        nameIdData = loadedNameIdData
        excludedCoordinates = new Set(excludedCoordinatesData)
    }*/

    const manual = process.env.MANUAL === 'true'
    const headless = process.env.HEADLESS ? process.env.HEADLESS === 'true' : !manual

    const ctx = await start({
        headless,
        executablePath: process.env.EXECUTABLE_PATH,
        userDataDir: process.env.USER_DATA_DIR,
    }, instanceCount)
})()

/*process.on('SIGINT', handleExit)
process.on('SIGTERM', handleExit)*/
