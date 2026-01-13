import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { configurations } from './config/index.config';
import { LoggerModule } from './providers/logger/logger.module';
import { SmtpModule } from './providers/smtp/smtp.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
      load: configurations,
    }),

    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => config.getOrThrow('database'),
    }),

    LoggerModule,

    SmtpModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
