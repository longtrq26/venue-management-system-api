import { registerAs } from '@nestjs/config';
import { loadAndValidateEnvironments } from './environments/loader';

export const clientConfig = registerAs('client', () => ({
  url: loadAndValidateEnvironments.CLIENT_URL,
}));
