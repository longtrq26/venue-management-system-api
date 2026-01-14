import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CourtModule } from '../court/court.module';
import { NotificationModule } from '../notification/notification.module';
import { BookingController } from './booking.controller';
import { BookingGroup } from './entities/booking-group.entity';
import { Booking } from './entities/booking.entity';
import { BookingGroupService } from './services/booking-group.service';
import { BookingService } from './services/booking.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Booking, BookingGroup]),
    forwardRef(() => CourtModule),
    NotificationModule,
  ],
  controllers: [BookingController],
  providers: [BookingService, BookingGroupService],
  exports: [BookingService, BookingGroupService],
})
export class BookingModule {}
