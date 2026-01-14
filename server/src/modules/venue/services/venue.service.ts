import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LoggerService } from 'src/providers/logger/logger.service';
import { Repository } from 'typeorm';
import { UpdateVenueConfigDto } from '../dtos/update-venue-config.dto';
import { VenueConfiguration } from '../entities/venue-configuration.entity';

@Injectable()
export class VenueService implements OnModuleInit {
  private readonly CONTEXT = VenueService.name;

  constructor(
    private readonly logger: LoggerService,
    @InjectRepository(VenueConfiguration)
    private readonly venueRepository: Repository<VenueConfiguration>,
  ) {
    this.logger.log('VenueService initialized with repository', this.CONTEXT);
  }

  async onModuleInit() {
    try {
      const count = await this.venueRepository.count();
      if (count === 0) {
        this.logger.log('Seeding default venue configuration...', this.CONTEXT);
        await this.venueRepository.save(this.venueRepository.create());
        this.logger.log('Default venue configuration seeded successfully', this.CONTEXT);
      } else {
        this.logger.debug(`Venue configuration already exists (${count} records)`, this.CONTEXT);
      }
    } catch (error) {
      this.logger.error(
        `Failed to initialize venue configuration: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
        this.CONTEXT,
      );
      throw error;
    }
  }

  async getVenueConfig(): Promise<VenueConfiguration> {
    try {
      const config = await this.venueRepository.findOne({
        where: {},
        relations: ['operatingHours'],
      });
      if (!config) {
        this.logger.debug('No venue configuration found, creating default...', this.CONTEXT);
        const newConfig = this.venueRepository.create();
        const savedConfig = await this.venueRepository.save(newConfig);
        this.logger.log('Default venue configuration created', this.CONTEXT);
        return savedConfig;
      }

      this.logger.debug('Venue configuration retrieved', this.CONTEXT);
      return config;
    } catch (error) {
      this.logger.error(
        `Failed to get venue configuration: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
        this.CONTEXT,
      );
      throw error;
    }
  }

  async updateVenueConfig(dto: UpdateVenueConfigDto): Promise<VenueConfiguration> {
    try {
      this.logger.debug(
        `Updating venue configuration with fields: ${Object.keys(dto).join(', ')}`,
        this.CONTEXT,
      );

      const config = await this.getVenueConfig();

      const updatedConfig = this.venueRepository.merge(config, dto);
      const savedConfig = await this.venueRepository.save(updatedConfig);

      this.logger.log('Venue configuration updated successfully', this.CONTEXT);
      return savedConfig;
    } catch (error) {
      this.logger.error(
        `Failed to update venue configuration: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
        this.CONTEXT,
      );
      throw error;
    }
  }
}
