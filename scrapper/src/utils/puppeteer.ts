import {Page, PuppeteerLaunchOptions} from "puppeteer";
import {type Context, Direction, DomElements, Language} from "../../types";
import {modalContent, selectors} from "../data";
import logger from "../logger";
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";

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

export const connect = async (options: PuppeteerLaunchOptions) => {
    const browser = await puppeteer
        .use(StealthPlugin())
        .launch(options)
    const page = await browser.newPage()

    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36')
    logger.info('Connecting to https://dofusdb.fr/fr/tools/treasure-hunt')
    await page.goto('https://dofusdb.fr/fr/tools/treasure-hunt')
    logger.info('Browser connected')

    return {browser, page}
}

export const clickDirection = async (ctx: Context, direction: Direction) => {
    await ctx.cursor.click(ctx.elements.directions[direction])
    await ctx.page.waitForNetworkIdle()

    const [content, validateButton] = await Promise.all([
        ctx.page.$(selectors.modalContent),
        ctx.page.$(selectors.modalValidateButton)
    ])

    // execute if a modal has been triggered
    if (content && validateButton) {
        const text = (await content.evaluate(node => node.textContent))!.trim()

        if (text.startsWith(modalContent.noHint[ctx.language])) {
            logger.warn('No hint available for this direction')
        }

        await ctx.cursor.click(validateButton)
    } else {
        logger.error('Error while getting modal content, site may have changed')
    }
}