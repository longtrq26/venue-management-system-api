import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as argon2 from 'argon2';
import { TOKEN_EXPIRY_MS } from 'src/common/constants/common.constant';
import { NotificationType } from 'src/common/enums/notification-type.enum';
import { Order } from 'src/common/enums/order.enum';
import { Role } from 'src/common/enums/role.enum';
import { LoggerService } from 'src/providers/logger/logger.service';
import { Brackets, IsNull, Not, Repository } from 'typeorm';
import { NotificationService } from '../notification/notification.service';
import { UpdateUserDto } from './dtos/update-user.dto';
import { UserListQueryDto } from './dtos/user-list-query.dto';
import { User } from './entities/user.entity';
import {
  CreateUserPayload,
  PaginatedUsersResponse,
  UserAuthResponse,
  UserEmailChangeResponse,
  UserLoginResponse,
  UserPasswordResetResponse,
  UserResponse,
  UserVerificationResponse,
} from './types/user.type';

@Injectable()
export class UserService {
  private readonly CONTEXT = UserService.name;

  constructor(
    private readonly logger: LoggerService,
    private readonly notificationService: NotificationService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {
    this.logger.log(
      'UserService initialized with repository and notification service injection',
      this.CONTEXT,
    );
  }

  // management
  async createUser(payload: CreateUserPayload): Promise<UserResponse> {
    const existingUser = await this.userRepository.findOne({
      where: [{ email: payload.email }, { phoneNumber: payload.phoneNumber }],
    });

    if (existingUser) {
      this.logger.warn(
        `User creation failed - duplicate found for email: ${payload.email} or phone: ${payload.phoneNumber}`,
        this.CONTEXT,
      );
      throw new ConflictException('User already exists');
    }

    try {
      const newUser = this.userRepository.create({
        ...payload,
        verificationTokenExpiry: payload.verificationToken
          ? new Date(Date.now() + TOKEN_EXPIRY_MS) // 15 minutes
          : null,
      });

      const savedUser = await this.userRepository.save(newUser);

      this.logger.log(
        `User account created successfully - ID: ${savedUser.id}, Email: ${savedUser.email}, Role: ${savedUser.role}`,
        this.CONTEXT,
      );

      return savedUser;
    } catch (error) {
      const errorMessage = `Failed to create user account for email: ${payload.email}: ${
        error instanceof Error ? error.message : 'Unknown database error'
      }`;

      this.logger.error(
        errorMessage,
        error instanceof Error ? error.stack : undefined,
        this.CONTEXT,
      );
      throw error;
    }
  }

  async updateUser(id: string, dto: UpdateUserDto): Promise<UserResponse> {
    this.logger.debug(
      `Attempting to update user profile - User: ${id}, Fields: ${Object.keys(dto).join(', ')}`,
      this.CONTEXT,
    );

    if (dto.phoneNumber) {
      const existingUser = await this.userRepository.findOne({
        where: { phoneNumber: dto.phoneNumber, deletedAt: IsNull() },
      });
      if (existingUser && existingUser.id !== id) {
        this.logger.warn(
          `Phone number conflict during update - User: ${id}, Phone: ${dto.phoneNumber}`,
          this.CONTEXT,
        );
        throw new ConflictException('Phone number is already used by another account');
      }
    }

    try {
      const updatedUser = await this.userRepository.preload({
        id,
        ...dto,
      });

      if (!updatedUser) {
        this.logger.warn(
          `User update failed - user not found or soft-deleted: ${id}`,
          this.CONTEXT,
        );
        throw new NotFoundException('User not found or soft-deleted');
      }

      const savedUser = await this.userRepository.save(updatedUser);

      this.logger.log(
        `User profile updated successfully - ID: ${id}, Email: ${savedUser.email}`,
        this.CONTEXT,
      );

      try {
        await this.notificationService.createNotification(
          id,
          NotificationType.SYSTEM,
          'Profile Updated',
          'Your profile information has been successfully updated.',
        );
      } catch (notificationError) {
        this.logger.warn(
          `Profile update notification failed for user ${id}: ${
            notificationError instanceof Error ? notificationError.message : 'Unknown error'
          }`,
          this.CONTEXT,
        );
      }

      return savedUser;
    } catch (error) {
      const errorMessage = `Failed to update user profile ${id}: ${
        error instanceof Error ? error.message : 'Unknown database error'
      }`;

      this.logger.error(
        errorMessage,
        error instanceof Error ? error.stack : undefined,
        this.CONTEXT,
      );
      throw error;
    }
  }

  async deleteUser(id: string): Promise<void> {
    this.logger.warn(`User deletion initiated - User: ${id}`, this.CONTEXT);

    const user = await this.userRepository.findOne({
      where: { id, deletedAt: IsNull() },
    });

    if (!user) {
      this.logger.warn(`User deletion failed - user not found: ${id}`, this.CONTEXT);
      throw new NotFoundException('User not found or soft-deleted');
    }

    if (user.role === Role.ADMIN) {
      this.logger.error(
        `Admin deletion blocked - attempted to delete admin user: ${id} (${user.email})`,
        this.CONTEXT,
      );
      throw new ForbiddenException('Admin users cannot be soft-deleted');
    }

    try {
      await this.userRepository.softDelete(id);

      await this.userRepository.update(id, {
        refreshTokenHash: null,
        refreshTokenExpiry: null,
      });

      this.logger.log(
        `User soft-deleted successfully - ID: ${id}, Email: ${user.email}, Role: ${user.role}`,
        this.CONTEXT,
      );
    } catch (error) {
      const errorMessage = `Failed to soft-delete user ${id}: ${
        error instanceof Error ? error.message : 'Unknown database error'
      }`;

      this.logger.error(
        errorMessage,
        error instanceof Error ? error.stack : undefined,
        this.CONTEXT,
      );
      throw error;
    }
  }

  async restoreUser(id: string): Promise<void> {
    this.logger.debug(`User restoration initiated - User: ${id}`, this.CONTEXT);

    const user = await this.userRepository.findOne({
      where: { id, deletedAt: Not(IsNull()) },
    });

    if (!user) {
      this.logger.warn(
        `User restoration failed - user not found or not soft-deleted: ${id}`,
        this.CONTEXT,
      );
      throw new NotFoundException('User not found or not soft-deleted');
    }

    try {
      await this.userRepository.restore(id);

      this.logger.log(
        `User restored successfully - ID: ${id}, Email: ${user.email}, Role: ${user.role}`,
        this.CONTEXT,
      );
    } catch (error) {
      const errorMessage = `Failed to restore user ${id}: ${
        error instanceof Error ? error.message : 'Unknown database error'
      }`;

      this.logger.error(
        errorMessage,
        error instanceof Error ? error.stack : undefined,
        this.CONTEXT,
      );
      throw error;
    }
  }

  // queries
  async getUserList(dto: UserListQueryDto): Promise<PaginatedUsersResponse> {
    const { sortOrder = Order.DESC, page = 1, pageSize = 10, search, role, withDeleted } = dto;
    const skip = (page - 1) * pageSize;

    this.logger.debug(
      `Fetching user list - Page: ${page}, Size: ${pageSize}, Search: ${search || 'none'}, Role: ${role || 'all'}, WithDeleted: ${withDeleted}`,
      this.CONTEXT,
    );

    try {
      const queryBuilder = this.userRepository.createQueryBuilder('user');

      queryBuilder.select([
        'user.id',
        'user.email',
        'user.fullName',
        'user.phoneNumber',
        'user.role',
        'user.isVerified',
        'user.createdAt',
        'user.deletedAt',
      ]);

      if (withDeleted) {
        queryBuilder.withDeleted();
      }

      if (role) {
        queryBuilder.andWhere('user.role = :role', { role });
      }

      if (search) {
        queryBuilder.andWhere(
          new Brackets((qb) => {
            qb.where('user.email ILIKE :q', { q: `%${search}%` })
              .orWhere('user.fullName ILIKE :q', { q: `%${search}%` })
              .orWhere('user.phoneNumber ILIKE :q', { q: `%${search}%` });
          }),
        );
      }

      queryBuilder.orderBy('user.createdAt', sortOrder);
      queryBuilder.skip(skip).take(pageSize);

      const [users, total] = await queryBuilder.getManyAndCount();

      const meta = {
        totalItems: total,
        currentPage: page,
        lastPage: Math.ceil(total / pageSize),
        hasNextPage: page < Math.ceil(total / pageSize),
        hasPreviousPage: page > 1,
      };

      this.logger.debug(
        `User list retrieved - Found: ${users.length}, Total: ${total}, Page: ${page}/${meta.lastPage}`,
        this.CONTEXT,
      );

      return {
        users,
        meta,
      };
    } catch (error) {
      this.logger.error(
        `Failed to fetch user list: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
        this.CONTEXT,
      );
      throw error;
    }
  }

  async getUserById(id: string): Promise<UserResponse | null> {
    try {
      const user = await this.userRepository.findOne({
        where: { id: id, deletedAt: IsNull() },
      });

      if (!user) {
        this.logger.debug(`User not found by ID: ${id}`, this.CONTEXT);
        return null;
      }

      this.logger.debug(`User found by ID: ${id} (${user.email})`, this.CONTEXT);
      return user;
    } catch (error) {
      this.logger.error(
        `Failed to get user by ID ${id}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
        this.CONTEXT,
      );
      throw error;
    }
  }

  //  forgot password, request change email
  async getUserByEmail(email: string): Promise<UserResponse | null> {
    try {
      const user = await this.userRepository.findOne({
        where: { email, deletedAt: IsNull() },
      });

      if (!user) {
        this.logger.debug(`User not found by email: ${email}`, this.CONTEXT);
        return null;
      }

      this.logger.debug(`User found by email: ${email} (ID: ${user.id})`, this.CONTEXT);
      return user;
    } catch (error) {
      this.logger.error(
        `Failed to get user by email ${email}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
        this.CONTEXT,
      );
      throw error;
    }
  }

  // auth
  // refresh token, change password
  async getAuthUser(id: string): Promise<UserAuthResponse | null> {
    try {
      const user = await this.userRepository.findOne({
        where: { id: id, deletedAt: IsNull() },
      });

      if (!user) {
        this.logger.debug(`User not found by ID: ${id}`, this.CONTEXT);
        return null;
      }

      this.logger.debug(`User found by ID: ${id} (${user.email})`, this.CONTEXT);
      return user;
    } catch (error) {
      this.logger.error(
        `Failed to get user by ID ${id}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
        this.CONTEXT,
      );
      throw error;
    }
  }

  // login
  async getUserByEmailForLogin(email: string): Promise<UserLoginResponse | null> {
    try {
      const user = await this.userRepository.findOne({
        where: { email, deletedAt: IsNull() },
      });

      if (!user) {
        this.logger.debug(`User not found by email: ${email}`, this.CONTEXT);
        return null;
      }

      this.logger.debug(`User found by email: ${email} (ID: ${user.id})`, this.CONTEXT);
      return user;
    } catch (error) {
      this.logger.error(
        `Failed to get user by email ${email}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
        this.CONTEXT,
      );
      throw error;
    }
  }

  // account verification
  // verify email
  async getUserByVerificationToken(token: string): Promise<UserVerificationResponse | null> {
    try {
      const user = await this.userRepository.findOne({
        where: { verificationToken: token, deletedAt: IsNull() },
      });

      if (!user) {
        this.logger.debug(`User not found by verification token`, this.CONTEXT);
        return null;
      }

      // Check if token is expired
      if (user.verificationTokenExpiry && user.verificationTokenExpiry < new Date()) {
        this.logger.warn(`Expired verification token used for user: ${user.email}`, this.CONTEXT);
        return null;
      }

      this.logger.debug(`User found by verification token: ${user.email}`, this.CONTEXT);
      return user;
    } catch (error) {
      this.logger.error(
        `Failed to get user by verification token: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
        this.CONTEXT,
      );
      throw error;
    }
  }

  async activateUserAccount(id: string): Promise<void> {
    try {
      await this.userRepository.update(id, {
        isVerified: true,
        verificationToken: null,
        verificationTokenExpiry: null,
      });

      this.logger.log(`User account activated: ${id}`, this.CONTEXT);
    } catch (error) {
      this.logger.error(
        `Failed to activate user account ${id}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
        this.CONTEXT,
      );
      throw error;
    }
  }

  // password reset
  // reset password
  async getUserByPasswordResetToken(token: string): Promise<UserPasswordResetResponse | null> {
    try {
      const user = await this.userRepository.findOne({
        where: { passwordResetToken: token, deletedAt: IsNull() },
      });

      if (!user) {
        this.logger.debug(`User not found by password reset token`, this.CONTEXT);
        return null;
      }

      // Check if token is expired
      if (user.passwordResetTokenExpiry && user.passwordResetTokenExpiry < new Date()) {
        this.logger.warn(`Expired password reset token used for user: ${user.email}`, this.CONTEXT);
      }

      this.logger.debug(`User found by password reset token: ${user.email}`, this.CONTEXT);
      return user;
    } catch (error) {
      this.logger.error(
        `Failed to get user by password reset token: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
        this.CONTEXT,
      );
      throw error;
    }
  }

  async requestPasswordReset(id: string, token: string): Promise<void> {
    try {
      await this.userRepository.update(id, {
        passwordResetToken: token,
        passwordResetTokenExpiry: new Date(Date.now() + TOKEN_EXPIRY_MS), // 15 minutes
      });

      this.logger.log(`Password reset token generated for user: ${id}`, this.CONTEXT);
    } catch (error) {
      this.logger.error(
        `Failed to generate password reset token for user ${id}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
        this.CONTEXT,
      );
      throw error;
    }
  }

  async resetPassword(id: string, newPassword: string): Promise<void> {
    try {
      const passwordHash = await argon2.hash(newPassword);

      await this.userRepository.update(id, {
        passwordHash,
        refreshTokenHash: null,
        refreshTokenExpiry: null,
        passwordResetToken: null,
        passwordResetTokenExpiry: null,
      });

      this.logger.log(`Password reset successfully for user: ${id}`, this.CONTEXT);
    } catch (error) {
      this.logger.error(
        `Failed to reset password for user ${id}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
        this.CONTEXT,
      );
      throw error;
    }
  }

  // email change
  // request change email, confirm change email
  async getUserByEmailChangeToken(token: string): Promise<UserEmailChangeResponse | null> {
    try {
      const user = await this.userRepository.findOne({
        where: { emailChangeToken: token, deletedAt: IsNull() },
      });

      if (!user) {
        this.logger.debug(`User not found by email change token`, this.CONTEXT);
        return null;
      }

      // Check if token is expired
      if (user.emailChangeTokenExpiry && user.emailChangeTokenExpiry < new Date()) {
        this.logger.warn(`Expired email change token used for user: ${user.email}`, this.CONTEXT);
        return null;
      }

      this.logger.debug(
        `User found by email change token: ${user.email} -> ${user.pendingEmail}`,
        this.CONTEXT,
      );
      return user;
    } catch (error) {
      this.logger.error(
        `Failed to get user by email change token: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
        this.CONTEXT,
      );
      throw error;
    }
  }

  async requestEmailChangeVerification(
    id: string,
    pendingEmail: string,
    token: string,
  ): Promise<void> {
    try {
      await this.userRepository.update(id, {
        pendingEmail,
        emailChangeToken: token,
        emailChangeTokenExpiry: new Date(Date.now() + TOKEN_EXPIRY_MS), // 15 minutes
      });

      this.logger.log(
        `Email change verification requested for user ${id}: ${pendingEmail}`,
        this.CONTEXT,
      );
    } catch (error) {
      this.logger.error(
        `Failed to request email change verification for user ${id}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
        this.CONTEXT,
      );
      throw error;
    }
  }

  async confirmEmailChangeVerification(id: string, pendingEmail: string): Promise<void> {
    try {
      await this.userRepository.update(id, {
        email: pendingEmail,
        pendingEmail: null,
        emailChangeToken: null,
        emailChangeTokenExpiry: null,
        isVerified: true,
        refreshTokenHash: null,
        refreshTokenExpiry: null,
      });

      this.logger.log(`Email change confirmed for user ${id}: ${pendingEmail}`, this.CONTEXT);
    } catch (error) {
      this.logger.error(
        `Failed to confirm email change for user ${id}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
        this.CONTEXT,
      );
      throw error;
    }
  }

  // token & session
  async updateRefreshToken(
    id: string,
    token: string | null,
    expiresAt: Date | null = null,
  ): Promise<void> {
    try {
      const refreshTokenHash = token ? await argon2.hash(token) : null;
      const finalExpiresAt = token ? expiresAt : null;

      await this.userRepository.update(id, {
        refreshTokenHash,
        refreshTokenExpiry: finalExpiresAt,
      });

      if (token) {
        this.logger.debug(`Refresh token updated for user: ${id}`, this.CONTEXT);
      } else {
        this.logger.debug(`Refresh token cleared for user: ${id}`, this.CONTEXT);
      }
    } catch (error) {
      this.logger.error(
        `Failed to update refresh token for user ${id}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
        this.CONTEXT,
      );
      throw error;
    }
  }
}
