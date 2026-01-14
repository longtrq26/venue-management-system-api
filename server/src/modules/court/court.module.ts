import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookingModule } from '../booking/booking.module';
import { VenueModule } from '../venue/venue.module';
import { CourtController } from './court.controller';
import { CourtPricing } from './entities/court-pricing.entity';
import { Court } from './entities/court.entity';
import { CourtPricingService } from './services/court-pricing.service';
import { CourtService } from './services/court.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Court, CourtPricing]),
    VenueModule,
    forwardRef(() => BookingModule),
  ],
  controllers: [CourtController],
  providers: [CourtService, CourtPricingService],
  exports: [CourtService, CourtPricingService],
})
export class CourtModule {}
