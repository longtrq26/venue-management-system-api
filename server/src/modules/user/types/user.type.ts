import { Role } from 'src/common/enums/role.enum';
import { User } from '../entities/user.entity';

export interface CreateUserPayload {
  email: string;
  passwordHash: string;
  fullName: string;
  phoneNumber: string;
  role: Role;
  verificationToken?: string;
  isVerified: boolean;
}

export type UserResponse = Omit<
  User,
  | 'passwordHash'
  | 'verificationToken'
  | 'verificationTokenExpiry'
  | 'refreshTokenHash'
  | 'refreshTokenExpiry'
  | 'pendingEmail'
  | 'emailChangeToken'
  | 'emailChangeTokenExpiry'
  | 'passwordResetToken'
  | 'passwordResetTokenExpiry'
>;

export type UserLoginResponse = UserResponse & Pick<User, 'passwordHash'>;

export type UserAuthResponse = UserResponse &
  Pick<User, 'passwordHash' | 'refreshTokenHash' | 'refreshTokenExpiry'>;

export type UserVerificationResponse = UserResponse &
  Pick<User, 'verificationToken' | 'verificationTokenExpiry'>;

export type UserEmailChangeResponse = UserResponse &
  Pick<User, 'pendingEmail' | 'emailChangeToken' | 'emailChangeTokenExpiry'>;

export type UserPasswordResetResponse = UserResponse &
  Pick<User, 'passwordResetToken' | 'passwordResetTokenExpiry'>;

export type PaginatedUsersResponse = {
  users: UserResponse[];
  meta: {
    totalItems: number;
    currentPage: number;
    lastPage: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
};
