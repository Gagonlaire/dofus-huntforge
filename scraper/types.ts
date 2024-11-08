import type {ElementHandle, Page, Browser} from 'puppeteer'
import type {GhostCursor} from "ghost-cursor";

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

export enum Language {
    FRENCH = 'fr',
    ENGLISH = 'en',
    DEUTSCH = 'de',
    SPANISH = 'es',
    PORTUGUESE = 'pt',
    ITALIAN = 'it'
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
    language: Language;
}
