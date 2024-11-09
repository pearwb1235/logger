import dayjs from "dayjs";
import * as winston from "winston";

export type LoggerTransport = winston.transport | winston.transport[];
export type LoggerInfo = winston.Logform.TransformableInfo;

export type FormatHandler<O, I> =
  | string
  | FormatHandlerFunction<O, I>
  | FormatHandler<O, I>[];
export type FormatHandlerFunction<O, I> = (
  message: string,
  info: I,
  option?: O,
) => string;

export default class Logger<O = unknown, I extends LoggerInfo = LoggerInfo> {
  private logger: winston.Logger;
  protected formatHandlers: FormatHandler<O, I>[];

  get debug(): winston.LeveledLogMethod {
    return this.logger.debug.bind(this.logger);
  }
  get info(): winston.LeveledLogMethod {
    return this.logger.info.bind(this.logger);
  }
  get warn(): winston.LeveledLogMethod {
    return this.logger.warn.bind(this.logger);
  }
  get error(): winston.LeveledLogMethod {
    return this.logger.error.bind(this.logger);
  }

  constructor(
    transports: LoggerTransport = [new winston.transports.Console()],
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
      !process.env.NODE_ENV || process.env.NODE_ENV.toLowerCase() === "develop"
    );
  }

  protected getFormatHandlers(
    formatHandlers: FormatHandler<O, I>[],
    info: I,
    option?: O,
  ) {
    return formatHandlers.reduce<string>(
      (message: string, formatHandler: FormatHandler<O, I>): string => {
        if (typeof formatHandler === "function")
          return formatHandler(message, info, option);
        if (Array.isArray(formatHandler))
          return message + this.getFormatHandlers(formatHandler, info, option);
        return message + formatHandler.toString();
      },
      "",
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
}
