import { registerAs } from '@nestjs/config';
import { loadAndValidateEnvironments } from './environments/loader';

export const databaseConfig = registerAs('database', () => ({
  type: loadAndValidateEnvironments.DB_DRIVER,
  host: loadAndValidateEnvironments.DB_HOST,
  port: loadAndValidateEnvironments.DB_PORT,
  database: loadAndValidateEnvironments.DB_NAME,
  username: loadAndValidateEnvironments.DB_USER,
  password: loadAndValidateEnvironments.DB_PASSWORD,

  synchronize: false,
  logging: loadAndValidateEnvironments.APP_ENV === 'development',

  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/../database/migrations/*{.ts,.js}'],
}));
