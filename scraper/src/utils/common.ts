import * as fs from 'fs/promises';
import * as fsSync from 'fs';
import * as path from 'path';
import {Context, type Coordinates, type Data, Direction} from "../../types";
import logger from "./logger";
import {defaultSavePath, saveFiles} from "./data";
import chalk from "chalk";

const getFilePaths = (folderPath: string) =>
    Object.entries(saveFiles).reduce((acc, [key, fileName]) => ({
        ...acc,
        [key]: path.join(folderPath, fileName)
    }), {} as Record<keyof typeof saveFiles, string>);

export const saveToFolderSync = (
    folderPath = defaultSavePath,
    {data, nameData, excludedCoordinates}: Data
) => {
    const paths = getFilePaths(folderPath);

    try {
        logger.info(`Saving to folder: ${folderPath}`);
        fsSync.mkdirSync(folderPath, {recursive: true});

        // todo: if file already exists, either merge or ask user if they want to overwrite, maybe check at satrtup
        fsSync.writeFileSync(paths.data, JSON.stringify(data));
        fsSync.writeFileSync(paths.nameIdData, JSON.stringify(nameData));
        fsSync.writeFileSync(
            paths.excludedCoordinates,
            JSON.stringify(Array.from(excludedCoordinates))
        );
    } catch (error) {
        logger.error(`Error saving to folder, ${(error as Error).message}`);
    }
};

export const loadSaveFolder = async (
    folderPath: string = defaultSavePath
): Promise<Data | null> => {
    const paths = getFilePaths(folderPath);

    try {
        logger.info(`Loading data from: ${folderPath}`);

        const [dataContent, nameIdDataContent, excludedCoordinatesContent] =
            await Promise.all([
                fs.readFile(paths.data, 'utf-8'),
                fs.readFile(paths.nameIdData, 'utf-8'),
                fs.readFile(paths.excludedCoordinates, 'utf-8')
            ]);

        return {
            data: JSON.parse(dataContent),
            nameData: JSON.parse(nameIdDataContent),
            excludedCoordinates: JSON.parse(excludedCoordinatesContent)
        };
    } catch (error) {
        logger.error(`Error loading save folder, ${(error as Error).message}`);
        return null;
    }
};

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

export const formatCoordinates = (coordinates: Coordinates): string => {
    return chalk.bold(`(${coordinates.x},${coordinates.y})`)
}

export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export const randomSleep = async (min: number = 300, max: number = 700) => {
    return sleep(Math.floor(Math.random() * (max - min + 1) + min))
}

export const buildKeyFromCoordinates = (coordinates: Coordinates): string => {
    return `${coordinates.x},${coordinates.y}`;
}

export const shouldScrapeCoordinate = (coordinates: Coordinates, data: Data): boolean => {
    const key = buildKeyFromCoordinates(coordinates)

    return !(data.excludedCoordinates.has(key) || (data.data[key] && !data.data[key].every((val: any) => val === null)));
}

export const handleExit = (context: Context, reason: string) => {
    logger.warn(`${reason}, saving state and exiting...`);

    saveToFolderSync(process.env.OUTPUT_PATH, context as Data);
    process.exit(0)
}
