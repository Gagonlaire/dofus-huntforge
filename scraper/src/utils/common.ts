import * as fs from 'fs/promises';
import * as fsSync from 'fs';
import * as path from 'path';
import {type Config, Context, type Coordinates, type Data, Direction} from "../../types";
import logger from "./logger";
import {defaultSavePath, saveFiles} from "./data";
import chalk from "chalk";

const getFilePaths = (folderPath: string) =>
    Object.entries(saveFiles).reduce((acc, [key, fileName]) => ({
        ...acc,
        [key]: path.join(folderPath, fileName)
    }), {} as Record<keyof typeof saveFiles, string>);

export const parseConfigFromEnv = (): Config => {
    const manual = process.env.MANUAL === 'true'
    // headless always take priority over manual
    const headless = process.env.HEADLESS ? process.env.HEADLESS === 'true' : !manual
    const config: Config = {
        manual,
        headless,
        instanceCount: Number(process.env.INSTANCE_COUNT) || 1,
        executablePath: process.env.EXECUTABLE_PATH,
        userDataDir: process.env.USER_DATA_DIR,
        overwrite: process.env.OVERWRITE === 'true',
        saveInputPath: process.env.SAVE_INPUT_PATH || defaultSavePath,
        saveOutputPath: process.env.SAVE_OUTPUT_PATH || defaultSavePath
    }

    logger.info('Configuration loaded successfully.', config);

    // if target dir exists and input dir !== target dir, data might be unintentionally overwritten
    // so we ask for the overwrite flag
    if (fsSync.existsSync(config.saveOutputPath) && config.saveInputPath !== config.saveOutputPath && !config.overwrite) {
        logger.error(`Output path ${config.saveOutputPath} would be overwritten, set OVERWRITE=true or change the SAVE_OUTPUT_PATH.`)
        process.exit(1)
    }

    return config
}

export const saveToFolderSync = (
    folderPath = defaultSavePath,
    {data, nameData, excludedCoordinates}: Data
) => {
    const paths = getFilePaths(folderPath);

    try {
        logger.info(`Saving to folder '${folderPath}'`);

        fsSync.mkdirSync(folderPath, {recursive: true});
        fsSync.writeFileSync(paths.data, JSON.stringify(data));
        fsSync.writeFileSync(paths.nameIdData, JSON.stringify(nameData));
        fsSync.writeFileSync(
            paths.excludedCoordinates,
            JSON.stringify(Array.from(excludedCoordinates))
        );
        logger.info('Data saved successfully.');
    } catch (error) {
        logger.error(`Error saving to folder, ${(error as Error).message}`);
    }
};

export const loadSaveFolder = async (
    folderPath: string = defaultSavePath
): Promise<Data | null> => {
    const paths = getFilePaths(folderPath);

    try {
        logger.info(`Loading data from folder '${folderPath}'`);

        const [dataContent, nameIdDataContent, excludedCoordinatesContent] =
            await Promise.all([
                fs.readFile(paths.data, 'utf-8'),
                fs.readFile(paths.nameIdData, 'utf-8'),
                fs.readFile(paths.excludedCoordinates, 'utf-8')
            ]);

        logger.info(`Successfully loaded data.`);

        return {
            data: JSON.parse(dataContent),
            nameData: JSON.parse(nameIdDataContent),
            excludedCoordinates: new Set(JSON.parse(excludedCoordinatesContent))
        };
    } catch (error) {
        logger.error(`Error loading data from folder, ${(error as Error).message}.`);
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
    logger.warn(`${reason}. Saving state and exiting...`);

    saveToFolderSync(process.env.OUTPUT_PATH, context as Data);
    process.exit(0)
}
