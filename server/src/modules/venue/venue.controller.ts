import { Body, Controller, Get, HttpCode, HttpStatus, Patch } from '@nestjs/common';
import { Public } from 'src/common/decorators/public.decorator';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from 'src/common/enums/role.enum';
import { UpdateOperatingHoursDto } from './dtos/update-operating-hours.dto';
import { UpdateVenueConfigDto } from './dtos/update-venue-config.dto';
import { OperatingHourService } from './services/operating-hour.service';
import { VenueService } from './services/venue.service';

@Controller('venue')
export class VenueController {
  constructor(
    private readonly venueService: VenueService,
    private readonly operatingHourService: OperatingHourService,
  ) {}

  @Get()
  @Public()
  @HttpCode(HttpStatus.OK)
  async getVenueInfo() {
    const [venueConfiguration, operatingHours] = await Promise.all([
      this.venueService.getVenueConfig(),
      this.operatingHourService.getOperatingHours(),
    ]);

    return {
      venueConfiguration,
      operatingHours,
    };
  }

  // admin/manager
  @Patch('config')
  @Roles(Role.ADMIN, Role.MANAGER)
  @HttpCode(HttpStatus.OK)
  async updateConfig(@Body() dto: UpdateVenueConfigDto) {
    return this.venueService.updateVenueConfig(dto);
  }

  @Patch('hours')
  @Roles(Role.ADMIN, Role.MANAGER)
  @HttpCode(HttpStatus.OK)
  async updateHours(@Body() dto: UpdateOperatingHoursDto) {
    return this.operatingHourService.updateOperatingHours(dto);
  }
}
