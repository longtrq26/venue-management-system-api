import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class UpdateVenueConfigDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsInt()
  @Min(15)
  @Max(120)
  @IsOptional()
  slotDuration?: number;

  @IsInt()
  @Min(1)
  @Max(365)
  @IsOptional()
  bookingWindowDays?: number;
}
