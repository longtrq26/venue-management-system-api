import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsString,
  Matches,
  ValidateNested,
} from 'class-validator';
import { DayOfWeek } from 'src/common/enums/day-of-week.enum';

class DailyOperatingHourDto {
  @IsEnum(DayOfWeek)
  @IsNotEmpty()
  day: DayOfWeek;

  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'openTime must be in HH:mm format',
  })
  openTime: string;

  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'closeTime must be in HH:mm format',
  })
  closeTime: string;

  @IsBoolean()
  isClosed: boolean;
}

export class UpdateOperatingHoursDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DailyOperatingHourDto)
  hours: DailyOperatingHourDto[];
}
