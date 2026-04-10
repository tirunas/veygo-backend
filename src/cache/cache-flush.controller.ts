import {
  Controller,
  Post,
  Body,
  Headers,
  ForbiddenException,
  Inject,
  Logger,
} from '@nestjs/common';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { ConfigService } from '@nestjs/config';
import { Public } from '../common/decorators/public.decorator';
import {
  DEST_LIST_KEY,
  DEST_CONTENT_KEY,
  POI_ATTRACTIONS_KEY,
  POI_RESTAURANTS_KEY,
  POI_HOTELS_KEY,
} from './cache.constants';

interface FlushBody {
  collection?: string;
  id?: string;
}

@Public()
@Controller('internal/cache')
export class CacheFlushController {
  private readonly logger = new Logger(CacheFlushController.name);

  constructor(
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly config: ConfigService,
  ) {}

  @Post('flush')
  async flush(
    @Headers('x-cache-secret') secret: string,
    @Body() body: FlushBody,
  ): Promise<{ ok: true }> {
    const expected = this.config.get<string>('CACHE_FLUSH_SECRET');
    if (expected && secret !== expected) {
      throw new ForbiddenException('Invalid cache flush secret');
    }

    const { collection, id } = body ?? {};
    await this.flushForCollection(collection, id);
    this.logger.log(`Cache flushed — collection=${collection ?? 'all'} id=${id ?? '*'}`);
    return { ok: true };
  }

  private async flushForCollection(
    collection: string | undefined,
    id: string | undefined,
  ): Promise<void> {
    const del = (k: string) => this.cacheManager.del(k);

    // Always clear the destination list (any entity change can affect it)
    await del(DEST_LIST_KEY);

    if (!collection || collection === 'Destination') {
      if (id) {
        await Promise.all([
          del(DEST_CONTENT_KEY(id)),
          del(POI_ATTRACTIONS_KEY(id)),
          del(POI_RESTAURANTS_KEY(id)),
          del(POI_HOTELS_KEY(id)),
        ]);
      } else {
        // No specific id — flush all destination content keys via pattern
        await this.flushPattern('dest:*');
        await this.flushPattern('poi:*');
      }
      return;
    }

    if (collection === 'Attraction') {
      await this.flushPattern('poi:*:attractions');
      return;
    }
    if (collection === 'Restaurant') {
      await this.flushPattern('poi:*:restaurants');
      return;
    }
    if (collection === 'Hotel') {
      await this.flushPattern('poi:*:hotels');
      return;
    }
  }

  private async flushPattern(pattern: string): Promise<void> {
    try {
      // cache-manager-ioredis-yet exposes the ioredis client via .client
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const store = (this.cacheManager as any).store;
      const client = store?.client ?? store?.getClient?.();
      if (client?.keys) {
        const keys: string[] = await client.keys(pattern);
        if (keys.length) {
          await Promise.all(keys.map((k) => this.cacheManager.del(k)));
          this.logger.debug(`Flushed ${keys.length} keys matching ${pattern}`);
        }
      }
    } catch (err) {
      this.logger.warn(`flushPattern(${pattern}) failed: ${err}`);
    }
  }
}
