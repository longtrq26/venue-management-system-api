import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class ChangeEmailDto {
  @IsEmail({}, { message: 'Email is not valid' })
  @IsNotEmpty()
  @Transform(({ value }: { value: string }) => value?.trim().toLowerCase())
  pendingEmail: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}
