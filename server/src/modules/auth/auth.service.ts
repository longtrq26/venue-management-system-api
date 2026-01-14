import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import * as crypto from 'crypto';
import ms, { StringValue } from 'ms';
import { NotificationType } from 'src/common/enums/notification-type.enum';
import { Role } from 'src/common/enums/role.enum';
import { JwtPayload, JwtResponse } from 'src/common/types/common.type';
import { LoggerService } from 'src/providers/logger/logger.service';
import { SmtpService } from 'src/providers/smtp/smtp.service';
import { emailChangeVerificationTemplate } from 'src/providers/smtp/templates/email-change-verification.template';
import { emailVerificationTemplate } from 'src/providers/smtp/templates/email-verification.template';
import { passwordResetRequestTemplate } from 'src/providers/smtp/templates/password-reset-request.template';
import { NotificationService } from '../notification/notification.service';
import { UserService } from '../user/user.service';
import { ChangeEmailDto } from './dtos/change-email.dto';
import { ChangePasswordDto } from './dtos/change-password.dto';
import { ForgotPasswordDto } from './dtos/forgot-password.dto';
import { LoginDto } from './dtos/login.dto';
import { PasswordResetDto } from './dtos/password-reset.dto';
import { RegisterDto } from './dtos/register.dto';
import { VerifyEmailDto } from './dtos/verify-email.dto';

@Injectable()
export class AuthService {
  private readonly CONTEXT = AuthService.name;

  constructor(
    private readonly logger: LoggerService,
    private readonly config: ConfigService,
    private readonly userService: UserService,
    private readonly smtpService: SmtpService,
    private readonly notificationService: NotificationService,
    private readonly jwtService: JwtService,
  ) {
    this.logger.log('AuthService initialized with dependencies', this.CONTEXT);
  }

  // registration
  async register(dto: RegisterDto): Promise<{ message: string; email: string }> {
    this.logger.debug(`Registration attempt for email: ${dto.email}`, this.CONTEXT);

    if (dto.password !== dto.passwordConfirmation) {
      this.logger.warn(
        `Registration failed - password mismatch for email: ${dto.email}`,
        this.CONTEXT,
      );
      throw new BadRequestException('Passwords do not match');
    }

    try {
      // Generate secure password hash and verification token
      const passwordHash = await argon2.hash(dto.password);
      const verificationToken = crypto.randomBytes(32).toString('hex');

      const payload = {
        email: dto.email,
        passwordHash: passwordHash,
        fullName: dto.fullName,
        phoneNumber: dto.phoneNumber,
        role: Role.CUSTOMER,
        verificationToken,
        isVerified: false,
      };

      // Create user account
      const newUser = await this.userService.createUser(payload);

      // Generate verification URL
      const url = this.buildAuthUrl('verify-email', verificationToken);

      // Send verification email
      await this.smtpService.sendMail({
        to: dto.email,
        subject: 'Venue Management System - Verify your email',
        html: emailVerificationTemplate(dto.fullName, url),
      });

      this.logger.log(
        `User registration completed successfully: ${dto.email} (ID: ${newUser.id})`,
        this.CONTEXT,
      );

      return {
        message: 'User created successfully, check your email to verify your account',
        email: dto.email,
      };
    } catch (error) {
      this.logger.error(
        `User registration failed for email ${dto.email}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
        this.CONTEXT,
      );
      throw error;
    }
  }

  async verifyEmail(dto: VerifyEmailDto): Promise<{ message: string; email: string }> {
    this.logger.debug(`Email verification attempt with token`, this.CONTEXT);

    const user = await this.userService.getUserByVerificationToken(dto.token);
    if (!user) {
      this.logger.warn(`Email verification failed - invalid token`, this.CONTEXT);
      throw new BadRequestException('Invalid or expired verification token');
    }

    if (user.isVerified) {
      this.logger.warn(`Email verification failed - already verified: ${user.email}`, this.CONTEXT);
      throw new BadRequestException('Email is already verified');
    }

    if (user.verificationTokenExpiry && user.verificationTokenExpiry < new Date()) {
      this.logger.warn(
        `Email verification failed - expired token for user: ${user.email}`,
        this.CONTEXT,
      );
      throw new BadRequestException('Verification token has expired');
    }

    try {
      // Activate user account
      await this.userService.activateUserAccount(user.id);

      // Create welcome notification
      await this.notificationService.createNotification(
        user.id,
        NotificationType.ACCOUNT_VERIFIED,
        'Account Verified',
        'Your account has been successfully verified. Welcome to Venue Management System!',
      );

      this.logger.log(
        `Email verification completed successfully: ${user.email} (ID: ${user.id})`,
        this.CONTEXT,
      );

      return {
        message: 'Email verified successfully',
        email: user.email,
      };
    } catch (error) {
      this.logger.error(
        `Email verification failed for user ${user.email}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
        this.CONTEXT,
      );
      throw error;
    }
  }

  // session
  async login(dto: LoginDto): Promise<JwtResponse> {
    this.logger.debug(`Login attempt for email: ${dto.email}`, this.CONTEXT);

    const user = await this.userService.getUserByEmailForLogin(dto.email);
    if (!user) {
      this.logger.warn(`Login failed - user not found: ${dto.email}`, this.CONTEXT);
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.isVerified) {
      this.logger.warn(`Login failed - unverified account: ${dto.email}`, this.CONTEXT);
      throw new UnauthorizedException('Email is not verified');
    }

    const isPasswordValid = await argon2.verify(user.passwordHash, dto.password);
    if (!isPasswordValid) {
      this.logger.warn(`Login failed - invalid password: ${dto.email}`, this.CONTEXT);
      throw new UnauthorizedException('Invalid email or password');
    }

    try {
      const tokens = await this.generateTokens({
        id: user.id,
        email: user.email,
        role: user.role,
      });

      await this.userService.updateRefreshToken(
        user.id,
        tokens.refreshToken,
        tokens.refreshTokenExpiresAt,
      );

      this.logger.log(
        `Login successful: ${dto.email} (ID: ${user.id}, Role: ${user.role})`,
        this.CONTEXT,
      );

      return tokens;
    } catch (error) {
      this.logger.error(
        `Login failed for user ${dto.email}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
        this.CONTEXT,
      );
      throw error;
    }
  }

  async logout(id: string): Promise<void> {
    try {
      await this.userService.updateRefreshToken(id, null, null);
      this.logger.log(`Logout successful for user: ${id}`, this.CONTEXT);
    } catch (error) {
      this.logger.error(
        `Logout failed for user ${id}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
        this.CONTEXT,
      );
      throw error;
    }
  }

  async refreshToken(id: string, refreshToken: string): Promise<JwtResponse> {
    this.logger.debug(`Token refresh attempt for user: ${id}`, this.CONTEXT);

    const user = await this.userService.getAuthUser(id);
    if (!user || !user.refreshTokenHash) {
      this.logger.warn(
        `Token refresh failed - no refresh token found for user: ${id}`,
        this.CONTEXT,
      );
      throw new ForbiddenException('Access Denied');
    }

    if (user.refreshTokenExpiry && new Date() > user.refreshTokenExpiry) {
      this.logger.warn(
        `Token refresh failed - expired refresh token for user: ${id}`,
        this.CONTEXT,
      );
      throw new ForbiddenException('Access Denied');
    }

    const isRefreshTokenValid = await argon2.verify(user.refreshTokenHash, refreshToken);
    if (!isRefreshTokenValid) {
      this.logger.warn(
        `Token refresh failed - invalid refresh token for user: ${id}`,
        this.CONTEXT,
      );
      throw new ForbiddenException('Access Denied');
    }

    try {
      const newTokens = await this.generateTokens({
        id: user.id,
        email: user.email,
        role: user.role,
      });

      await this.userService.updateRefreshToken(
        user.id,
        newTokens.refreshToken,
        newTokens.refreshTokenExpiresAt,
      );

      this.logger.log(`Token refresh successful for user: ${id}`, this.CONTEXT);

      return newTokens;
    } catch (error) {
      this.logger.error(
        `Token refresh failed for user ${id}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
        this.CONTEXT,
      );
      throw error;
    }
  }

  // password recovery
  async forgotPassword(dto: ForgotPasswordDto): Promise<{ message: string }> {
    this.logger.debug(`Password reset request for email: ${dto.email}`, this.CONTEXT);

    const user = await this.userService.getUserByEmail(dto.email);
    if (!user) {
      this.logger.debug(`Password reset request - user not found: ${dto.email}`, this.CONTEXT);
      return {
        message: 'If this email exists, you will receive a password reset link.',
      };
    }

    try {
      const resetPasswordToken = crypto.randomBytes(64).toString('hex');
      await this.userService.requestPasswordReset(user.id, resetPasswordToken);

      const resetPasswordUrl = this.buildAuthUrl('reset-password', resetPasswordToken);

      await this.smtpService.sendMail({
        to: dto.email,
        subject: 'Venue Management System - Reset your password',
        html: passwordResetRequestTemplate(user.fullName, resetPasswordUrl),
      });

      this.logger.log(`Password reset email sent to: ${dto.email} (ID: ${user.id})`, this.CONTEXT);

      return {
        message: 'If this email exists, you will receive a password reset link.',
      };
    } catch (error) {
      this.logger.error(
        `Password reset request failed for email ${dto.email}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
        this.CONTEXT,
      );
      throw error;
    }
  }

  async resetPassword(dto: PasswordResetDto): Promise<{ message: string }> {
    this.logger.debug(`Password reset attempt with token`, this.CONTEXT);

    const user = await this.userService.getUserByPasswordResetToken(dto.token);
    if (!user) {
      this.logger.warn(`Password reset failed - invalid token`, this.CONTEXT);
      throw new BadRequestException('Invalid or expired reset token');
    }

    if (!user.passwordResetTokenExpiry || user.passwordResetTokenExpiry < new Date()) {
      this.logger.warn(
        `Password reset failed - expired token for user: ${user.email}`,
        this.CONTEXT,
      );
      throw new BadRequestException('Invalid or expired reset token');
    }

    try {
      await this.userService.resetPassword(user.id, dto.password);

      await this.notificationService.createNotification(
        user.id,
        NotificationType.SYSTEM,
        'Password Reset Successful',
        'Your password has been successfully reset. If you did not perform this action, please contact support immediately.',
      );

      this.logger.log(
        `Password reset completed successfully for user: ${user.email} (ID: ${user.id})`,
        this.CONTEXT,
      );

      return {
        message: 'Password has been reset successfully. Please login with new password.',
      };
    } catch (error) {
      this.logger.error(
        `Password reset failed for user ${user.email}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
        this.CONTEXT,
      );
      throw error;
    }
  }

  // password change
  async changePassword(id: string, dto: ChangePasswordDto): Promise<{ message: string }> {
    this.logger.debug(`Password change request for user: ${id}`, this.CONTEXT);

    if (dto.newPassword !== dto.newPasswordConfirmation) {
      this.logger.warn(
        `Password change failed - confirmation mismatch for user: ${id}`,
        this.CONTEXT,
      );
      throw new BadRequestException('New password and confirmation do not match');
    }

    if (dto.currentPassword === dto.newPassword) {
      this.logger.warn(`Password change failed - same password for user: ${id}`, this.CONTEXT);
      throw new BadRequestException('New password must be different from the current password');
    }

    const user = await this.userService.getAuthUser(id);
    if (!user || !user.passwordHash) {
      this.logger.warn(`Password change failed - user not found: ${id}`, this.CONTEXT);
      throw new UnauthorizedException('User not found');
    }

    const isPasswordValid = await argon2.verify(user.passwordHash, dto.currentPassword);
    if (!isPasswordValid) {
      this.logger.warn(
        `Password change failed - invalid current password for user: ${id}`,
        this.CONTEXT,
      );
      throw new BadRequestException('Current password is incorrect');
    }

    try {
      await this.userService.resetPassword(id, dto.newPassword);

      await this.notificationService.createNotification(
        id,
        NotificationType.SYSTEM,
        'Password Changed',
        'Your password has been successfully changed.',
      );

      this.logger.log(`Password changed successfully for user: ${id}`, this.CONTEXT);

      return { message: 'Password changed successfully. Please login again.' };
    } catch (error) {
      this.logger.error(
        `Password change failed for user ${id}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
        this.CONTEXT,
      );
      throw error;
    }
  }

  // email change
  async requestChangeEmail(id: string, dto: ChangeEmailDto): Promise<{ message: string }> {
    this.logger.debug(`Email change request for user ${id}: ${dto.pendingEmail}`, this.CONTEXT);

    const user = await this.userService.getAuthUser(id);
    if (!user || !user.passwordHash) {
      this.logger.warn(`Email change failed - user not found: ${id}`, this.CONTEXT);
      throw new UnauthorizedException('User not found');
    }

    const isPasswordValid = await argon2.verify(user.passwordHash, dto.password);
    if (!isPasswordValid) {
      this.logger.warn(`Email change failed - invalid password for user: ${id}`, this.CONTEXT);
      throw new UnauthorizedException('Invalid password');
    }

    if (user.email === dto.pendingEmail) {
      this.logger.warn(`Email change failed - same email for user: ${id}`, this.CONTEXT);
      throw new BadRequestException('New email is the same as old email');
    }

    const existingUser = await this.userService.getUserByEmail(dto.pendingEmail);
    if (existingUser) {
      this.logger.warn(
        `Email change failed - email already exists: ${dto.pendingEmail}`,
        this.CONTEXT,
      );
      throw new ConflictException('Email is already used by another account');
    }

    try {
      const changeEmailToken = crypto.randomBytes(64).toString('hex');
      await this.userService.requestEmailChangeVerification(id, dto.pendingEmail, changeEmailToken);

      const changeEmailUrl = this.buildAuthUrl('verify-new-email', changeEmailToken);

      await this.smtpService.sendMail({
        to: dto.pendingEmail,
        subject: 'Venue Management System - Verify your new email',
        html: emailChangeVerificationTemplate(user.fullName, changeEmailUrl),
      });

      this.logger.log(
        `Email change verification sent to ${dto.pendingEmail} for user: ${id}`,
        this.CONTEXT,
      );

      return { message: 'Confirmation link sent to your new email address.' };
    } catch (error) {
      this.logger.error(
        `Email change request failed for user ${id}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
        this.CONTEXT,
      );
      throw error;
    }
  }

  async confirmChangeEmail(dto: VerifyEmailDto): Promise<{ message: string }> {
    this.logger.debug(`Email change confirmation attempt with token`, this.CONTEXT);

    const user = await this.userService.getUserByEmailChangeToken(dto.token);
    if (!user) {
      this.logger.warn(`Email change confirmation failed - invalid token`, this.CONTEXT);
      throw new BadRequestException('Invalid or expired change email token');
    }

    if (!user.pendingEmail) {
      this.logger.warn(
        `Email change confirmation failed - no pending email for user: ${user.email}`,
        this.CONTEXT,
      );
      throw new BadRequestException('Invalid or expired change email token');
    }

    if (!user.emailChangeTokenExpiry || user.emailChangeTokenExpiry < new Date()) {
      this.logger.warn(
        `Email change confirmation failed - expired token for user: ${user.email}`,
        this.CONTEXT,
      );
      throw new BadRequestException('Invalid or expired change email token');
    }

    try {
      await this.userService.confirmEmailChangeVerification(user.id, user.pendingEmail);

      await this.notificationService.createNotification(
        user.id,
        NotificationType.SYSTEM,
        'Email Changed Successfully',
        `Your email has been successfully changed to ${user.pendingEmail}.`,
      );

      this.logger.log(
        `Email changed successfully: ${user.email} -> ${user.pendingEmail} (ID: ${user.id})`,
        this.CONTEXT,
      );

      return { message: 'Email changed successfully' };
    } catch (error) {
      this.logger.error(
        `Email change confirmation failed for user ${user.email}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
        this.CONTEXT,
      );
      throw error;
    }
  }

  // helpers
  private async generateTokens({
    id,
    email,
    role,
  }: {
    id: string;
    email: string;
    role: Role;
  }): Promise<JwtResponse> {
    try {
      // create payload
      const payload: JwtPayload = {
        sub: id,
        email,
        role,
      };

      const refreshExpiresIn = this.config.getOrThrow<string>('jwt.refreshToken.expiresIn');
      const refreshExpiresAt = new Date(Date.now() + ms(refreshExpiresIn as StringValue));

      const [accessToken, refreshToken] = await Promise.all([
        // sign access token
        this.jwtService.signAsync(payload, {
          secret: this.config.getOrThrow('jwt.accessToken.secret'),
          expiresIn: this.config.getOrThrow('jwt.accessToken.expiresIn'),
        }),

        // sign refresh token
        this.jwtService.signAsync(payload, {
          secret: this.config.getOrThrow('jwt.refreshToken.secret'),
          expiresIn: this.config.getOrThrow('jwt.refreshToken.expiresIn'),
        }),
      ]);

      this.logger.debug(`JWT tokens generated for user: ${email} (ID: ${id})`, this.CONTEXT);

      return {
        accessToken,
        refreshToken,
        refreshTokenExpiresAt: refreshExpiresAt,
      };
    } catch (error) {
      this.logger.error(
        `Failed to generate JWT tokens for user ${email}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
        this.CONTEXT,
      );
      throw error;
    }
  }

  private buildAuthUrl(path: string, token: string): string {
    const baseUrl = this.config.getOrThrow<string>('app.url');
    const appPort = this.config.getOrThrow<string>('app.port');
    const apiPrefix = this.config.getOrThrow<string>('api.prefix');
    const apiVersion = this.config.getOrThrow<string>('api.version');
    return `${baseUrl}:${appPort}/${apiPrefix}/${apiVersion}/auth/${path}?token=${token}`;
  }
}
