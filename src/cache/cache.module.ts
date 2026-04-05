import { Module } from '@nestjs/common';
import { CacheModule as NestCacheModule } from '@nestjs/cache-manager';
import { ConfigService } from '@nestjs/config';
import { redisStore } from 'cache-manager-ioredis-yet';

@Module({
  imports: [
    NestCacheModule.registerAsync({
      isGlobal: true,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        store: redisStore,
        host: config.get<string>('REDIS_HOST') ?? 'localhost',
        port: config.get<number>('REDIS_PORT') ?? 6379,
        ttl: 600 * 1000,
      }),
    }),
  ],
  exports: [NestCacheModule],
})
export class CacheModule {}
