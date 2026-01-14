import { BookingStatus } from 'src/common/enums/booking-status.enum';

export interface CreateBookingPayload {
  date: string;
  startTime: string;
  endTime: string;
  price: number;
  courtId: string;
  userId: string;
  status: BookingStatus;
}
export interface BookingReservationStats {
  total: string; // SUM returns string in TypeORM raw results usually
}

export interface PeakHourStat {
  hour: number;
  count: string;
}

export interface BookedMinutesStats {
  totalMinutes: string | null;
}
