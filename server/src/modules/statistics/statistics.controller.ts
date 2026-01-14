import { Controller, Get, Query } from '@nestjs/common';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from 'src/common/enums/role.enum';
import { StatisticsService } from './statistics.service';

@Controller('statistics')
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  @Get()
  @Roles(Role.ADMIN, Role.MANAGER)
  async getStatistics(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('courtId') courtId?: string,
  ) {
    return this.statisticsService.getStatistics(startDate, endDate, courtId);
  }
}
