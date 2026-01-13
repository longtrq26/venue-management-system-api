import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Order } from 'src/common/enums/order.enum';

export class ListQueryDto {
  @IsEnum(Order)
  @IsOptional()
  sortOrder: Order = Order.DESC;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page: number = 1;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  pageSize: number = 10;

  @IsOptional()
  @IsString()
  search: string;

  @IsBoolean()
  @IsOptional()
  @Transform(({ value }: { value: string | boolean }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return value;
  })
  withDeleted: boolean = false;
}
