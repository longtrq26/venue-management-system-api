import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import dayjs from 'dayjs';
import { DayOfWeek } from 'src/common/enums/day-of-week.enum';
import { BookingService } from 'src/modules/booking/services/booking.service';
import { VenueService } from 'src/modules/venue/services/venue.service';
import { LoggerService } from 'src/providers/logger/logger.service';
import { IsNull, Not, Repository } from 'typeorm';
import { CourtListQueryDto } from '../dtos/court-list-query.dto';
import { CreateCourtDto } from '../dtos/create-court.dto';
import { UpdateCourtDto } from '../dtos/update-court.dto';
import { Court } from '../entities/court.entity';
import { CourtPricingService } from './court-pricing.service';

export interface CourtSlot {
  startTime: string;
  endTime: string;
  price: number;
  status: 'OCCUPIED' | 'FREE';
}

@Injectable()
export class CourtService {
  private readonly CONTEXT = CourtService.name;

  constructor(
    private readonly logger: LoggerService,
    @InjectRepository(Court)
    private readonly courtRepository: Repository<Court>,

    private readonly venueService: VenueService,
    private readonly courtPricing: CourtPricingService,
    private readonly bookingService: BookingService,
  ) {
    this.logger.log('CourtService initialized with dependencies', this.CONTEXT);
  }

  async createCourt(dto: CreateCourtDto) {
    try {
      this.logger.debug(`Creating court: ${dto.name}, Type: ${dto.type}`, this.CONTEXT);

      const existingCourt = await this.courtRepository.findOne({
        where: { name: dto.name },
      });

      if (existingCourt) {
        this.logger.warn(`Court creation failed - name already exists: ${dto.name}`, this.CONTEXT);
        throw new ConflictException('Court name already exists');
      }

      const court = this.courtRepository.create(dto);
      const savedCourt = await this.courtRepository.save(court);

      this.logger.log(
        `Court created successfully - ID: ${savedCourt.id}, Name: ${savedCourt.name}, Type: ${savedCourt.type}`,
        this.CONTEXT,
      );

      return savedCourt;
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      this.logger.error(
        `Failed to create court ${dto.name}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
        this.CONTEXT,
      );
      throw error;
    }
  }

  async getCourtList(dto: CourtListQueryDto) {
    try {
      const { type, status, search, page = 1, pageSize = 10 } = dto;

      this.logger.debug(
        `Fetching courts - Page: ${page}, Size: ${pageSize}, Type: ${type || 'all'}, Status: ${status || 'all'}, Search: ${search || 'none'}`,
        this.CONTEXT,
      );

      const queryBuilder = this.courtRepository.createQueryBuilder('court');

      if (type) {
        queryBuilder.andWhere('court.type = :type', { type });
      }
      if (status) {
        queryBuilder.andWhere('court.status = :status', { status });
      }
      if (search) {
        queryBuilder.andWhere('court.name ILIKE :search', {
          search: `%${search}%`,
        });
      }

      queryBuilder.skip((page - 1) * pageSize).take(pageSize);

      const [data, total] = await queryBuilder.getManyAndCount();

      this.logger.debug(
        `Courts retrieved - Found: ${data.length}, Total: ${total}, Page: ${page}/${Math.ceil(total / pageSize)}`,
        this.CONTEXT,
      );

      return { data, total, page, lastPage: Math.ceil(total / pageSize) };
    } catch (error) {
      this.logger.error(
        `Failed to fetch court list: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
        this.CONTEXT,
      );
      throw error;
    }
  }

  async getCourtById(courtId: string) {
    try {
      const court = await this.courtRepository.findOne({
        where: { id: courtId },
      });
      if (!court) {
        this.logger.warn(`Court not found: ${courtId}`, this.CONTEXT);
        throw new NotFoundException('Court not found');
      }

      this.logger.debug(`Court found: ${court.name} (${courtId})`, this.CONTEXT);
      return court;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `Failed to get court by ID ${courtId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
        this.CONTEXT,
      );
      throw error;
    }
  }

  async deleteCourt(courtId: string) {
    try {
      const court = await this.courtRepository.findOne({
        where: { id: courtId, deletedAt: IsNull() },
      });

      if (!court) {
        this.logger.warn(`Court not found for deletion: ${courtId}`, this.CONTEXT);
        throw new NotFoundException('Court not found');
      }

      const result = await this.courtRepository.softDelete(courtId);

      this.logger.log(
        `Court soft-deleted - ID: ${courtId}, Name: ${court.name}, Type: ${court.type}`,
        this.CONTEXT,
      );

      return result;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `Failed to delete court ${courtId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
        this.CONTEXT,
      );
      throw error;
    }
  }

  async updateCourt(courtId: string, dto: UpdateCourtDto) {
    try {
      this.logger.debug(
        `Updating court ${courtId} with fields: ${Object.keys(dto).join(', ')}`,
        this.CONTEXT,
      );

      const court = await this.getCourtById(courtId);

      const isChanged = Object.keys(dto).some((key) => {
        if (dto[key] === undefined) return false;

        return dto[key] !== court[key];
      });

      if (!isChanged) {
        this.logger.debug(
          `No changes detected for court ${courtId}, skipping update`,
          this.CONTEXT,
        );
        return court;
      }

      this.logger.debug(
        `Updating court ${courtId} with fields: ${Object.keys(dto).join(', ')}`,
        this.CONTEXT,
      );

      if (dto.name && dto.name !== court.name) {
        const existingName = await this.courtRepository.findOne({
          where: { name: dto.name, id: Not(courtId) },
        });

        if (existingName) {
          this.logger.warn(`Court update failed - name conflict: ${dto.name}`, this.CONTEXT);
          throw new ConflictException('Court name already exists');
        }
      }

      Object.assign(court, dto);
      const updatedCourt = await this.courtRepository.save(court);

      this.logger.log(
        `Court updated successfully - ID: ${courtId}, Name: ${updatedCourt.name}`,
        this.CONTEXT,
      );

      return updatedCourt;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ConflictException) {
        throw error;
      }
      this.logger.error(
        `Failed to update court ${courtId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
        this.CONTEXT,
      );
      throw error;
    }
  }

  async getAvailableSlotsInCourt(courtId: string, dateStr: string) {
    try {
      this.logger.debug(`Checking availability for court ${courtId} on ${dateStr}`, this.CONTEXT);

      // kiểm tra sân có tồn tại không
      const court = await this.courtRepository.findOne({
        where: { id: courtId },
      });

      if (!court) {
        this.logger.warn(`Court not found for availability check: ${courtId}`, this.CONTEXT);
        throw new NotFoundException('Court not found');
      }

      const date = dayjs(dateStr, 'YYYY-MM-DD');

      // kiểm tra xem chuỗi ngày gửi lên có đúng định dạng không
      if (!date.isValid()) {
        this.logger.warn(`Invalid date format: ${dateStr}`, this.CONTEXT);
        throw new BadRequestException('Invalid date format. Use YYYY-MM-DD');
      }

      // lấy thời điểm bắt đầu của ngày hôm nay để so sánh
      const today = dayjs().startOf('day');

      // nếu ngày gửi lên nhỏ hơn ngày hôm nay thì trả về không có sân
      if (date.isBefore(today)) {
        this.logger.debug(`Date is in the past: ${dateStr}`, this.CONTEXT);
        return {
          court,
          date: dateStr,
          isClosed: true,
          slots: [],
          reason: 'Date is in the past',
        };
      }

      // xác định thứ trong tuần để so sánh
      const dayOfWeek = date.format('dddd').toUpperCase() as DayOfWeek;

      // lấy operatingHours từ venueConfig
      const config = await this.venueService.getVenueConfig();
      const operatingHours = config.operatingHours || [];

      // tìm giờ hoạt động của đúng ngày gửi lên
      const todayConfig = operatingHours.find((hour) => hour.day === dayOfWeek);
      if (!todayConfig) {
        this.logger.warn(`No operating hours configuration found for ${dayOfWeek}`, this.CONTEXT);
        return {
          court,
          isClosed: true,
          slots: [],
          reason: `Venue not configured for ${dayOfWeek}`,
        };
      }

      if (todayConfig.isClosed) {
        this.logger.debug(`Court is closed on ${dayOfWeek} (isClosed: true)`, this.CONTEXT);
        return { court, isClosed: true, slots: [], reason: 'Venue is closed today' };
      }

      const slots: CourtSlot[] = [];
      const slotDuration = config.slotDuration || 30;

      // thiết lập thời điểm hoạt động cho ngày gửi lên
      let current = dayjs(`${dateStr} ${todayConfig.openTime}`, 'YYYY-MM-DD HH:mm:ss');
      const closeTime = dayjs(`${dateStr} ${todayConfig.closeTime}`, 'YYYY-MM-DD HH:mm:ss');

      this.logger.debug(
        `Time range: ${current.format('HH:mm:ss')} to ${closeTime.format('HH:mm:ss')}, Slot duration: ${slotDuration}min`,
        this.CONTEXT,
      );

      // lấy danh sách booking của sân đã tồn tại trong ngày gửi lên
      const bookings = await this.bookingService.getBookingsByCourtAndDate(courtId, dateStr);
      this.logger.debug(
        `Found ${bookings.length} existing bookings for court ${courtId} on ${dateStr}`,
        this.CONTEXT,
      );

      // lặp từ thời điểm hoạt động cho đến thời điểm đóng cửa
      while (current.isBefore(closeTime)) {
        const startStr = current.format('HH:mm:ss');
        const next = current.add(slotDuration, 'minute');
        const startMoment = current;
        const endMoment = next;

        // tính toán giá cho mỗi slot giờ (với fallback: giá riêng sân -> giá chung loại sân)
        const price = await this.courtPricing.calculatePrice(court.type, startStr, courtId);

        // kiểm tra xem slot giờ này (startMoment -> endMoment) có bị book rồi không
        const isOccupied = bookings.some((b) => {
          const bookingStart = dayjs(`${dateStr} ${b.startTime}`, 'YYYY-MM-DD HH:mm:ss');
          const bookingEnd = dayjs(`${dateStr} ${b.endTime}`, 'YYYY-MM-DD HH:mm:ss');

          // một slot kết thúc tại 08:00 và slot khác bắt đầu tại 08:00 không coi là trùng
          // slot đang check là OCCUPIED nếu start của slot < end của booking và end của slot > start của booking
          const overlap = startMoment.isBefore(bookingEnd) && endMoment.isAfter(bookingStart);
          return overlap;
        });

        // đẩy slot vào kết quả
        slots.push({
          startTime: current.format('HH:mm'),
          endTime: next.format('HH:mm'),
          price: price,
          status: isOccupied ? 'OCCUPIED' : 'FREE',
        });

        // nhảy tới slot tiếp theo
        current = next;
      }

      const freeSlots = slots.filter((slot) => slot.status === 'FREE').length;
      this.logger.debug(
        `Availability calculated for court ${courtId} on ${dateStr} - Total slots: ${slots.length}, Free slots: ${freeSlots}`,
        this.CONTEXT,
      );

      return {
        court,
        date: dateStr,
        isClosed: false,
        slots,
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(
        `Failed to get available courts for ${courtId} on ${dateStr}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
        this.CONTEXT,
      );
      throw error;
    }
  }
}
