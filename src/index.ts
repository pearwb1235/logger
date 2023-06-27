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

  get debug() {
    return this.logger.debug;
  }

  get info() {
    return this.logger.info;
  }

  get warn() {
    return this.logger.warn;
  }

  get error() {
    return this.logger.error;
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
}
