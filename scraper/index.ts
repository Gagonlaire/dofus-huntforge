require('dotenv').config()
import chalk from 'chalk';
import {siteHeader} from "./src/utils/data";
import {Context, Coordinates, Direction} from "./types";
import {
    loadSaveFolder,
    randomSleep
} from "./src/utils/common";
import {clickDirection, updateInputValue, start} from "./src/core";

// todo: add a variable to keep track of the number of ongoing requests,
//  avoid quitting when stack is empty but requests are still pending
// buffer which position/direction has been fetched

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

    const ctx =  await start({
        headless,
        executablePath: process.env.EXECUTABLE_PATH,
        userDataDir: process.env.USER_DATA_DIR,
    }, instanceCount)
})()

/*
process.on('SIGINT', handleExit)
process.on('SIGTERM', handleExit)
*/
