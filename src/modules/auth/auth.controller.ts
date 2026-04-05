import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  Res,
  HttpCode,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { TokenService } from './token.service';
import { PasswordResetService } from './password-reset.service';
import { UsersService } from '../users/users.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { registerSchema } from './dto/register.dto';
import type { RegisterDto } from './dto/register.dto';
import { loginSchema } from './dto/login.dto';
import type { LoginDto } from './dto/login.dto';
import { forgotPasswordSchema } from './dto/forgot-password.dto';
import type { ForgotPasswordDto } from './dto/forgot-password.dto';
import { resetPasswordSchema } from './dto/reset-password.dto';
import type { ResetPasswordDto } from './dto/reset-password.dto';

const REFRESH_COOKIE = 'refreshToken';
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

@Controller('auth')
@UseGuards(JwtAuthGuard)
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly tokenService: TokenService,
    private readonly passwordResetService: PasswordResetService,
    private readonly usersService: UsersService,
  ) {}

  @Post('register')
  @Public()
  async register(
    @Body(new ZodValidationPipe(registerSchema)) dto: RegisterDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.register({
      ...dto,
      ip: req.ip ?? '',
      userAgent: req.headers['user-agent'] ?? '',
    });
    res.cookie(REFRESH_COOKIE, result.refreshToken, COOKIE_OPTIONS);
    return { accessToken: result.accessToken, user: result.user };
  }

  @Post('login')
  @Public()
  @HttpCode(200)
  async login(
    @Body(new ZodValidationPipe(loginSchema)) dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login({
      ...dto,
      ip: req.ip ?? '',
      userAgent: req.headers['user-agent'] ?? '',
    });
    res.cookie(REFRESH_COOKIE, result.refreshToken, COOKIE_OPTIONS);
    return { accessToken: result.accessToken, user: result.user };
  }

  @Post('refresh')
  @Public()
  @HttpCode(200)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const raw = req.cookies?.[REFRESH_COOKIE] as unknown;
    const result = await this.tokenService.rotateRefreshToken(raw as string);
    res.cookie(REFRESH_COOKIE, result.refreshToken, COOKIE_OPTIONS);
    return { accessToken: result.accessToken };
  }

  @Post('logout')
  @HttpCode(204)
  async logout(
    @CurrentUser() user: { id: string },
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const raw = req.cookies?.[REFRESH_COOKIE] as unknown;
    await this.authService.logout(raw as string, user.id, {
      ip: req.ip ?? '',
      userAgent: req.headers['user-agent'] ?? '',
    });
    res.clearCookie(REFRESH_COOKIE);
  }

  @Post('logout-all')
  @HttpCode(204)
  async logoutAll(
    @CurrentUser() user: { id: string },
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.logoutAll(user.id, {
      ip: req.ip ?? '',
      userAgent: req.headers['user-agent'] ?? '',
    });
    res.clearCookie(REFRESH_COOKIE);
  }

  @Get('me')
  async me(@CurrentUser() user: { id: string }) {
    const full = await this.usersService.findByIdOrThrow(user.id);
    return this.usersService.toPublicUser(full);
  }

  @Post('forgot-password')
  @Public()
  @HttpCode(200)
  async forgotPassword(
    @Body(new ZodValidationPipe(forgotPasswordSchema))
    dto: ForgotPasswordDto,
  ) {
    await this.passwordResetService.requestReset(dto.email);
    return {
      message: 'If that email exists, a reset link has been sent.',
    };
  }

  @Post('reset-password')
  @Public()
  @HttpCode(200)
  async resetPassword(
    @Body(new ZodValidationPipe(resetPasswordSchema))
    dto: ResetPasswordDto,
  ) {
    await this.passwordResetService.resetPassword(dto.token, dto.newPassword);
    return { message: 'Password updated successfully.' };
  }
}
