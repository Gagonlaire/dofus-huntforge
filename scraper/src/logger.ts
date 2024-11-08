import winston from "winston";
import {Coordinates} from "../types";
import chalk from "chalk";

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.colorize(),
        winston.format.json(),
    ),
});

logger.add(new winston.transports.Console({
    format: winston.format.simple(),
}));

export default logger;
