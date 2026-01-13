import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString, Length, Matches, Validate } from 'class-validator';
import { Match } from 'src/common/validators/match.validator';

export class CreateUserDto {
  @IsEmail({}, { message: 'Email is not valid' })
  @IsNotEmpty()
  @Transform(({ value }: { value: string }) => value?.trim().toLowerCase())
  email: string;

  @IsString()
  @Length(8, 32, { message: 'Password must be between 8 and 32 characters' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).+$/, {
    message:
      'Password must contain at least one lowercase letter, one uppercase letter, one digit, and one special character',
  })
  password: string;

  @IsString()
  @IsNotEmpty()
  @Validate(Match, ['password'], {
    message: 'Password confirmation does not match',
  })
  passwordConfirmation: string;

  @IsString()
  @Length(2, 64, { message: 'Full name must be between 2 and 64 characters' })
  @Transform(({ value }: { value: string }) => value?.trim())
  fullName: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/(84|0[3|5|7|8|9])+([0-9]{8})\b/, {
    message: 'Phone number is not valid',
  })
  phoneNumber: string;
}
