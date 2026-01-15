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

export type UserResponse = Pick<
  User,
  | 'id'
  | 'email'
  | 'fullName'
  | 'phoneNumber'
  | 'role'
  | 'isVerified'
  | 'createdAt'
  | 'updatedAt'
  | 'deletedAt'
>;

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
