import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { UsersRepository } from '../users/users.repository';
import { HasherService } from './hasher.service';
import { TokenService, TokenPair } from './token.service';
import { AuditService } from './audit.service';
import { PublicUser } from '../users/users.types';

const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000;

interface AuthContext {
  ip: string;
  userAgent: string;
}

interface RegisterPayload extends AuthContext {
  email: string;
  password: string;
}

interface LoginPayload extends AuthContext {
  email: string;
  password: string;
}

export interface AuthResult extends TokenPair {
  user: PublicUser;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly usersRepository: UsersRepository,
    private readonly hasher: HasherService,
    private readonly tokenService: TokenService,
    private readonly audit: AuditService,
  ) {}

  async register(payload: RegisterPayload): Promise<AuthResult> {
    await this.usersService.assertEmailIsAvailable(payload.email);

    const passwordHash = await this.hasher.hash(payload.password);
    const user = await this.usersRepository.createUser({
      email: payload.email,
      passwordHash,
    });

    const tokens = await this.tokenService.issueTokenPair(user.id, user.role);

    await this.audit.logEvent({
      event: 'register',
      userId: user.id,
      ip: payload.ip,
      userAgent: payload.userAgent,
    });

    return { ...tokens, user: this.usersService.toPublicUser(user) };
  }

  async login(payload: LoginPayload): Promise<AuthResult> {
    const user = await this.usersService.findByEmailOrNull(payload.email);

    if (!user) {
      await this.audit.logEvent({
        event: 'login_failed',
        ip: payload.ip,
        userAgent: payload.userAgent,
        meta: { reason: 'user_not_found' },
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new UnauthorizedException(
        'Account temporarily locked. Try again later.',
      );
    }

    const passwordMatches = await this.hasher.verify(
      payload.password,
      user.passwordHash,
    );

    if (!passwordMatches) {
      await this.usersRepository.incrementLoginAttempts(user.id);

      if (user.loginAttempts + 1 >= MAX_LOGIN_ATTEMPTS) {
        await this.usersRepository.lockAccount(
          user.id,
          new Date(Date.now() + LOCKOUT_DURATION_MS),
        );
        await this.audit.logEvent({
          event: 'account_locked',
          userId: user.id,
          ip: payload.ip,
          userAgent: payload.userAgent,
        });
      }

      await this.audit.logEvent({
        event: 'login_failed',
        userId: user.id,
        ip: payload.ip,
        userAgent: payload.userAgent,
        meta: { reason: 'wrong_password' },
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.usersRepository.resetLoginAttempts(user.id);
    const tokens = await this.tokenService.issueTokenPair(user.id, user.role);

    await this.audit.logEvent({
      event: 'login',
      userId: user.id,
      ip: payload.ip,
      userAgent: payload.userAgent,
    });

    return { ...tokens, user: this.usersService.toPublicUser(user) };
  }

  async logout(
    rawRefreshToken: string,
    userId: string,
    context: AuthContext,
  ): Promise<void> {
    const tokenHash = this.tokenService.hashToken(rawRefreshToken);
    await this.tokenService.revokeTokenByHash(tokenHash);
    await this.audit.logEvent({
      event: 'logout',
      userId,
      ip: context.ip,
      userAgent: context.userAgent,
    });
  }

  async logoutAll(userId: string, context: AuthContext): Promise<void> {
    await this.tokenService.revokeAllUserTokens(userId);
    await this.audit.logEvent({
      event: 'logout_all',
      userId,
      ip: context.ip,
      userAgent: context.userAgent,
    });
  }
}
