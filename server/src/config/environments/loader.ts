import dotenv from 'dotenv';
import { EnvironmentVariables } from './types';
import { environmentValidationSchema } from './validation';

dotenv.config();

export const loadAndValidateEnvironments = ((): EnvironmentVariables => {
  const result = environmentValidationSchema.validate(process.env, {
    abortEarly: false,
    allowUnknown: true,
    stripUnknown: true,
  });

  if (result.error) {
    console.error('Invalid environment variables:\n');

    for (const errorDetail of result.error.details) {
      console.error(`- ${errorDetail.message}`);
    }

    process.exit(1);
  }

  return result.value as EnvironmentVariables;
})();
