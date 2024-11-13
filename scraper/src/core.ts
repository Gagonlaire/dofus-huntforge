import {HTTPResponse, Page, PuppeteerLaunchOptions} from "puppeteer";
import {Context, Direction, DomElements, PageInstance} from "../types";
import {pageLoggingColors, selectors, userAgents} from "./utils/data";
import logger, {createColorizedLogger} from "./utils/logger";
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import {createCursor} from "ghost-cursor";
import chalk from "chalk";
import {buildKeyFromCoordinates, formatCoordinates, parseCoordinatesFromUrl} from "./utils/common";
import {Logger} from "winston";

export const getDomElements = async (page: Page, _logger: Logger): Promise<DomElements> => {
    const [fields, directions] = await Promise.all([
        page.$$(selectors.hintPositionFields),
        // for directions, we target the icon otherwise ghost-cursor will fail to click on it
        page.$$(selectors.hintDirectionButtons)
    ])

    if (fields.length !== 3 || directions.length !== 4) {
        _logger.error(`Invalid DOM structure, expected 3 fields and 4 directions, got ${fields.length} fields and ${directions.length} directions`)
        process.exit(1)
    }

    return {
        x: fields[0],
        y: fields[1],
        directions: directions,
        hints: fields[2]
    }
}

const handleNetworkResponse = async (ctx: Context, page: PageInstance, response: HTTPResponse) => {
    const [coordinates, direction] = parseCoordinatesFromUrl(response.url())

    if (response.status() === 503) {
        page.logger.warn(`Request blocked by reCAPTCHA for ${formatCoordinates(coordinates)} -> ${chalk.bold(Direction[direction])}`)
        // should add back to te queue
        return
    }

    const data = response.ok() ? (await response.json()).data : []
    const key = buildKeyFromCoordinates(coordinates)
    let keyData = ctx.data[key] || new Array(4)
    const hintMap = new Map<number, any>()

    if (data.length > 0) {
        keyData[direction] = []
    }

    data.forEach((hint: any) => {
        hint.pois.forEach((poi: any) => {
            if (!ctx.nameData[poi.nameId]) {
                delete poi.name.id
                ctx.nameData[poi.nameId] = poi.name
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

    ctx.buffer[key] = (ctx.buffer[key] || 0) + 1
    if (ctx.buffer[key] === 4) {
        let counts = [0, 0]

        keyData.forEach((direction: any) => {
            if (direction) {
                counts[0] += direction.length;
                counts[1] += direction.reduce((count: number, hint: any) => count + hint.ids.length, 0);
            }
        });

        delete ctx.buffer[key]
        page.logger.info(`Fetched ${formatCoordinates(coordinates)} -> ${chalk.bold(Direction[direction])}, ${chalk.bold(counts[0])} maps, ${chalk.bold(counts[1])} hints`)

        if (counts[0] === 0) {
            delete data[key]
            ctx.excludedCoordinates.add(key)
            return
        }
    }

    data[key] = keyData
}

export const start = async (launchOptions: PuppeteerLaunchOptions, instanceCount: number): Promise<Context> => {
    const browser = await puppeteer
        .use(StealthPlugin())
        .launch(launchOptions)
    const pages: PageInstance[] = await Promise.all([...Array(instanceCount)].map(async (_, idx) => {
        const page = await browser.newPage()
        const pageLogger = createColorizedLogger(pageLoggingColors[idx % pageLoggingColors.length], `Instance ${idx + 1}`)
        const userAgent = userAgents[Math.floor(Math.random() * userAgents.length)]

        await page.setUserAgent(userAgent)
        pageLogger.info(`Connecting to ${pageLoggingColors[idx].bold('https://dofusdb.fr/fr/tools/treasure-hunt')} with user-agent: ${pageLoggingColors[idx].bold(userAgent)}`)
        await page.goto('https://dofusdb.fr/fr/tools/treasure-hunt')
        pageLogger.info('Connected, configuring page...')
        // disable all modals to fasten the scraping process
        await page.evaluate(() => {
            const style = document.createElement('style');
            style.innerHTML = `
            .q-dialog {
                display: none !important;
            }
        `;
            document.head.appendChild(style);
        });
        let cursor = createCursor(page)
        let elements = await getDomElements(page, pageLogger)

        pageLogger.info(`Instance ${idx + 1} ready !`)

        return {
            page: page,
            cursor,
            elements,
            logger: pageLogger,
            active: true,
            paused: false,
        }
    }))
    const browserContext: Context = {
        buffer: {},
        data: {},
        nameData: {},
        excludedCoordinates: new Set<string>(),
        browser,
        pages,
        onGoingRequests: 0
    }

    logger.info('Setting up instances event listeners.');

    pages.forEach((page) => {
        page.page.on('response', async (response) => {
            if (response.url().startsWith('https://api.dofusdb.fr/treasure-hunt') && response.request().method() === "GET") {
                await handleNetworkResponse(browserContext, page, response)
                // todo: only decrement if we're not in manual mode
                browserContext.onGoingRequests--
            }
        })

        page.page.on('close', async () => {
            page.logger.warn('Page closed, instance is now disabled')
            page.active = false

            if (pages.every(p => !p.active)) {
                logger.warn('All instances are disabled, exiting...')
                process.exit(0)
            }
        })
    })

    logger.info('Instances ready ! Start scraping.');

    return browserContext
}
