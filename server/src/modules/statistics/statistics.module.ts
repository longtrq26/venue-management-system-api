import { Module } from '@nestjs/common';
import { BookingModule } from '../booking/booking.module';
import { CourtModule } from '../court/court.module';
import { VenueModule } from '../venue/venue.module';
import { StatisticsController } from './statistics.controller';
import { StatisticsService } from './statistics.service';

@Module({
  imports: [BookingModule, CourtModule, VenueModule],
  controllers: [StatisticsController],
  providers: [StatisticsService],
})
export class StatisticsModule {}
