import {
  Injectable,
  Inject,
  BadRequestException,
} from '@nestjs/common';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { randomUUID } from 'crypto';
import { UsersRepository } from '../users/users.repository';
import { HasherService } from './hasher.service';
import { EmailService } from '../email/email.service';

const RESET_TOKEN_TTL_MS = 15 * 60 * 1000;
const RESET_TOKEN_PREFIX = 'pwd-reset:';

@Injectable()
export class PasswordResetService {
  constructor(
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly usersRepository: UsersRepository,
    private readonly hasherService: HasherService,
    private readonly emailService: EmailService,
  ) {}

  async requestReset(email: string): Promise<void> {
    const user = await this.usersRepository.findByEmail(email);
    if (!user) {
      return;
    }
    const token = randomUUID();
    await this.cacheManager.set(
      `${RESET_TOKEN_PREFIX}${token}`,
      user.id,
      RESET_TOKEN_TTL_MS,
    );
    await this.emailService.sendPasswordReset(email, token);
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const userId = await this.cacheManager.get<string>(
      `${RESET_TOKEN_PREFIX}${token}`,
    );
    if (!userId) {
      throw new BadRequestException('Invalid or expired reset token');
    }
    const hashed = await this.hasherService.hash(newPassword);
    await this.usersRepository.updatePasswordHash(userId, hashed);
    await this.cacheManager.del(`${RESET_TOKEN_PREFIX}${token}`);
  }
}
