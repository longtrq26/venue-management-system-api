import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OperatingHour } from './entities/operating-hour.entity';
import { VenueConfiguration } from './entities/venue-configuration.entity';
import { OperatingHourService } from './services/operating-hour.service';
import { VenueService } from './services/venue.service';
import { VenueController } from './venue.controller';

@Module({
  imports: [TypeOrmModule.forFeature([VenueConfiguration, OperatingHour])],
  controllers: [VenueController],
  providers: [VenueService, OperatingHourService],
  exports: [VenueService, OperatingHourService],
})
export class VenueModule {}
