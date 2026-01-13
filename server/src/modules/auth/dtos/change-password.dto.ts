import { IsNotEmpty, IsString, Length, Matches, Validate } from 'class-validator';
import { Match } from 'src/common/validators/match.validator';

export class ChangePasswordDto {
  @IsString()
  @IsNotEmpty({ message: 'Current password is required' })
  currentPassword: string;

  @IsString()
  @Length(8, 32, { message: 'Password must be between 8 and 32 characters' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).+$/, {
    message:
      'Password must contain at least one lowercase letter, one uppercase letter, one digit, and one special character',
  })
  newPassword: string;

  @IsString()
  @IsNotEmpty()
  @Validate(Match, ['newPassword'], {
    message: 'Password confirmation does not match',
  })
  newPasswordConfirmation: string;
}
