import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LoggerService } from 'src/providers/logger/logger.service';
import { EntityManager, Repository } from 'typeorm';
import { BookingGroup } from '../entities/booking-group.entity';

@Injectable()
export class BookingGroupService {
  private readonly CONTEXT = BookingGroupService.name;

  constructor(
    private readonly logger: LoggerService,

    @InjectRepository(BookingGroup)
    private readonly bookingGroupRepository: Repository<BookingGroup>,
  ) {
    this.logger.log('BookingGroupService initialized', this.CONTEXT);
  }

  async createBookingGroup(
    data: Partial<BookingGroup>,
    manager?: EntityManager,
  ): Promise<BookingGroup> {
    try {
      this.logger.debug(
        `Creating booking group - User: ${data.userId}, Amount: ${data.totalAmount}, Recurring: ${data.isRecurring}`,
        this.CONTEXT,
      );

      const repo = manager ? manager.getRepository(BookingGroup) : this.bookingGroupRepository;
      const isInTransaction = !!manager;

      if (isInTransaction) {
        this.logger.debug('Using transaction manager for booking group creation', this.CONTEXT);
      }

      const group = repo.create(data);
      const savedGroup = await repo.save(group);

      this.logger.log(
        `Booking group created successfully - ID: ${savedGroup.id}, User: ${savedGroup.userId}, Amount: ${savedGroup.totalAmount}, Transaction: ${isInTransaction}`,
        this.CONTEXT,
      );

      return savedGroup;
    } catch (error) {
      const errorMessage = `Failed to create booking group for user ${data.userId}: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`;
      this.logger.error(
        errorMessage,
        error instanceof Error ? error.stack : undefined,
        this.CONTEXT,
      );
      throw error;
    }
  }

  async getBookingGroupById(id: string): Promise<BookingGroup | null> {
    try {
      this.logger.debug(`Fetching booking group by ID: ${id}`, this.CONTEXT);

      const group = await this.bookingGroupRepository.findOne({
        where: { id },
        relations: ['bookings', 'user'],
      });

      if (!group) {
        this.logger.debug(`Booking group not found: ${id}`, this.CONTEXT);
        return null;
      }

      return group;
    } catch (error) {
      const errorMessage = `Failed to get booking group ${id}: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`;
      this.logger.error(
        errorMessage,
        error instanceof Error ? error.stack : undefined,
        this.CONTEXT,
      );
      throw error;
    }
  }
}
