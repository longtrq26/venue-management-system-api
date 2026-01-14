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
}
