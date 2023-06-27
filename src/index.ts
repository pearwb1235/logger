/* eslint-disable @typescript-eslint/no-explicit-any */
import * as dayjs from "dayjs";
import * as winston from "winston";

export type LoggerTransport = winston.transport | winston.transport[];
export type LoggerInfo = winston.Logform.TransformableInfo;

export type FormatHandler<O> =
  | string
  | FormatHandlerFunction<O>
  | FormatHandler<O>[];
export type FormatHandlerFunction<O> =
  | ((message: string) => string)
  | ((message: string, info: LoggerInfo) => string)
  | ((message: string, info: LoggerInfo, option?: O) => string);

export default class Logger<O = unknown> {
  private logger: winston.Logger;
  protected formatHandlers: FormatHandler<O>[];
  constructor(
    transports: LoggerTransport = [new winston.transports.Console()]
  ) {
    if (!transports) throw new Error("Invalid arguments: `transports`");
    if (!Array.isArray(transports)) {
      transports = [transports];
    }
    this.logger = winston.createLogger({
      level: this.isDebug() ? "debug" : "info",
      transports,
      format: winston.format.printf((info) => this.formatOutput(info)),
    });
    this.formatHandlers = [
      ["[", this.timestampFormat, "]", " "],
      ["[", this.levelFormat, "]", " "],
      this.messageFormat,
    ];
  }

  protected isDebug() {
    return (
      !("NODE_ENV" in process.env) ||
      process.env.NODE_ENV.toLowerCase() === "develop"
    );
  }

  protected getFormatHandlers(
    formatHandlers: FormatHandler<O>[],
    info: LoggerInfo,
    option?: O
  ) {
    return formatHandlers.reduce<string>(
      (message: string, formatHandler: FormatHandler<O>) => {
        if (typeof formatHandler === "function")
          return formatHandler(message, info, option);
        if (Array.isArray(formatHandler))
          return message + this.getFormatHandlers(formatHandlers, info, option);
        return message + formatHandler.toString();
      },
      ""
    );
  }

  protected formatOutput(info: LoggerInfo, option?: O) {
    return this.getFormatHandlers(this.formatHandlers, info, option);
  }

  protected timestampFormat(message: string) {
    return message + dayjs().format("YYYY/MM/DD HH:mm:ss");
  }

  protected levelFormat(message: string, info: LoggerInfo) {
    return message + info.level.toUpperCase();
  }

  protected messageFormat(message: string, info: LoggerInfo) {
    return message + info.message.toString();
  }

  debug(message: string, callback: winston.LogCallback);
  debug(message: string, meta: any, callback: winston.LogCallback);
  debug(message: string, ...meta: any[]);
  debug(message: any);
  debug(infoObject: object);
  debug(...args: any[]) {
    return this.logger.debug.call(this.logger, ...args);
  }

  info(message: string, callback: winston.LogCallback);
  info(message: string, meta: any, callback: winston.LogCallback);
  info(message: string, ...meta: any[]);
  info(message: any);
  info(infoObject: object);
  info(...args: any[]) {
    return this.logger.info.call(this.logger, ...args);
  }

  warn(message: string, callback: winston.LogCallback);
  warn(message: string, meta: any, callback: winston.LogCallback);
  warn(message: string, ...meta: any[]);
  warn(message: any);
  warn(infoObject: object);
  warn(...args: any[]) {
    return this.logger.warn.call(this.logger, ...args);
  }

  error(message: string, callback: winston.LogCallback);
  error(message: string, meta: any, callback: winston.LogCallback);
  error(message: string, ...meta: any[]);
  error(message: any);
  error(infoObject: object);
  error(...args: any[]) {
    return this.logger.error.call(this.logger, ...args);
  }
}
