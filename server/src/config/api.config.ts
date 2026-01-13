import { registerAs } from '@nestjs/config';
import { loadAndValidateEnvironments } from './environments/loader';

export const apiConfig = registerAs('api', () => ({
  prefix: loadAndValidateEnvironments.API_PREFIX,
  version: loadAndValidateEnvironments.API_VERSION,
}));
