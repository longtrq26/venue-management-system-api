import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DayOfWeek } from 'src/common/enums/day-of-week.enum';
import { LoggerService } from 'src/providers/logger/logger.service';
import { Repository } from 'typeorm';
import { UpdateOperatingHoursDto } from '../dtos/update-operating-hours.dto';
import { OperatingHour } from '../entities/operating-hour.entity';
import { VenueService } from './venue.service';

@Injectable()
export class OperatingHourService implements OnModuleInit {
  private readonly CONTEXT = OperatingHourService.name;

  constructor(
    private readonly logger: LoggerService,
    @InjectRepository(OperatingHour)
    private readonly operatingHourRepository: Repository<OperatingHour>,
    private readonly venueService: VenueService,
  ) {
    this.logger.log(
      'OperatingHourService initialized with repository and venue service injection',
      this.CONTEXT,
    );
  }

  async onModuleInit() {
    try {
      const count = await this.operatingHourRepository.count();
      if (count === 0) {
        this.logger.log('Seeding default operating hours for all days...', this.CONTEXT);

        const venueConfig = await this.venueService.getVenueConfig();

        const days = Object.values(DayOfWeek);
        const hours = days.map((day) =>
          this.operatingHourRepository.create({
            configurationId: venueConfig.id,
            day,
            openTime: '06:00:00',
            closeTime: '23:00:00',
            isClosed: false,
          }),
        );

        await this.operatingHourRepository.save(hours);
        this.logger.log(`Default operating hours seeded for ${days.length} days`, this.CONTEXT);
      } else {
        this.logger.debug(`Operating hours already exist (${count} records)`, this.CONTEXT);
      }
    } catch (error) {
      this.logger.error(
        `Failed to initialize operating hours: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
        this.CONTEXT,
      );
      throw error;
    }
  }

  async getOperatingHours(): Promise<OperatingHour[]> {
    try {
      const operatingHours = await this.operatingHourRepository.find();
      const dayOrder = Object.values(DayOfWeek); // ['MONDAY', 'TUESDAY', ..., 'SUNDAY']

      const sortedHours = operatingHours.sort(
        (a, b) => dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day),
      );

      this.logger.debug(`Retrieved ${operatingHours.length} operating hours`, this.CONTEXT);
      return sortedHours;
    } catch (error) {
      this.logger.error(
        `Failed to get operating hours: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
        this.CONTEXT,
      );
      throw error;
    }
  }

  async updateOperatingHours(dto: UpdateOperatingHoursDto): Promise<OperatingHour[]> {
    try {
      this.logger.debug(`Updating operating hours for ${dto.hours.length} days`, this.CONTEXT);

      const existingHours = await this.operatingHourRepository.find();
      const hoursMap = new Map(existingHours.map((h) => [h.day, h]));
      const hoursToSave: OperatingHour[] = [];

      for (const hourDto of dto.hours) {
        const existingHour = hoursMap.get(hourDto.day);
        if (existingHour) {
          this.operatingHourRepository.merge(existingHour, hourDto);
          hoursToSave.push(existingHour);
        } else {
          this.logger.warn(`Operating hour not found for day: ${hourDto.day}`, this.CONTEXT);
        }
      }

      if (hoursToSave.length > 0) {
        await this.operatingHourRepository.save(hoursToSave);
        this.logger.log(`Operating hours updated for ${hoursToSave.length} days`, this.CONTEXT);
      } else {
        this.logger.warn('No operating hours were updated', this.CONTEXT);
      }

      return this.getOperatingHours();
    } catch (error) {
      this.logger.error(
        `Failed to update operating hours: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
        this.CONTEXT,
      );
      throw error;
    }
  }
}
