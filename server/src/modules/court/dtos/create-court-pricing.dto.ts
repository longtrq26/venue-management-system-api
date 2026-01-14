import { IsEnum, IsInt, IsNumber, IsOptional, IsString, Matches, Min } from 'class-validator';
import { CourtType } from 'src/common/enums/court-type.enum';

export class CreateCourtPricingDto {
  @IsEnum(CourtType)
  type: CourtType;

  @IsOptional()
  @IsString()
  courtId?: string;

  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: 'Format HH:mm' })
  startTime: string;

  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: 'Format HH:mm' })
  endTime: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsInt()
  @IsOptional()
  priority?: number;
}
