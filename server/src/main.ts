import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { LoggerService } from './providers/logger/logger.service';

async function bootstrap() {
  // Buffer logs to avoid log loss on application startup
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  // Use custom logger for application logging
  const logger = app.get(LoggerService);
  app.useLogger(logger);

  logger.log('Bootstrapping application...', 'Bootstrap');

  // Get config service for application configuration
  const config = app.get(ConfigService);

  // Use global validation pipe for all controllers to validate input data
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Use helmet and cookie parser middleware for security headers and cookies
  app.use(helmet());
  app.use(cookieParser());

  // Enable CORS for client URL to allow cookies and methods for API routes
  const clientUrl = config.getOrThrow<string>('client.url');
  app.enableCors({
    origin: clientUrl,
    methods: 'GET, HEAD, PUT, PATCH, POST, DELETE',
    credentials: true,
  });

  // Set global prefix for API routes
  const apiPrefix = config.getOrThrow<string>('api.prefix');
  const apiVersion = config.getOrThrow<string>('api.version');
  app.setGlobalPrefix(`${apiPrefix}/${apiVersion}`);

  // Configure Swagger for API documentation
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Venue Management System API')
    .setDescription('Public HTTP API documentation')
    .setVersion(apiVersion)
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
      'access-token',
    )
    .build();

  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);

  const swaggerPath = config.get<string>('swagger.path', 'docs');
  SwaggerModule.setup(swaggerPath, app, swaggerDocument, {
    useGlobalPrefix: true,
  });

  // Start application
  const port = config.getOrThrow<number>('app.port');
  await app.listen(port);

  logger.log(
    `Application started on http://localhost:${port}/${apiPrefix}/${apiVersion}`,
    'Bootstrap',
  );

  logger.log(
    `Swagger available at http://localhost:${port}/${apiPrefix}/${apiVersion}/${swaggerPath}`,
    'Bootstrap',
  );
}
bootstrap().catch((error) => {
  // Use console here because logger may not be initialized
  console.error('Application bootstrap failed', error);
  process.exit(1);
});
