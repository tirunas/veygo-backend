import {
  Injectable,
  Inject,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { randomUUID } from 'crypto';
import { UsersRepository } from '../users/users.repository';
import { HasherService } from './hasher.service';

const RESET_TOKEN_TTL_MS = 15 * 60 * 1000;
const RESET_TOKEN_PREFIX = 'pwd-reset:';

@Injectable()
export class PasswordResetService {
  private readonly logger = new Logger(PasswordResetService.name);

  constructor(
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly usersRepository: UsersRepository,
    private readonly hasherService: HasherService,
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
    this.logger.log(`Password reset token for ${email}: ${token}`);
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
