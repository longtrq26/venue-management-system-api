import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { Public } from 'src/common/decorators/public.decorator';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from 'src/common/enums/role.enum';
import { CourtListQueryDto } from './dtos/court-list-query.dto';
import { CreateCourtPricingDto } from './dtos/create-court-pricing.dto';
import { CreateCourtDto } from './dtos/create-court.dto';
import { UpdateCourtPricingDto } from './dtos/update-court-pricing.dto';
import { UpdateCourtDto } from './dtos/update-court.dto';
import { CourtPricingService } from './services/court-pricing.service';
import { CourtService } from './services/court.service';

@Controller('courts')
export class CourtController {
  constructor(
    private readonly courtService: CourtService,
    private readonly courtPricingService: CourtPricingService,
  ) {}

  @Public()
  @Get()
  @HttpCode(HttpStatus.OK)
  async getCourtList(@Query() query: CourtListQueryDto) {
    return this.courtService.getCourtList(query);
  }

  @Public()
  @Get(':id/available')
  @HttpCode(HttpStatus.OK)
  async getAvailableSlotsInCourt(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('date') date: string,
  ) {
    return this.courtService.getAvailableSlotsInCourt(id, date);
  }

  // court management
  @Post()
  @Roles(Role.ADMIN, Role.MANAGER)
  @HttpCode(HttpStatus.CREATED)
  async createCourt(@Body() dto: CreateCourtDto) {
    return await this.courtService.createCourt(dto);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.MANAGER)
  @HttpCode(HttpStatus.OK)
  async updateCourt(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateCourtDto) {
    return this.courtService.updateCourt(id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.MANAGER)
  @HttpCode(HttpStatus.OK)
  async deleteCourt(@Param('id', ParseUUIDPipe) id: string) {
    await this.courtService.deleteCourt(id);

    return {
      message: 'Court deleted successfully',
    };
  }

  // court pricing management
  @Post('pricing')
  @Roles(Role.ADMIN, Role.MANAGER)
  @HttpCode(HttpStatus.CREATED)
  async createCourtPricing(@Body() dto: CreateCourtPricingDto) {
    return await this.courtPricingService.createCourtPricing(dto);
  }

  @Patch('pricing/:id')
  @Roles(Role.ADMIN, Role.MANAGER)
  @HttpCode(HttpStatus.OK)
  async updateCourtPricing(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCourtPricingDto,
  ) {
    return await this.courtPricingService.updateCourtPricing(id, dto);
  }

  @Delete('pricing/:id')
  @Roles(Role.ADMIN, Role.MANAGER)
  @HttpCode(HttpStatus.OK)
  async deleteCourtPricing(@Param('id', ParseUUIDPipe) id: string) {
    await this.courtPricingService.deleteCourtPricing(id);

    return {
      message: 'Court pricing deleted successfully',
    };
  }
}
