import { PartialType } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { ListQueryDto } from 'src/common/dtos/list-query.dto';
import { Role } from 'src/common/enums/role.enum';

export class UserListQueryDto extends PartialType(ListQueryDto) {
  @IsOptional()
  @IsEnum(Role)
  role: Role;
}
