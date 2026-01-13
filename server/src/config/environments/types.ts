export interface EnvironmentVariables {
  // Application
  APP_ENV: 'development' | 'staging' | 'production';
  APP_URL: string;
  APP_PORT: number;

  // API
  API_PREFIX: string;
  API_VERSION: string;

  // Client
  CLIENT_URL: string;

  // Database - Postgres
  DB_DRIVER: 'postgres';
  DB_HOST: string;
  DB_PORT: number;
  DB_NAME: string;
  DB_USER: string;
  DB_PASSWORD: string;

  // Authentication - JWT
  AUTH_JWT_ISSUER: string;
  AUTH_JWT_AUDIENCE: string;
  AUTH_JWT_ACCESS_SECRET: string;
  AUTH_JWT_ACCESS_EXPIRES_IN: string;
  AUTH_JWT_REFRESH_SECRET: string;
  AUTH_JWT_REFRESH_EXPIRES_IN: string;

  // Rate Limiting - Throttler
  RATE_LIMIT_SHORT_TTL: number;
  RATE_LIMIT_SHORT_LIMIT: number;
  RATE_LIMIT_LONG_TTL: number;
  RATE_LIMIT_LONG_LIMIT: number;

  // SMTP - Brevo
  SMTP_API_KEY: string;
  SMTP_SENDER_EMAIL: string;

  // Payment - PayOS
  PAYMENT_CLIENT_ID: string;
  PAYMENT_API_KEY: string;
  PAYMENT_CHECKSUM_KEY: string;
}
