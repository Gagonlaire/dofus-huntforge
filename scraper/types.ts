import type {ElementHandle, Page, Browser} from 'puppeteer'
import type {GhostCursor} from "ghost-cursor";
import {Logger} from "winston";
import {ChalkInstance} from "chalk";

export type MapBounds = {
    minX: number,
    minY: number,
    maxX: number,
    maxY: number
}

export interface Config {
    headless: boolean;
    manual: boolean;
    instanceCount: number;
    overwriteSave: boolean;
    saveOutputPath: string;
    saveInputPath: string;
    args: string[];
    mapBounds: MapBounds;
    executablePath?: string;
    userDataDir?: string;
}

export enum Direction {
    NORTH = 0,
    EAST = 1,
    SOUTH = 2,
    WEST = 3
}

export interface Coordinates {
    x: number;
    y: number;
}

export interface DomElements {
    x: ElementHandle;
    y: ElementHandle;
    // north, east, south, west
    directions: ElementHandle[];
    hints: ElementHandle;
}

export interface PageInstance {
    page: Page;
    cursor: GhostCursor;
    logger: Logger;
    loggerColor: ChalkInstance;
    // instance can pause itself after too many reCAPTCHA
    paused: boolean;
    // to know if input need to be updated
    lastCoordinates?: Coordinates;
    // if an instance fail to setup, it will be disabled
    active: boolean;
    elements: DomElements;
}

export type QueueItem = [Coordinates, Direction?];

export interface Data {
    data: any;
    nameData: any;
    excludedCoordinates: Set<string>;
}

export interface Context extends Data {
    buffer: any;
    browser: Browser;
    pages: PageInstance[];
    // avoid quitting before all requests are done
    onGoingRequests: number;
    // store requests to dispatch
    queue: QueueItem[];
    hasNewData: boolean;
}
