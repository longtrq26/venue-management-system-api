import { Injectable, LoggerService as LoggerServiceInterface } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import fs from 'fs';
import path from 'path';
import { createLogger, format, Logger, transport, transports } from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

@Injectable()
export class LoggerService implements LoggerServiceInterface {
  private logger: Logger;

  constructor(private readonly config: ConfigService) {
    const logDir = path.join(process.cwd(), this.config.getOrThrow('logger.directory'));

    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    const transportsList: transport[] = [
      new DailyRotateFile({
        filename: path.join(logDir, 'application-%DATE%.log'),
        datePattern: this.config.getOrThrow('logger.rotation.datePattern'),
        zippedArchive: this.config.getOrThrow('logger.rotation.zippedArchive'),
        maxSize: this.config.getOrThrow('logger.rotation.maxSize'),
        maxFiles: this.config.getOrThrow('logger.rotation.maxFiles'),
        auditFile: path.join(logDir, 'audit.json'),
        format: format.combine(format.timestamp(), format.errors({ stack: true }), format.json()),
      }),
    ];

    if (this.config.getOrThrow('logger.console.enabled')) {
      transportsList.push(
        new transports.Console({
          format: format.combine(
            this.config.getOrThrow('logger.console.colorize')
              ? format.colorize()
              : format.uncolorize(),
            format.timestamp({ format: 'DD-MM-YYYY HH:mm:ss' }),
            format.printf(({ timestamp, level, message, context }) => {
              return `${timestamp as string} [${level}] ${
                context ? `[${context as string}] ` : ''
              }${message as string}`;
            }),
          ),
        }),
      );
    }
    this.logger = createLogger({
      level: this.config.getOrThrow('logger.level'),
      transports: transportsList,
      exitOnError: false,
    });
  }

  log(message: string, context?: string) {
    this.logger.info(message, { context });
  }

  error(message: string, trace?: string, context?: string) {
    this.logger.error(message, { trace, context });
  }

  warn(message: string, context?: string) {
    this.logger.warn(message, { context });
  }

  debug(message: string, context?: string) {
    this.logger.debug(message, { context });
  }

  verbose(message: string, context?: string) {
    this.logger.verbose(message, { context });
  }
}
