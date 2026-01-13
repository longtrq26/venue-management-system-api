import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { LoggerService } from './providers/logger/logger.service';

async function bootstrap() {
  // Buffer logs to avoid log loss on application startup
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  // Use custom logger
  const logger = app.get(LoggerService);
  app.useLogger(logger);

  logger.log('Bootstrapping application...', 'Bootstrap');

  // Get config service
  const config = app.get(ConfigService);

  // Set global prefix
  const apiPrefix = config.getOrThrow<string>('api.prefix');
  const apiVersion = config.getOrThrow<string>('api.version');
  app.setGlobalPrefix(`${apiPrefix}/${apiVersion}`);

  // Start application
  const port = config.getOrThrow<number>('app.port');
  await app.listen(port);

  logger.log(
    `Application started on http://localhost:${port}${apiPrefix}/${apiVersion}`,
    'Bootstrap',
  );
}
bootstrap().catch((error) => {
  // Use console here because logger may not be initialized
  console.error('Application bootstrap failed', error);
  process.exit(1);
});
