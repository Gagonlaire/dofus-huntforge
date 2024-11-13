import type {ElementHandle, Page, Browser} from 'puppeteer'
import type {GhostCursor} from "ghost-cursor";
import {Logger} from "winston";

export enum Direction {
    NORTH = 0,
    EAST = 1,
    SOUTH = 2,
    WEST = 3
}

export interface Data {
    data: any;
    nameIdData: any;
    excludedCoordinates: Set<string>;
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

export interface Context {
    page: Page;
    browser: Browser;
    cursor: GhostCursor;
    elements: DomElements;
    lastCoordinates?: Coordinates;
    retryQueue: {coordinates: Coordinates, direction: Direction}[];
}

export interface Context2 {
    buffer: any;
    browser: Browser;
    pages: PageInstance[];
    data: any;
    nameData: any;
    excludedCoordinates: Set<string>;
}

export interface PageInstance {
    page: Page;
    cursor: GhostCursor;
    logger: Logger;
    // instance can pause itself after too many reCAPTCHA
    paused: boolean;
    // to know if input need to be updated
    lastCoordinates?: Coordinates;
    // if an instance fail to setup, it will be disabled
    active: boolean;
    elements: DomElements;
}
