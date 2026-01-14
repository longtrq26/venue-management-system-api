import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { CourtType } from 'src/common/enums/court-type.enum';

export class CreateCourtDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  name: string;

  @IsEnum(CourtType)
  @IsNotEmpty()
  type: CourtType;

  @IsString()
  @IsOptional()
  description?: string;
}
