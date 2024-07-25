import * as winston from "winston";
import * as DailyRotateFile from "winston-daily-rotate-file";

import {Environment} from "@config/configuration";

export function WinstonLogger(options: {
    useCustomConsole?: boolean;
}): winston.transport[] {
    const transports: winston.transport[] = [];

    // Console logger
    if (options.useCustomConsole) {
        transports.push(
            // ? Console
            new winston.transports.Console({
                level:
                    process.env.NODE_ENV === Environment.Production
                        ? process.env.DEBUG_LEVEL || "info"
                        : "debug",
                format: winston.format.combine(
                    winston.format.timestamp({
                        format: "YYYY-MM-DD HH:mm:ss",
                    }),
                    winston.format.colorize(),
                    winston.format.printf((info) => customFormat(info))
                ),
            })
        );
    }

    // File logger
    if (
        process.env.NODE_ENV === Environment.Production ||
        process.env.SAVE_LOGS === "true"
    ) {
        transports.push(
            // ? Daily rotating file
            new DailyRotateFile({
                level: process.env.DEBUG_LEVEL || "info",
                dirname: `${process.env.LOGS_PATH}/daily`,
                filename: "%DATE%",
                extension: ".log",
                datePattern: "YYYY-MM-DD",
                maxSize: process.env.MAX_LOG_SIZE ?? undefined,
                maxFiles:
                    process.env.DELETE_LOGS_AFTER_X_DAYS &&
                    parseInt(process.env.DELETE_LOGS_AFTER_X_DAYS) > 0
                        ? `${process.env.DELETE_LOGS_AFTER_X_DAYS}d`
                        : undefined,
                // options: {flags: "w"}, // ! This option would overwrite the file instead of appending to it
                format: winston.format.combine(
                    winston.format.timestamp({
                        format: "HH:mm:ss",
                    }),
                    winston.format.printf((info) => customFormat(info))
                    // winston.format.prettyPrint()
                ),
            }),
            // ? Monthly rotating file for warnings & errors
            new DailyRotateFile({
                level: "warn",
                dirname: `${process.env.LOGS_PATH}/errors`,
                filename: `%DATE%`,
                extension: ".log",
                datePattern: "YYYY-MM",
                maxSize: process.env.MAX_LOG_SIZE ?? undefined,
                maxFiles: 12, // ? Keep error logs for 12 months
                // options: {flags: "w"}, // ! This option would overwrite the file instead of appending to it
                format: winston.format.combine(
                    winston.format.timestamp({
                        format: "YYYY-MM-DD HH:mm:ss",
                    }),
                    winston.format.printf((info) => customFormat(info))
                ),
            })
        );
    }
    return transports;
}

const customFormat = (info: winston.Logform.TransformableInfo) => {
    const {timestamp, level, message, context, data, stack, ...args} = info;

    const customLevelTag = () => {
        switch (level) {
            case "verbose":
                return "trace";
            default:
                return level;
        }
    };

    let output = `[${timestamp}] ${customLevelTag()
        .toUpperCase()
        .padEnd(5, " ")} [${context}] ${message}`;
    if (data && Object.keys(data).length > 0) {
        if (data.length === 1)
            output = `${output}\n${JSON.stringify(data[0], null, 2)}`;
        else output = `${output}\n${JSON.stringify(data, null, 2)}`;
    }

    if (Object.keys(args).length) {
        output = `${output}\nAdditional arguments:\n${JSON.stringify(
            args,
            null,
            2
        )}`;
    }

    if (stack) {
        // output = `${output}\nStack trace:\n${stack}`;
        output = `${output}\n${stack}`;
    }

    return output;
};
