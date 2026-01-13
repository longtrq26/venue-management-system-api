import { registerAs } from '@nestjs/config';
import { loadAndValidateEnvironments } from './environments/loader';

export const paymentConfig = registerAs('payment', () => ({
  clientId: loadAndValidateEnvironments.PAYMENT_CLIENT_ID,
  apiKey: loadAndValidateEnvironments.PAYMENT_API_KEY,
  checksumKey: loadAndValidateEnvironments.PAYMENT_CHECKSUM_KEY,
}));
