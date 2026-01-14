import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccessTokenGuard } from './common/guards/access-token.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { configurations } from './config/index.config';
import { AuthModule } from './modules/auth/auth.module';
import { BookingModule } from './modules/booking/booking.module';
import { CourtModule } from './modules/court/court.module';
import { NotificationModule } from './modules/notification/notification.module';
import { PaymentModule } from './modules/payment/payment.module';
import { UserModule } from './modules/user/user.module';
import { VenueModule } from './modules/venue/venue.module';
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

    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          name: 'short',
          ttl: config.getOrThrow('rateLimit.short.ttl'),
          limit: config.getOrThrow('rateLimit.short.limit'),
        },
        {
          name: 'long',
          ttl: config.getOrThrow('rateLimit.long.ttl'),
          limit: config.getOrThrow('rateLimit.long.limit'),
        },
      ],
    }),

    LoggerModule,
    SmtpModule,
    NotificationModule,
    UserModule,
    AuthModule,
    CourtModule,
    BookingModule,
    VenueModule,
    PaymentModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: AccessTokenGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
