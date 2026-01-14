import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import dayjs from 'dayjs';
import { BookingStatus } from 'src/common/enums/booking-status.enum';
import { BookingType } from 'src/common/enums/booking-type.enum';
import { DayOfWeek } from 'src/common/enums/day-of-week.enum';
import { NotificationType } from 'src/common/enums/notification-type.enum';
import { Order } from 'src/common/enums/order.enum';
import { PaymentStatus } from 'src/common/enums/payment-status.enum';
import { CourtPricingService } from 'src/modules/court/services/court-pricing.service';
import { CourtService } from 'src/modules/court/services/court.service';
import { NotificationService } from 'src/modules/notification/notification.service';
import { LoggerService } from 'src/providers/logger/logger.service';
import { Brackets, DataSource, Not, Repository } from 'typeorm';
import { BookingListQueryDto } from '../dtos/booking-list-query.dto';
import { CreateBookingDto } from '../dtos/create-booking.dto';
import { Booking } from '../entities/booking.entity';
import { CreateBookingPayload } from '../types/booking.type';
import { BookingGroupService } from './booking-group.service';

@Injectable()
export class BookingService {
  private readonly CONTEXT = BookingService.name;

  constructor(
    private readonly logger: LoggerService,

    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,

    @Inject(forwardRef(() => CourtService))
    private readonly courtService: CourtService,

    private readonly courtPricingService: CourtPricingService,
    private readonly notificationService: NotificationService,
    private readonly bookingGroupService: BookingGroupService,
    private readonly dataSource: DataSource,
  ) {
    this.logger.log('BookingService initialized', this.CONTEXT);
  }

  async createBooking(userId: string, dto: CreateBookingDto) {
    this.logger.debug(
      `Attempting to create booking - User: ${userId}, Court: ${dto.courtId}, Type: ${dto.type}`,
      this.CONTEXT,
    );

    const court = await this.courtService.getCourtById(dto.courtId);

    const datesToBook = this.generateBookingDates(dto);
    if (datesToBook.length === 0) {
      throw new BadRequestException('No valid dates found for booking');
    }

    const now = dayjs();
    const today = now.startOf('day');

    for (const dateStr of datesToBook) {
      const bookingDate = dayjs(dateStr);

      // Nếu ngày đặt đã qua
      if (bookingDate.isBefore(today)) {
        this.logger.warn(`Attempted booking in the past date: ${dateStr}`, this.CONTEXT);
        throw new BadRequestException(`Cannot book for a date in the past: ${dateStr}`);
      }

      // Nếu là ngày hôm nay, phải kiểm tra giờ bắt đầu
      if (bookingDate.isSame(today, 'day')) {
        const bookingStart = dayjs(`${dateStr} ${dto.startTime}`);
        if (bookingStart.isBefore(now)) {
          this.logger.warn(
            `Attempted booking in the past time: ${dateStr} ${dto.startTime}`,
            this.CONTEXT,
          );
          throw new BadRequestException(
            `Cannot book for a time in the past: ${dto.startTime} today`,
          );
        }
      }
    }

    const bookingsData: CreateBookingPayload[] = [];
    let totalAmount = 0;

    // Tính giá tiền và chuẩn bị dữ liệu
    for (const dateStr of datesToBook) {
      // Tính giá tiền cho mỗi slot dựa trên type sân và startTime
      const pricePerSlot = await this.courtPricingService.calculatePrice(court.type, dto.startTime);

      // tính toán thời lượng đặt
      const start = dayjs(`2000-01-01 ${dto.startTime}`);
      const end = dayjs(`2000-01-01 ${dto.endTime}`);
      const durationHours = end.diff(start, 'hour', true);

      // giá mỗi slot * số lượng slot
      // Math.ceil(durationHours * 2) / 2 để làm tròn theo block (30 phút)
      const totalPrice = (pricePerSlot * Math.ceil(durationHours * 2)) / 2;

      // đẩy data vào mảng để chuẩn bị tạo booking
      bookingsData.push({
        date: dateStr,
        startTime: dto.startTime,
        endTime: dto.endTime,
        price: totalPrice,
        courtId: dto.courtId,
        userId: userId,
        status: BookingStatus.PENDING,
      });

      totalAmount += totalPrice;
    }

    // khởi tạo transtaction
    // Dùng QueryRunner để kiểm soát việc lưu dữ liệu.
    // Nếu một bước lỗi, toàn bộ các bước trước đó sẽ bị hủy (Rollback)
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // kiểm tra trùng lịch
      for (const booking of bookingsData) {
        // kiểm tra trong database có booking nào trùng với booking hiện tại không
        const conflict = await queryRunner.manager
          .createQueryBuilder(Booking, 'b')
          .where('b.courtId = :courtId', { courtId: dto.courtId })
          .andWhere('b.date = :date', { date: booking.date })
          .andWhere('b.status != :cancelled', {
            cancelled: BookingStatus.CANCELLED,
          })

          // giờ bắt đầu mới < giờ kết thúc cũ và giờ kết thúc mới > giờ bắt đầu cũ
          .andWhere('(b.startTime < :endTime AND b.endTime > :startTime)', {
            startTime: dto.startTime,
            endTime: dto.endTime,
          })
          .getOne();

        if (conflict) {
          throw new ConflictException(
            `Slot on ${booking.date} ${dto.startTime}-${dto.endTime} is already booked.`,
          );
        }
      }

      // Tạo booking cha
      const savedGroup = await this.bookingGroupService.createBookingGroup(
        {
          userId,
          totalAmount,
          isRecurring: dto.type === BookingType.RECURRING,
          note: dto.note,
        },
        queryRunner.manager, // truyền manager để thực hiện chung transaction
      );

      // tạo các booking con
      const bookingEntities = this.bookingRepository.create(
        bookingsData.map((b) => ({ ...b, groupId: savedGroup.id })),
      );

      // lưu các booking con vào database
      await queryRunner.manager.save(bookingEntities);

      // nếu đến đây mà không có lỗi, chính thức lưu mọi thứ vào database
      await queryRunner.commitTransaction();

      this.logger.log(
        `Booking created successfully - GroupID: ${savedGroup.id}, Count: ${bookingsData.length}`,
        this.CONTEXT,
      );

      this.notificationService
        .createNotification(
          userId,
          NotificationType.BOOKING_CREATED,
          'Booking Successful',
          `You have successfully booked ${bookingsData.length} time slots for court ${court.name}.`,
          { groupId: savedGroup.id },
        )
        .catch((err) =>
          this.logger.warn(
            `Failed to send booking notification: ${err instanceof Error ? err.message : 'Unknown error'}`,
            this.CONTEXT,
          ),
        );

      return {
        message: 'Booking created successfully',
        groupId: savedGroup.id,
        count: bookingsData.length,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(
        `Failed to create booking for user ${userId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
        this.CONTEXT,
      );
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async getBookingList(dto: BookingListQueryDto) {
    try {
      const {
        page = 1,
        pageSize = 10,
        courtId,
        date,
        status,
        paymentStatus,
        userId,
        search,
        sortOrder = Order.DESC,
      } = dto;
      const skip = (page - 1) * pageSize;

      this.logger.debug(
        `Fetching booking list - Page: ${page}, Size: ${pageSize}, Search: ${search || 'none'}`,
        this.CONTEXT,
      );

      const queryBuilder = this.bookingRepository
        .createQueryBuilder('booking')
        .leftJoinAndSelect('booking.court', 'court')
        .leftJoinAndSelect('booking.user', 'user')
        .leftJoinAndSelect('booking.group', 'group');

      // Các bộ lọc cơ bản
      if (courtId) {
        queryBuilder.andWhere('booking.courtId = :courtId', { courtId });
      }
      if (date) {
        queryBuilder.andWhere('booking.date = :date', { date });
      }
      if (status) {
        queryBuilder.andWhere('booking.status = :status', { status });
      }
      if (paymentStatus) {
        queryBuilder.andWhere('booking.paymentStatus = :paymentStatus', { paymentStatus });
      }
      if (userId) {
        queryBuilder.andWhere('booking.userId = :userId', { userId });
      }

      // Tìm kiếm theo thông tin User hoặc Court
      if (search) {
        queryBuilder.andWhere(
          new Brackets((qb) => {
            qb.where('user.fullName ILIKE :search', { search: `%${search}%` })
              .orWhere('user.email ILIKE :search', { search: `%${search}%` })
              .orWhere('user.phoneNumber ILIKE :search', { search: `%${search}%` })
              .orWhere('court.name ILIKE :search', { search: `%${search}%` });
          }),
        );
      }

      // Sắp xếp theo ngày và giờ bắt đầu
      queryBuilder.orderBy('booking.date', sortOrder);
      queryBuilder.addOrderBy('booking.startTime', sortOrder);

      queryBuilder.skip(skip).take(pageSize);

      const [data, total] = await queryBuilder.getManyAndCount();

      this.logger.debug(
        `Booking list retrieved - Found: ${data.length}, Total: ${total}`,
        this.CONTEXT,
      );

      return {
        data,
        total,
        page,
        lastPage: Math.ceil(total / pageSize),
      };
    } catch (error) {
      this.logger.error(
        `Failed to fetch booking list: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
        this.CONTEXT,
      );
      throw error;
    }
  }

  async getUserBookingList(userId: string) {
    try {
      this.logger.debug(`Fetching user booking history - User: ${userId}`, this.CONTEXT);

      const bookings = await this.bookingRepository.find({
        where: { userId },
        relations: ['court', 'group'],
        order: { date: 'DESC', startTime: 'DESC' },
      });

      this.logger.debug(`Found ${bookings.length} bookings for user ${userId}`, this.CONTEXT);
      return bookings;
    } catch (error) {
      this.logger.error(
        `Failed to fetch user booking history ${userId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
        this.CONTEXT,
      );
      throw error;
    }
  }

  async getActiveBookingsForCourtAndDate(courtId: string, date: string) {
    try {
      this.logger.debug(
        `Querying active bookings - Court: ${courtId}, Date: ${date}`,
        this.CONTEXT,
      );

      const bookings = await this.bookingRepository.find({
        where: {
          courtId,
          date,
          status: Not(BookingStatus.CANCELLED),
        },
      });

      this.logger.debug(
        `Found ${bookings.length} active bookings for court ${courtId} on ${date}`,
        this.CONTEXT,
      );

      return bookings;
    } catch (error) {
      this.logger.error(
        `Failed to query active bookings for court ${courtId} on ${date}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
        this.CONTEXT,
      );
      throw error;
    }
  }

  async getBookingsByCourtAndDate(courtId: string, date: string) {
    try {
      this.logger.debug(`Getting all bookings for court ${courtId} on ${date}`, this.CONTEXT);

      const bookings = await this.bookingRepository.find({
        where: {
          courtId,
          date,
        },
        select: ['startTime', 'endTime'],
      });

      this.logger.debug(
        `Found ${bookings.length} bookings for court ${courtId} on ${date}`,
        this.CONTEXT,
      );
      return bookings;
    } catch (error) {
      this.logger.error(
        `Failed to get bookings for court ${courtId} on ${date}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
        this.CONTEXT,
      );
      throw error;
    }
  }

  async cancelBooking(userId: string, bookingId: string, isAdmin: boolean = false) {
    try {
      this.logger.debug(
        `Booking cancellation attempt - User: ${userId}, Booking: ${bookingId}, Admin: ${isAdmin}`,
        this.CONTEXT,
      );

      const booking = await this.bookingRepository.findOne({
        where: { id: bookingId },
        relations: ['court'],
      });

      if (!booking) {
        this.logger.warn(`Booking not found for cancellation: ${bookingId}`, this.CONTEXT);
        throw new BadRequestException('Booking not found');
      }

      if (!isAdmin && booking.userId !== userId) {
        this.logger.warn(
          `Unauthorized booking cancellation - User: ${userId}, Booking: ${bookingId} (Owner: ${booking.userId})`,
          this.CONTEXT,
        );
        throw new BadRequestException('You do not have permission to cancel this booking');
      }

      if (booking.status === BookingStatus.CANCELLED) {
        this.logger.warn(`Booking already cancelled: ${bookingId}`, this.CONTEXT);
        throw new BadRequestException('Booking is already cancelled');
      }

      // Check time rule: Can only cancel 24h before
      const bookingStart = dayjs(`${booking.date} ${booking.startTime}`);
      const now = dayjs();
      const diffHours = bookingStart.diff(now, 'hour');

      if (!isAdmin && diffHours < 24) {
        this.logger.warn(
          `Late cancellation attempt - Booking: ${bookingId}, Hours until start: ${diffHours.toFixed(1)}`,
          this.CONTEXT,
        );
        throw new BadRequestException('Cannot cancel booking less than 24 hours before start time');
      }

      booking.status = BookingStatus.CANCELLED;
      await this.bookingRepository.save(booking);

      this.logger.log(
        `Booking cancelled successfully - ID: ${bookingId}, Court: ${booking.court?.name}, Date: ${booking.date}`,
        this.CONTEXT,
      );

      return { message: 'Booking cancelled successfully' };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(
        `Failed to cancel booking ${bookingId} for user ${userId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
        this.CONTEXT,
      );
      throw error;
    }
  }

  async updatePaymentStatus(
    bookingId: string,
    status: PaymentStatus,
    bookingStatus?: BookingStatus,
  ) {
    try {
      this.logger.debug(
        `Updating payment status - Booking: ${bookingId}, Payment: ${status}, Booking: ${bookingStatus || 'unchanged'}`,
        this.CONTEXT,
      );

      const booking = await this.bookingRepository.findOne({
        where: { id: bookingId },
        relations: ['court', 'user'],
      });

      if (!booking) {
        this.logger.warn(`Booking not found for payment status update: ${bookingId}`, this.CONTEXT);
        throw new NotFoundException('Booking not found');
      }

      const oldPaymentStatus = booking.paymentStatus;
      const oldBookingStatus = booking.status;

      booking.paymentStatus = status;
      if (bookingStatus) {
        booking.status = bookingStatus;
      }

      const updatedBooking = await this.bookingRepository.save(booking);

      this.logger.log(
        `Payment status updated - Booking: ${bookingId}, Payment: ${oldPaymentStatus} -> ${status}, Booking: ${oldBookingStatus} -> ${updatedBooking.status}`,
        this.CONTEXT,
      );

      return updatedBooking;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `Failed to update payment status for booking ${bookingId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
        this.CONTEXT,
      );
      throw error;
    }
  }

  private generateBookingDates(dto: CreateBookingDto): string[] {
    try {
      if (dto.type === BookingType.SINGLE) {
        if (!dto.date) {
          this.logger.warn('Single booking missing required date', this.CONTEXT);
          throw new BadRequestException('Booking date is required');
        }
        this.logger.debug(`Generated single booking date: ${dto.date}`, this.CONTEXT);
        return [dto.date];
      }

      const dates: string[] = [];
      let current = dayjs(dto.startDate);
      const end = dayjs(dto.endDate);

      this.logger.debug(
        `Generating recurring booking dates from ${dto.startDate} to ${dto.endDate} for days: ${dto.daysOfWeek?.join(', ')}`,
        this.CONTEXT,
      );

      while (current.isSame(end) || current.isBefore(end)) {
        const currentDayOfWeek = current.format('dddd').toUpperCase() as DayOfWeek;
        if (dto.daysOfWeek?.includes(currentDayOfWeek)) {
          dates.push(current.format('YYYY-MM-DD'));
        }
        current = current.add(1, 'day');
      }

      this.logger.debug(`Generated ${dates.length} recurring booking dates`, this.CONTEXT);
      return dates;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(
        `Failed to generate booking dates: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
        this.CONTEXT,
      );
      throw error;
    }
  }
}
