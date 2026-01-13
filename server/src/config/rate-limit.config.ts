import { registerAs } from '@nestjs/config';
import { loadAndValidateEnvironments } from './environments/loader';

export const rateLimitConfig = registerAs('rateLimit', () => ({
  short: {
    ttl: Number(loadAndValidateEnvironments.RATE_LIMIT_SHORT_TTL),
    limit: Number(loadAndValidateEnvironments.RATE_LIMIT_SHORT_LIMIT),
  },
  long: {
    ttl: Number(loadAndValidateEnvironments.RATE_LIMIT_LONG_TTL),
    limit: Number(loadAndValidateEnvironments.RATE_LIMIT_LONG_LIMIT),
  },
}));
