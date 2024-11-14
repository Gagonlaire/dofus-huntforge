import winston from "winston";
import chalk from "chalk";

const levelColors = {
    "error": chalk.red,
    "warn": chalk.yellow,
}

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.colorize(),
        winston.format.json(),
    ),
    transports: [
        new winston.transports.Console({
            format: winston.format.simple(),
        }),
    ],
});

export const createColorizedLogger = (colorFn: any, name: string) => {
    return winston.createLogger({
        level: 'info',
        format: winston.format.combine(
            winston.format.splat(),
            winston.format.printf(({level, message}) => {
                if (level === 'error' || level === 'warn') {
                    return levelColors[level](`${name}: ${message}`);
                }

                return `${colorFn(name)}: ${message}`;
            })
        ),
        transports: [
            new winston.transports.Console()
        ]
    });
};

export default logger;
