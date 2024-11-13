import {ElementHandle, Page, PuppeteerLaunchOptions} from "puppeteer";
import {type Context, Direction, DomElements, Language} from "../types";
import {selectors, userAgents} from "./data";
import logger from "./logger";
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import {GhostCursor} from "ghost-cursor";
import chalk from "chalk";

export const getDomElements = async (page: Page): Promise<DomElements> => {
    const [fields, directions] = await Promise.all([
        page.$$(selectors.hintPositionFields),
        // for directions, we target the icon otherwise ghost-cursor will fail to click on it
        page.$$(selectors.hintDirectionButtons)
    ])

    if (fields.length !== 3) {
        logger.error(`got ${fields.length} fields, expected 3 (one for x, one for y, one for hint selection). The scraper may be broken.`)
        process.exit(1)
    }

    if (directions.length !== 4) {
        logger.error(`got ${directions.length} directions, expected 4 (one for each direction). The scraper may be broken.`)
        process.exit(1)
    }

    return {
        x: fields[0],
        y: fields[1],
        directions: directions,
        hints: fields[2]
    }
}

export const getLanguage = async (page: Page): Promise<Language> => {
    const language = await page.evaluate(() => {
        const htmlTag = document.querySelector('html');

        return htmlTag ? htmlTag.lang : null;
    });

    if (!language || !Object.values(Language).includes(language as Language)) {
        logger.error('Language either not found or not supported')
        process.exit(1)
    }

    return language as Language
}

export const updateInputValue = async (element: ElementHandle, value: string, cursor?: GhostCursor) => {
    if (cursor) {
        await cursor.move(element)
    }
    await element.click({count: 3})
    await element.press('Backspace')
    await element.type(value, {delay: 100})
}

export const connect = async (options: PuppeteerLaunchOptions) => {
    const browser = await puppeteer
        .use(StealthPlugin())
        .launch(options)
    const page = await browser.newPage()
    const userAgent = userAgents[Math.floor(Math.random() * userAgents.length)]

    logger.info('userAgent: ' + userAgent)
    await page.setUserAgent(userAgent)
    logger.info(`Connecting to ${chalk.bold('https://dofusdb.fr/fr/tools/treasure-hunt')}`)
    await page.goto('https://dofusdb.fr/fr/tools/treasure-hunt')
    logger.info('Browser connected')
    logger.info('Injecting custom css')
    await page.evaluate(() => {
        const style = document.createElement('style');
        style.innerHTML = `
        .q-dialog {
            display: none !important;
        }
    `;
        document.head.appendChild(style);
    });

    return {browser, page}
}

export const clickDirection = async (ctx: Context, direction: Direction) => {
    await ctx.cursor.click(ctx.elements.directions[direction])
    await ctx.page.waitForNetworkIdle()
}
