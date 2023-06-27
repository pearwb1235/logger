/* eslint-disable @typescript-eslint/no-explicit-any */
import dayjs from "dayjs";
import * as winston from "winston";

export type LoggerTransport = winston.transport | winston.transport[];
export type LoggerInfo = winston.Logform.TransformableInfo;

export type FormatHandler<O, I> =
  | string
  | FormatHandlerFunction<O, I>
  | FormatHandler<O, I>[];
export type FormatHandlerFunction<O, I> =
  | ((message: string) => string)
  | ((message: string, info: I) => string)
  | ((message: string, info: I, option?: O) => string);

export default class Logger<O = unknown, I extends LoggerInfo = LoggerInfo> {
  private logger: winston.Logger;
  protected formatHandlers: FormatHandler<O, I>[];
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
      format: winston.format.printf((info) => this.formatOutput(info as I)),
    });
    this.formatHandlers = [
      ["[", this.timestampFormat, "]", " "],
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
    formatHandlers: FormatHandler<O, I>[],
    info: I,
    option?: O
  ) {
    return formatHandlers.reduce<string>(
      (message: string, formatHandler: FormatHandler<O, I>) => {
        if (typeof formatHandler === "function")
          return formatHandler(message, info, option);
        if (Array.isArray(formatHandler))
          return message + this.getFormatHandlers(formatHandler, info, option);
        return message + formatHandler.toString();
      },
      ""
    );
  }

  protected formatOutput(info: I, option?: O) {
    return this.getFormatHandlers(this.formatHandlers, info, option);
  }

  protected timestampFormat(message: string) {
    return message + dayjs().format("YYYY/MM/DD HH:mm:ss");
  }

  protected messageFormat(message: string, info: I) {
    return message + info.message.toString();
  }

  debug(message: string, callback: winston.LogCallback): void;
  debug(
    message: string,
    meta: Partial<Omit<I, "level"> & Omit<winston.LogEntry, "level">>,
    callback: winston.LogCallback
  ): void;
  debug(
    message: string,
    ...meta: Partial<Omit<I, "level"> & Omit<winston.LogEntry, "level">>[]
  ): void;
  debug(infoObject: I): void;
  debug(...args: any[]) {
    this.logger.debug.call(this.logger, ...args);
  }

  info(message: string, callback: winston.LogCallback): void;
  info(
    message: string,
    meta: Partial<Omit<I, "level"> & Omit<winston.LogEntry, "level">>,
    callback: winston.LogCallback
  ): void;
  info(
    message: string,
    ...meta: Partial<Omit<I, "level"> & Omit<winston.LogEntry, "level">>[]
  ): void;
  info(infoObject: I): void;
  info(...args: any[]) {
    this.logger.info.call(this.logger, ...args);
  }

  warn(message: string, callback: winston.LogCallback): void;
  warn(
    message: string,
    meta: Partial<Omit<I, "level"> & Omit<winston.LogEntry, "level">>,
    callback: winston.LogCallback
  ): void;
  warn(
    message: string,
    ...meta: Partial<Omit<I, "level"> & Omit<winston.LogEntry, "level">>[]
  ): void;
  warn(
    message: Partial<Omit<I, "level"> & Omit<winston.LogEntry, "level">>
  ): void;
  warn(...args: any[]) {
    this.logger.warn.call(this.logger, ...args);
  }

  error(message: string, callback: winston.LogCallback): void;
  error(
    message: string,
    meta: Partial<Omit<I, "level"> & Omit<winston.LogEntry, "level">>,
    callback: winston.LogCallback
  ): void;
  error(
    message: string,
    ...meta: Partial<Omit<I, "level"> & Omit<winston.LogEntry, "level">>[]
  ): void;
  error(infoObject: I): void;
  error(...args: any[]) {
    this.logger.error.call(this.logger, ...args);
  }
}
