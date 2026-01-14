import { Injectable } from '@nestjs/common';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import { LoggerService } from 'src/providers/logger/logger.service';
import { BookingService } from '../booking/services/booking.service';
import { CourtService } from '../court/services/court.service';
import { VenueService } from '../venue/services/venue.service';

dayjs.extend(isBetween);

@Injectable()
export class StatisticsService {
  private readonly CONTEXT = StatisticsService.name;

  constructor(
    private readonly logger: LoggerService,
    private readonly bookingService: BookingService,
    private readonly courtService: CourtService,
    private readonly venueService: VenueService,
  ) {
    this.logger.log('StatisticsService initialized', this.CONTEXT);
  }

  async getStatistics(startDate: string, endDate: string, courtId?: string) {
    try {
      this.logger.debug(
        `Calculating statistics from ${startDate} to ${endDate} ${courtId ? `for court ${courtId}` : ''}`,
        this.CONTEXT,
      );

      const [revenue, occupancy, peakHours] = await Promise.all([
        this.calculateTotalRevenue(startDate, endDate, courtId),
        this.calculateOccupancyRate(startDate, endDate, courtId),
        this.findPeakHours(startDate, endDate, courtId),
      ]);

      return {
        revenue,
        occupancy,
        peakHours,
      };
    } catch (error) {
      this.logger.error(
        `Failed to get statistics: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
        this.CONTEXT,
      );
      throw error;
    }
  }

  private async calculateTotalRevenue(startDate: string, endDate: string, courtId?: string) {
    return this.bookingService.getRevenueForStatistics(startDate, endDate, courtId);
  }

  private async calculateOccupancyRate(startDate: string, endDate: string, courtId?: string) {
    // 1. Get total booked minutes from DB Aggregation
    const totalBookedMinutes = await this.bookingService.getTotalBookedMinutes(
      startDate,
      endDate,
      courtId,
    );

    // 2. Calculate total available hours
    const venueConfig = await this.venueService.getVenueConfig();

    let totalAvailableMinutes = 0;
    const courtsCount = courtId ? 1 : await this.courtService.getCourtsCount();

    // Iterate each day in range to sum available minutes
    // Optimization: This loop is still JS but it's iterating days (max 366 for a year), not bookings (1 million).
    // So this is perfectly fine.
    let currentDate = dayjs(startDate);
    const end = dayjs(endDate);

    // Limit the loop to avoid infinite loop by accident
    // Max 2 years range
    const diffDays = end.diff(currentDate, 'days');
    if (diffDays > 730) {
      this.logger.warn(
        `Calculating statistics for > 2 years range is not recommended.`,
        this.CONTEXT,
      );
    }

    while (currentDate.isSame(end, 'day') || currentDate.isBefore(end, 'day')) {
      const dayOfWeek = currentDate.day(); // 0 (Sunday) to 6 (Saturday)

      const dayEnum = this.convertDayjsDayToEnum(dayOfWeek);
      // Ensure strict type match if DayOfWeek is string enum
      const operatingHour = venueConfig.operatingHours.find((oh) => oh.day.toString() === dayEnum);

      if (operatingHour && !operatingHour.isClosed) {
        const open = dayjs(`2000-01-01 ${operatingHour.openTime}`);
        const close = dayjs(`2000-01-01 ${operatingHour.closeTime}`);
        const minutes = close.diff(open, 'minute');
        totalAvailableMinutes += minutes * courtsCount;
      }
      currentDate = currentDate.add(1, 'day');
    }

    if (totalAvailableMinutes === 0) return 0;

    return Number(((totalBookedMinutes / totalAvailableMinutes) * 100).toFixed(2));
  }

  private async findPeakHours(startDate: string, endDate: string, courtId?: string) {
    // Use DB Aggregation directly
    const rawStats = await this.bookingService.getPeakHoursStats(startDate, endDate, courtId);

    // Format output
    return rawStats.map((stat) => ({
      hour: `${Math.floor(Number(stat.hour)).toString().padStart(2, '0')}:00`,
      count: Number(stat.count),
    }));
  }

  private convertDayjsDayToEnum(day: number) {
    const map = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    return map[day];
  }
}
