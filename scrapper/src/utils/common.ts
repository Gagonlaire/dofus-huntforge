import * as fs from 'fs/promises';
import * as path from 'path';
import {type Context, Coordinates, Direction} from "../../types";
import {Browser, Page} from "puppeteer";
import {createCursor} from "ghost-cursor";
import {getDomElements, getLanguage} from "./puppeteer";
import logger from "../logger";

const DEFAULT_SAVE_PATH = './dist';

export const parseCoordinatesFromUrl = (url: string): [Coordinates, Direction] => {
    const parsedUrl = new URL(url)
    const params = new URLSearchParams(parsedUrl.search)
    const directionMap: { [key: number]: Direction } = {
        0: Direction.EAST,
        2: Direction.SOUTH,
        4: Direction.WEST,
        6: Direction.NORTH
    }

    return [
        {x: parseInt(params.get('x') || '0', 10), y: parseInt(params.get('y') || '0', 10)},
        directionMap[parseInt(params.get('direction') || '0', 10)]
    ];
}


export const buildContext = async (browser: Browser, page: Page): Promise<Context> => {
    const cursor = createCursor(page)

    return {
        browser,
        page,
        cursor,
        retryQueue: [],
        elements: await getDomElements(page),
        language: await getLanguage(page),
    }
}

export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export const randomSleep = async (min: number = 300, max: number = 700) => {
    return sleep(Math.floor(Math.random() * (max - min + 1) + min))
}

export const saveToFolder = async(folderPath: string = DEFAULT_SAVE_PATH, data: any, nameIdData: any) => {
    const dataFilePath = path.join(folderPath, 'data.json');
    const nameIdDataFilePath = path.join(folderPath, 'nameIdData.json');

    try {
        logger.info('Saving to folder: ' + folderPath);
        await fs.mkdir(folderPath, { recursive: true });
        await Promise.all([
            fs.writeFile(dataFilePath, JSON.stringify(data)),
            fs.writeFile(nameIdDataFilePath, JSON.stringify(nameIdData))
        ]);
    } catch (error: any) {
        logger.error('Error saving to folder: ' + error.message);
        process.exit(1);
    }
}

export const loadSaveFolder = async (folderPath: string = DEFAULT_SAVE_PATH) => {
    const dataFilePath = path.join(folderPath, 'data.json');
    const nameIdDataFilePath = path.join(folderPath, 'nameIdData.json');

    try {
        logger.info('Loading save folder: ' + folderPath);
        const [dataContent, nameIdDataContent] = await Promise.all([
            fs.readFile(dataFilePath, 'utf-8'),
            fs.readFile(nameIdDataFilePath, 'utf-8')
        ]);

        logger.info('Checking save integrity');
        const data = JSON.parse(dataContent);
        const nameIdData = JSON.parse(nameIdDataContent);

        return {data, nameIdData};
    } catch (error: any) {
        logger.error('Error loading save folder: ' + error.message);
        process.exit(1);
    }
}
