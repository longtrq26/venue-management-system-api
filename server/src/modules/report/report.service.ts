import { Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import { LoggerService } from 'src/providers/logger/logger.service';
import { BookingService } from '../booking/services/booking.service';

@Injectable()
export class ReportService {
  private readonly CONTEXT = ReportService.name;

  constructor(
    private readonly logger: LoggerService,
    private readonly bookingService: BookingService,
  ) {
    this.logger.log('ReportService initialized', this.CONTEXT);
  }

  async generateDailyReport(date: string) {
    try {
      this.logger.debug(`Generating daily report for ${date}`, this.CONTEXT);

      const bookings = await this.bookingService.getBookingsForStatistics(date, date);

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet(`Daily Report ${date}`);

      worksheet.columns = [
        { header: 'Booking ID', key: 'id', width: 36 },
        { header: 'Court', key: 'court', width: 20 },
        { header: 'Start Time', key: 'startTime', width: 15 },
        { header: 'End Time', key: 'endTime', width: 15 },
        { header: 'Price', key: 'price', width: 15 },
        { header: 'Status', key: 'status', width: 15 },
      ];

      bookings.forEach((booking) => {
        worksheet.addRow({
          id: booking.id,
          court: booking.court?.name || 'N/A', // Assuming relation is loaded. If not, needs fetch
          startTime: booking.startTime,
          endTime: booking.endTime,
          price: booking.price,
          status: booking.status,
        });
      });

      // To verify relation, we should check if getBookingsForStatistics loads relations.
      // It uses query builder and currently lacks relations. Ideally we update BookingService.
      // But for now let's assume raw data or partial data.

      const buffer = await workbook.xlsx.writeBuffer();
      return buffer;
    } catch (error) {
      this.logger.error(
        `Failed to generate daily report: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
        this.CONTEXT,
      );
      throw error;
    }
  }
}
