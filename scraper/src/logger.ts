import winston from "winston";

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
