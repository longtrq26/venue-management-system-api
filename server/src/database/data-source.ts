import { loadAndValidateEnvironments } from 'src/config/environments/loader';
import { DataSource, DataSourceOptions } from 'typeorm';

const dataSourceOptions: DataSourceOptions = {
  type: loadAndValidateEnvironments.DB_DRIVER,
  host: loadAndValidateEnvironments.DB_HOST,
  port: loadAndValidateEnvironments.DB_PORT,
  database: loadAndValidateEnvironments.DB_NAME,
  username: loadAndValidateEnvironments.DB_USER,
  password: loadAndValidateEnvironments.DB_PASSWORD,

  synchronize: false,
  logging: loadAndValidateEnvironments.APP_ENV === 'development',

  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
};

const dataSource = new DataSource(dataSourceOptions);

export default dataSource;
