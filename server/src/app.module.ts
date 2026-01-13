import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccessTokenGuard } from './common/guards/access-token.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { configurations } from './config/index.config';
import { AuthModule } from './modules/auth/auth.module';
import { BookingModule } from './modules/booking/booking.module';
import { CourtModule } from './modules/court/court.module';
import { NotificationModule } from './modules/notification/notification.module';
import { UserModule } from './modules/user/user.module';
import { LoggerModule } from './providers/logger/logger.module';
import { SmtpModule } from './providers/smtp/smtp.module';
import { VenueModule } from './modules/venue/venue.module';
import { PaymentModule } from './modules/payment/payment.module';

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
      useClass: AccessTokenGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
