import { apiConfig } from './api.config';
import { appConfig } from './app.config';
import { clientConfig } from './client.config';
import { databaseConfig } from './database.config';
import { jwtConfig } from './jwt.config';
import { loggerConfig } from './logger.config';
import { paymentConfig } from './payment.config';
import { rateLimitConfig } from './rate-limit.config';
import { smtpConfig } from './smtp.config';

export const configurations = [
  appConfig,
  apiConfig,
  clientConfig,
  databaseConfig,
  jwtConfig,
  loggerConfig,
  rateLimitConfig,
  smtpConfig,
  paymentConfig,
];
