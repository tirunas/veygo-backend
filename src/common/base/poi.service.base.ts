import { Inject } from '@nestjs/common';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';

/**
 * Base service for POI (Point of Interest) entities.
 * Handles shared cache-aside and cache invalidation logic for Attractions, Restaurants, and Hotels.
 *
 * Subclasses must:
 * - Implement getCacheKey(destinationId) to return the cache key
 * - Implement getCacheTTL() to return the TTL in seconds
 * - Implement toEntity(row: any): T to transform Prisma rows to the entity type
 */
export abstract class PoiServiceBase<T> {
  constructor(
    @Inject(CACHE_MANAGER) protected readonly cacheManager: Cache,
  ) {}

  /**
   * Get the cache key for a destination.
   */
  protected abstract getCacheKey(destinationId: string): string;

  /**
   * Get the cache TTL in seconds.
   */
  protected abstract getCacheTTL(): number;

  /**
   * Transform a Prisma row to the entity type.
   */
  protected abstract toEntity(row: Record<string, unknown>): T;

  /**
   * Cache-aside pattern for fetching POI by destination.
   * Checks cache, returns if hit, otherwise fetches from repo and caches.
   */
  protected async getFromCacheOrDb(
    destinationId: string,
    dbFetch: () => Promise<any[]>,
  ): Promise<T[]> {
    const cacheKey = this.getCacheKey(destinationId);
    const cached = await this.cacheManager.get<T[]>(cacheKey);
    if (cached) return cached;

    const rows = await dbFetch();
    const entities = rows.map((r) => this.toEntity(r));
    await this.cacheManager.set(cacheKey, entities, this.getCacheTTL() * 1000);
    return entities;
  }

  /**
   * Invalidate caches for multiple destinations.
   */
  protected async invalidateDestinationCaches(destinationIds: string[]): Promise<void> {
    await Promise.all(
      destinationIds.map((did) => this.cacheManager.del(this.getCacheKey(did))),
    );
  }
}
