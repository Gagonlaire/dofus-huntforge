require('dotenv').config()
import chalk from "chalk";
import {ElementHandle} from "puppeteer";
import {Config, Coordinates, Direction, PageInstance} from "./types";
import {
    handleExit,
    loadSaveFolder, parseConfigFromEnv,
    randomSleep,
} from "./src/utils/common";
import {connect} from "./src/core";
import {GhostCursor} from "ghost-cursor";
import {siteHeader} from "./src/utils/data";

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
    console.log(chalk.red(siteHeader))
    // we need to register the exit handler before starting the browser
    process.on('SIGINT', (signal) => handleExit(ctx, signal))
    process.on('SIGTERM', (signal) => handleExit(ctx, signal))

    const config: Config = parseConfigFromEnv();
    const save = await loadSaveFolder(config.saveInputPath)
    const ctx = await connect(config)

    if (save) {
        ctx.data = save.data
        ctx.nameData = save.nameData
        ctx.excludedCoordinates = save.excludedCoordinates
    }
})()
