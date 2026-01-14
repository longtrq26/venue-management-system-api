import { PartialType } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { ListQueryDto } from 'src/common/dtos/list-query.dto';
import { CourtStatus } from 'src/common/enums/court-status.enum';
import { CourtType } from 'src/common/enums/court-type.enum';

export class CourtListQueryDto extends PartialType(ListQueryDto) {
  @IsEnum(CourtType)
  @IsOptional()
  type?: CourtType;

  @IsEnum(CourtStatus)
  @IsOptional()
  status?: CourtStatus;
}
