import { Module } from '@nestjs/common';
import { BookingModule } from '../booking/booking.module';
import { ReportController } from './report.controller';
import { ReportService } from './report.service';

@Module({
  imports: [BookingModule],
  controllers: [ReportController],
  providers: [ReportService],
})
export class ReportModule {}
