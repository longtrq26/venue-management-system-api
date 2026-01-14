import { Controller, Get, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from 'src/common/enums/role.enum';
import { ReportService } from './report.service';

@Controller('report')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Get('daily')
  @Roles(Role.ADMIN, Role.MANAGER)
  async generateDailyReport(@Query('date') date: string, @Res() res: Response) {
    const buffer = await this.reportService.generateDailyReport(date);

    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename=daily-report-${date}.xlsx`,
      'Content-Length': buffer.byteLength,
    });

    res.send(Buffer.from(buffer));
  }
}
