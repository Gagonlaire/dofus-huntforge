import * as fs from 'fs/promises';
import * as fsSync from 'fs';
import * as path from 'path';
import {type Context, type Coordinates, type SaveData, Direction} from "../../types";
import {Browser, Page} from "puppeteer";
import {createCursor} from "ghost-cursor";
import {getDomElements, getLanguage} from "./puppeteer";
import logger from "../logger";
import {defaultSavePath, saveFiles} from "../data";

const handleFileError = (error: Error, operation: string) => {
    logger.error(`Error ${operation}: ${error.message}`);
    process.exit(1);
};

const getFilePaths = (folderPath: string) =>
    Object.entries(saveFiles).reduce((acc, [key, fileName]) => ({
        ...acc,
        [key]: path.join(folderPath, fileName)
    }), {} as Record<keyof typeof saveFiles, string>);

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

export const buildKeyFromCoordinates = (coordinates: Coordinates): string => {
    return `${coordinates.x},${coordinates.y}`;
}

export const saveToFolderSync = (
    folderPath = defaultSavePath,
    {data, nameIdData, excludedCoordinates}: SaveData
) => {
    const paths = getFilePaths(folderPath);

    try {
        logger.info(`Saving to folder: ${folderPath}`);
        fsSync.mkdirSync(folderPath, {recursive: true});

        fsSync.writeFileSync(paths.data, JSON.stringify(data));
        fsSync.writeFileSync(paths.nameIdData, JSON.stringify(nameIdData));
        fsSync.writeFileSync(
            paths.excludedCoordinates,
            JSON.stringify(Array.from(excludedCoordinates))
        );
    } catch (error) {
        handleFileError(error as Error, 'saving to folder');
    }
};

export const loadSaveFolder = async (
    folderPath: string = defaultSavePath
): Promise<SaveData> => {
    const paths = getFilePaths(folderPath);

    try {
        logger.info(`Loading save folder: ${folderPath}`);

        const [dataContent, nameIdDataContent, excludedCoordinatesContent] =
            await Promise.all([
                fs.readFile(paths.data, 'utf-8'),
                fs.readFile(paths.nameIdData, 'utf-8'),
                fs.readFile(paths.excludedCoordinates, 'utf-8')
            ]);

        return {
            data: JSON.parse(dataContent),
            nameIdData: JSON.parse(nameIdDataContent),
            excludedCoordinates: JSON.parse(excludedCoordinatesContent)
        };
    } catch (error) {
        handleFileError(error as Error, 'loading save folder');
        return {} as SaveData;
    }
};
