import { registerAs } from '@nestjs/config';
import { loadAndValidateEnvironments } from './environments/loader';

export const jwtConfig = registerAs('jwt', () => ({
  issuer: loadAndValidateEnvironments.AUTH_JWT_ISSUER,
  audience: loadAndValidateEnvironments.AUTH_JWT_AUDIENCE,
  accessToken: {
    secret: loadAndValidateEnvironments.AUTH_JWT_ACCESS_SECRET,
    expiresIn: loadAndValidateEnvironments.AUTH_JWT_ACCESS_EXPIRES_IN,
  },
  refreshToken: {
    secret: loadAndValidateEnvironments.AUTH_JWT_REFRESH_SECRET,
    expiresIn: loadAndValidateEnvironments.AUTH_JWT_REFRESH_EXPIRES_IN,
  },
}));
