import { BookingStatus } from 'src/common/enums/booking-status.enum';
import { Booking } from '../entities/booking.entity';

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
  total: string;
}

export interface PeakHourStat {
  hour: number;
  count: string;
}

export interface BookedMinutesStats {
  totalMinutes: string | null;
}

export type PaginatedBookingsResponse = {
  bookings: Booking[];
  meta: {
    totalItems: number;
    currentPage: number;
    lastPage: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
};
