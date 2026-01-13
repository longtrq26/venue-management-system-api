import { registerAs } from '@nestjs/config';
import { loadAndValidateEnvironments } from './environments/loader';

export const loggerConfig = registerAs('logger', () => ({
  level: loadAndValidateEnvironments.LOG_LEVEL,
  directory: loadAndValidateEnvironments.LOG_DIRECTORY,

  rotation: {
    maxSize: loadAndValidateEnvironments.LOG_MAX_SIZE,
    maxFiles: loadAndValidateEnvironments.LOG_MAX_FILES,
    datePattern: loadAndValidateEnvironments.LOG_DATE_PATTERN,
    zippedArchive: loadAndValidateEnvironments.LOG_ZIPPED_ARCHIVE,
  },

  console: {
    enabled: loadAndValidateEnvironments.LOG_CONSOLE_ENABLED,
    colorize: loadAndValidateEnvironments.LOG_CONSOLE_COLORIZE,
  },
}));
