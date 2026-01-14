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
