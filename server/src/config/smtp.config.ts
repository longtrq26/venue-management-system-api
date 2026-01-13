import { registerAs } from '@nestjs/config';
import { loadAndValidateEnvironments } from './environments/loader';

export const smtpConfig = registerAs('smtp', () => ({
  apiKey: loadAndValidateEnvironments.SMTP_API_KEY,
  senderEmail: loadAndValidateEnvironments.SMTP_SENDER_EMAIL,
}));
