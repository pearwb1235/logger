/* eslint-disable @typescript-eslint/no-explicit-any */
import * as dayjs from "dayjs";
import * as winston from "winston";

export type LoggerTransport = winston.transport | winston.transport[];
export type LoggerInfo = winston.Logform.TransformableInfo;

export type FormatHandler =
  | string
  | ((message: string, info: LoggerInfo, option: unknown) => string)
  | FormatHandler[];

export default class Logger {
  private logger: winston.Logger;
  protected formatHandlers: FormatHandler[];
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
      format: winston.format.printf((info) =>
        this.formatOutput(info, { color: true })
      ),
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
    formatHandlers: FormatHandler[],
    info: LoggerInfo,
    option: unknown
  ) {
    return formatHandlers.reduce<string>(
      (message: string, formatHandler: FormatHandler) => {
        if (typeof formatHandler === "function")
          return formatHandler(message, info, option);
        if (Array.isArray(formatHandler))
          return message + this.getFormatHandlers(formatHandlers, info, option);
        return message + formatHandler.toString();
      },
      ""
    );
  }

  protected formatOutput(info, option) {
    return this.getFormatHandlers(this.formatHandlers, info, option || {});
  }

  protected timestampFormat(message) {
    return message + dayjs().format("YYYY/MM/DD HH:mm:ss");
  }

  protected levelFormat(message: string, info) {
    return message + info.level.toUpperCase();
  }

  protected messageFormat(message: string, info) {
    return message + info.message.toString();
  }
}
