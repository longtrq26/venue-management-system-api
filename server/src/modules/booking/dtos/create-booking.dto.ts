import {
  IsArray,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  ValidateIf,
} from 'class-validator';
import { BookingType } from 'src/common/enums/booking-type.enum';
import { DayOfWeek } from 'src/common/enums/day-of-week.enum';

export class CreateBookingDto {
  @IsUUID()
  @IsNotEmpty()
  courtId: string;

  @IsEnum(BookingType)
  @IsNotEmpty()
  type: BookingType;

  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: 'Format HH:mm' })
  startTime: string;

  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: 'Format HH:mm' })
  endTime: string;

  @ValidateIf((o: CreateBookingDto) => o.type === BookingType.SINGLE)
  @IsDateString()
  @IsNotEmpty()
  date?: string;

  @ValidateIf((o: CreateBookingDto) => o.type === BookingType.RECURRING)
  @IsDateString()
  startDate?: string;

  @ValidateIf((o: CreateBookingDto) => o.type === BookingType.RECURRING)
  @IsDateString()
  endDate?: string;

  @ValidateIf((o: CreateBookingDto) => o.type === BookingType.RECURRING)
  @IsArray()
  @IsEnum(DayOfWeek, { each: true })
  daysOfWeek?: DayOfWeek[];

  @IsString()
  @IsOptional()
  note?: string;
}
