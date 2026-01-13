import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { apiConfig } from './config/api.config';
import { appConfig } from './config/app.config';
import { clientConfig } from './config/client.config';
import { databaseConfig } from './config/database.config';
import { jwtConfig } from './config/jwt.config';
import { paymentConfig } from './config/payment.config';
import { rateLimitConfig } from './config/rate-limit.config';
import { smtpConfig } from './config/smtp.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
      load: [
        appConfig,
        apiConfig,
        clientConfig,
        databaseConfig,
        jwtConfig,
        rateLimitConfig,
        smtpConfig,
        paymentConfig,
      ],
    }),

    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => config.getOrThrow('database'),
    }),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
