import { Module } from '@nestjs/common';
import { CourtController } from './court.controller';
import { CourtService } from './services/court.service';

@Module({
  controllers: [CourtController],
  providers: [CourtService],
})
export class CourtModule {}
