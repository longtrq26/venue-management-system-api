import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from 'src/common/enums/role.enum';
import { BookingListQueryDto } from './dtos/booking-list-query.dto';
import { CreateBookingDto } from './dtos/create-booking.dto';
import { BookingService } from './services/booking.service';

@Controller('bookings')
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@CurrentUser('sub') userId: string, @Body() dto: CreateBookingDto) {
    return this.bookingService.createBooking(userId, dto);
  }

  @Get('user')
  async getUserBookingList(@CurrentUser('sub') userId: string) {
    return this.bookingService.getUserBookingList(userId);
  }

  @Patch(':id/cancel')
  async cancel(
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: Role,
    @Param('id') id: string,
  ) {
    const isAdmin = role === Role.ADMIN || role === Role.MANAGER;
    return this.bookingService.cancelBooking(userId, id, isAdmin);
  }

  @Get('manager')
  @Roles(Role.ADMIN, Role.MANAGER)
  async getBookingList(@Query() query: BookingListQueryDto) {
    return this.bookingService.getBookingList(query);
  }
}
