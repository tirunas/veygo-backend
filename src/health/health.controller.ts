import { Controller, Get, Inject } from '@nestjs/common';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { PrismaService } from '../prisma/prisma.service';

@Controller('health')
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  @Get()
  check(): { status: string } {
    return { status: 'ok' };
  }

  @Get('ready')
  async readiness(): Promise<{ database: string; redis: string }> {
    let database = 'ok';
    try {
      await this.prisma.executeRaw`SELECT 1`;
    } catch {
      database = 'error';
    }

    let redis = 'ok';
    try {
      await this.cacheManager.set('health:ping', 'pong', 1000);
    } catch {
      redis = 'error';
    }

    return { database, redis };
  }
}
