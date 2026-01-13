import { registerAs } from '@nestjs/config';
import { loadAndValidateEnvironments } from './environments/loader';

export const appConfig = registerAs('app', () => ({
  env: loadAndValidateEnvironments.APP_ENV,
  url: loadAndValidateEnvironments.APP_URL,
  port: loadAndValidateEnvironments.APP_PORT,
}));
