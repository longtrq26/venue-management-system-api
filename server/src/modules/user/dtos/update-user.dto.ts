import { Transform } from 'class-transformer';
import { IsOptional, IsString, Length, Matches } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @Length(2, 64, { message: 'Full name must be between 2 and 64 characters' })
  @Transform(({ value }: { value: string }) => value?.trim())
  fullName?: string;

  @IsOptional()
  @IsString()
  @Matches(/(84|0[3|5|7|8|9])+([0-9]{8})\b/, {
    message: 'Phone number is not valid',
  })
  phoneNumber?: string;
}
