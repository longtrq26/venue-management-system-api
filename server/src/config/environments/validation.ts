import Joi from 'joi';

export const environmentValidationSchema = Joi.object({
  // Application
  APP_ENV: Joi.string().valid('development', 'staging', 'production').required(),
  APP_URL: Joi.string()
    .uri({ scheme: ['http', 'https'] })
    .when('APP_ENV', {
      is: 'production',
      then: Joi.string().uri({ scheme: ['https'] }),
    })
    .required(),
  APP_PORT: Joi.number().integer().min(1).max(65535).default(3001),

  // API
  API_PREFIX: Joi.string()
    .pattern(/^\/[a-z0-9-]+$/)
    .default('/api'),
  API_VERSION: Joi.string()
    .pattern(/^v\d+$/)
    .default('v1'),

  // Client
  CLIENT_URL: Joi.string()
    .uri({ scheme: ['http', 'https'] })
    .when('APP_ENV', {
      is: 'production',
      then: Joi.string().uri({ scheme: ['https'] }),
    })
    .required(),

  // Database - Postgres
  DB_DRIVER: Joi.string().valid('postgres').default('postgres'),
  DB_HOST: Joi.string().hostname().required(),
  DB_PORT: Joi.number().integer().min(1).max(65535).default(5432),
  DB_NAME: Joi.string().min(1).required(),
  DB_USER: Joi.string().min(1).required(),
  DB_PASSWORD: Joi.string()
    .when('APP_ENV', {
      is: 'development',
      then: Joi.string().allow(''),
      otherwise: Joi.string().min(8),
    })
    .required(),

  // Authentication - JWT
  AUTH_JWT_ISSUER: Joi.string().min(3).required(),
  AUTH_JWT_AUDIENCE: Joi.string().min(3).required(),
  AUTH_JWT_ACCESS_SECRET: Joi.string()
    .length(128)
    .pattern(/^[a-f0-9]+$/i)
    .required(),
  AUTH_JWT_ACCESS_EXPIRES_IN: Joi.string()
    .pattern(/^\d+[smhd]$/)
    .required(),
  AUTH_JWT_REFRESH_SECRET: Joi.string()
    .length(128)
    .pattern(/^[a-f0-9]+$/i)
    .required(),
  AUTH_JWT_REFRESH_EXPIRES_IN: Joi.string()
    .pattern(/^\d+[smhd]$/)
    .required(),

  // Rate Limiting - Throttler
  RATE_LIMIT_SHORT_TTL: Joi.number()
    .integer()
    .min(100) // >= 100ms
    .max(60_000) // <= 1 minute
    .required(),
  RATE_LIMIT_SHORT_LIMIT: Joi.number().integer().min(1).required(),
  RATE_LIMIT_LONG_TTL: Joi.number()
    .integer()
    .min(60_000) // >= 1 minute
    .max(86_400_000) // <= 24h
    .required(),
  RATE_LIMIT_LONG_LIMIT: Joi.number().integer().min(1).required(),

  // SMTP - Brevo
  SMTP_API_KEY: Joi.string().min(20).required(),
  SMTP_SENDER_EMAIL: Joi.string().email().required(),

  // Payment - PayOS
  PAYMENT_CLIENT_ID: Joi.string().min(8).required(),
  PAYMENT_API_KEY: Joi.string().min(32).required(),
  PAYMENT_CHECKSUM_KEY: Joi.string().min(32).required(),
});
