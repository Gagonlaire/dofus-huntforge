import * as fs from 'fs/promises';
import * as fsSync from 'fs';
import * as path from 'path';
import {type Config, Context, type Coordinates, type Data, Direction, type MapBounds, QueueItem} from "../../types";
import logger from "./logger";
import {defaultSavePath, defaultMapBounds, printFooter, saveFiles} from "./data";
import chalk from "chalk";

const getFilePaths = (folderPath: string) =>
    Object.entries(saveFiles).reduce((acc, [key, fileName]) => ({
        ...acc,
        [key]: path.join(folderPath, fileName)
    }), {} as Record<keyof typeof saveFiles, string>);

const parseMapBounds = (bounds: string): MapBounds => {
    const [minX, minY, maxX, maxY] = bounds.split(',').map(Number);

    return {minX, minY, maxX, maxY};
}

export const parseConfigFromEnv = (): Config => {
    const manual = process.env.MANUAL === 'true'
    // headless always take priority over manual
    const headless = process.env.HEADLESS ? process.env.HEADLESS === 'true' : !manual
    const config: Config = {
        manual,
        headless,
        instanceCount: Number(process.env.PAGES) || 1,
        executablePath: process.env.EXECUTABLE_PATH,
        userDataDir: process.env.USER_DATA_DIR,
        overwriteSave: process.env.OVERWRITE_SAVE === 'true',
        args: process.env.ARGS ? process.env.ARGS.split(',') : ['--no-sandbox', '--disable-setuid-sandbox'],
        mapBounds: process.env.MAP_BOUNDS ? parseMapBounds(process.env.MAP_BOUNDS) : defaultMapBounds,
        saveInputPath: process.env.SAVE_INPUT_PATH || defaultSavePath,
        saveOutputPath: process.env.SAVE_OUTPUT_PATH || defaultSavePath
    }

    // validate mapBounds if some are provided
    if (process.env.MAP_BOUNDS) {
        if (config.mapBounds.minX >= config.mapBounds.maxX || config.mapBounds.minY >= config.mapBounds.maxY) {
            logger.error('Invalid map bounds, min values must be lower than max values')
            process.exit(1)
        }
        if (Object.values(config.mapBounds).some(isNaN)) {
            logger.error('Invalid map bounds, all values must be numbers')
            process.exit(1)
        }
        if (config.mapBounds.minX < defaultMapBounds.minX ||
            config.mapBounds.minY < defaultMapBounds.minY ||
            config.mapBounds.maxX > defaultMapBounds.maxX ||
            config.mapBounds.maxY > defaultMapBounds.maxY) {
            logger.warn('Map bounds are outside the default bounds, this might cause issues')
        }
    }

    // warn about recommended args not present, especially in CI/CD environments
    if (!config.args.includes('--no-sandbox') || !config.args.includes('--disable-setuid-sandbox')) {
        logger.warn('You are using custom args, but missing --no-sandbox or --disable-setuid-sandbox. This might cause issues')
    }

    // if manual mode is enabled, we set the instance count to 1
    if (config.manual && config.instanceCount !== 1) {
        logger.warn('Manual mode enabled, setting instance count to 1')
        config.instanceCount = 1
    }

    // if target dir exists and input dir !== target dir, data might be unintentionally overwritten so we ask for the overwrite flag
    if (fsSync.existsSync(config.saveOutputPath) && config.saveInputPath !== config.saveOutputPath && !config.overwriteSave) {
        logger.error(`Output path ${config.saveOutputPath} would be overwritten, set OVERWRITE=true or change the SAVE_OUTPUT_PATH`)
        process.exit(1)
    }

    logger.info('Configuration loaded successfully:', config);

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
        logger.info('Data saved successfully');
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

        logger.info(`Successfully loaded data`);

        return {
            data: JSON.parse(dataContent),
            nameData: JSON.parse(nameIdDataContent),
            excludedCoordinates: new Set(JSON.parse(excludedCoordinatesContent))
        };
    } catch (error) {
        logger.error(`Error loading data from folder, ${(error as Error).message}`);
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

export const createQueue = (context: Context, config: Config): QueueItem[] => {
    const queue: QueueItem[] = [];
    let skipCount = 0;
    let skipStart: Coordinates;
    let skipEnd: Coordinates;

    logger.warn('Scraper in automatic mode, building positions to scrape')
    for (let y = config.mapBounds.minY; y <= config.mapBounds.maxY; y++) {
        for (let x = config.mapBounds.minX; x <= config.mapBounds.maxX; x++) {
            const coordinates = {x, y};
            const key = buildKeyFromCoordinates(coordinates);

            if (!context.excludedCoordinates.has(key) && !context.data[key]) {
                if (skipCount !== 0) {
                    logger.info(`Skipping ${skipCount} coordinates from ${formatCoordinates(skipStart!)} to ${formatCoordinates(skipEnd!)}`);
                    skipCount = 0;
                }

                queue.push([coordinates]);
            } else {
                if (skipCount === 0) {
                    skipStart = coordinates;
                }
                skipEnd = coordinates;
                skipCount++;
            }
        }
    }
    logger.info(`Queue created successfully. ${queue.length} coordinates to scrape`);

    return queue;
};

export const handleExit = (context: Context, reason: string) => {
    if (context.hasNewData) {
        logger.warn(`${reason}. Saving state and exiting...`);

        saveToFolderSync(process.env.OUTPUT_PATH, context as Data);
        printFooter();
    } else {
        logger.warn(`${reason}. Exiting...`);
    }
    process.exit(0)
}
