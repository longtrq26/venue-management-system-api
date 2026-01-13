import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SkipThrottle, Throttle } from '@nestjs/throttler';
import type { Response } from 'express';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { Public } from 'src/common/decorators/public.decorator';
import { RefreshTokenGuard } from 'src/common/guards/refresh-token.guard';
import { AuthService } from './auth.service';
import { ChangeEmailDto } from './dtos/change-email.dto';
import { ChangePasswordDto } from './dtos/change-password.dto';
import { ForgotPasswordDto } from './dtos/forgot-password.dto';
import { LoginDto } from './dtos/login.dto';
import { PasswordResetDto } from './dtos/password-reset.dto';
import { RegisterDto } from './dtos/register.dto';
import { VerifyEmailDto } from './dtos/verify-email.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly config: ConfigService,
    private readonly authService: AuthService,
  ) {}

  @Throttle({ short: { limit: 3, ttl: 60000 } })
  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Throttle({ short: { limit: 5, ttl: 60000 } })
  @Public()
  @Get('verify-email')
  @HttpCode(HttpStatus.OK)
  async verifyEmail(@Query() dto: VerifyEmailDto) {
    return this.authService.verifyEmail(dto);
  }

  @Throttle({ short: { limit: 5, ttl: 60000 } })
  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const tokens = await this.authService.login(dto);

    this.setRefreshTokenCookie(res, tokens.refreshToken, tokens.refreshTokenExpiresAt);

    return { accessToken: tokens.accessToken };
  }

  @SkipThrottle()
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@CurrentUser('sub') userId: string, @Res({ passthrough: true }) res: Response) {
    await this.authService.logout(userId);

    this.clearRefreshTokenCookie(res);

    return { message: 'Logged out successfully' };
  }

  @Throttle({ short: { limit: 10, ttl: 60000 } })
  @Public()
  @UseGuards(RefreshTokenGuard)
  @Post('refresh-token')
  @HttpCode(HttpStatus.OK)
  async refreshToken(
    @CurrentUser('sub') userId: string,
    @CurrentUser('refreshToken') refreshToken: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const tokens = await this.authService.refreshToken(userId, refreshToken);

    this.setRefreshTokenCookie(res, tokens.refreshToken, tokens.refreshTokenExpiresAt);

    return { accessToken: tokens.accessToken };
  }

  @Throttle({ short: { limit: 5, ttl: 60000 } })
  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Throttle({ short: { limit: 5, ttl: 60000 } })
  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() dto: PasswordResetDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.resetPassword(dto);

    this.clearRefreshTokenCookie(res);

    return result;
  }

  @Throttle({ short: { limit: 5, ttl: 60000 } })
  @Post('change-email')
  @HttpCode(HttpStatus.OK)
  async changeEmail(@CurrentUser('sub') userId: string, @Body() dto: ChangeEmailDto) {
    return this.authService.requestChangeEmail(userId, dto);
  }

  @Throttle({ short: { limit: 5, ttl: 60000 } })
  @Public()
  @Get('verify-new-email')
  @HttpCode(HttpStatus.OK)
  async verifyNewEmail(@Query() dto: VerifyEmailDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.confirmChangeEmail(dto);

    res.clearCookie('refresh_token');

    return result;
  }

  @Throttle({ short: { limit: 3, ttl: 60000 } })
  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @CurrentUser('sub') userId: string,
    @Body() dto: ChangePasswordDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.changePassword(userId, dto);

    this.clearRefreshTokenCookie(res);

    return result;
  }

  private setRefreshTokenCookie(res: Response, token: string, expires: Date) {
    res.cookie('refresh_token', token, {
      httpOnly: true,
      secure: this.config.get('app.env') === 'production',
      sameSite: 'strict',
      expires: expires,
      path: '/',
    });
  }

  private clearRefreshTokenCookie(res: Response) {
    res.clearCookie('refresh_token', {
      httpOnly: true,
      secure: this.config.get('app.env') === 'production',
      sameSite: 'strict',
      path: '/',
    });
  }
}
