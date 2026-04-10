import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { RestaurantsRepository } from './restaurants.repository';
import { GeoMatchingService } from '../geo-matching/geo-matching.service';
import { PoiServiceBase } from '../../common/base/poi.service.base';
import {
  POI_RESTAURANTS_KEY,
  POI_RESTAURANTS_TTL,
} from '../../cache/cache.constants';
import { resolveImageUrl } from '../../common/utils/directus-asset';
import type {
  Restaurant,
  RestaurantPin,
  Review,
  CreateRestaurantInput,
  UpdateRestaurantInput,
} from './restaurants.types';

@Injectable()
export class RestaurantsService extends PoiServiceBase<Restaurant> {
  constructor(
    private readonly repo: RestaurantsRepository,
    private readonly geoMatchingService: GeoMatchingService,
    @Inject(CACHE_MANAGER) cacheManager: Cache,
  ) {
    super(cacheManager);
  }

  protected getCacheKey(destinationId: string): string {
    return POI_RESTAURANTS_KEY(destinationId);
  }

  protected getCacheTTL(): number {
    return POI_RESTAURANTS_TTL;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected toEntity(r: any): Restaurant {
    return {
      id: r.id as string,
      name: r.name as string,
      description: (r.description as string | null) ?? null,
      price: r.price as string,
      type: r.type as string,
      cuisine: (r.cuisine as string | null) ?? null,
      img: resolveImageUrl((r.imgFileId as string | null) ?? (r.img as string | null) ?? '') || null,
      lat: r.lat as number,
      lng: r.lng as number,
      openingHours: (r.openingHours as string | null) ?? null,
      delivery: (r.delivery as boolean) ?? false,
      petFriendly: (r.petFriendly as boolean) ?? false,
      signature: (r.signature as string | null) ?? null,
      reviews: (r.reviews as Review[]) ?? [],
      source: (r.source as string | null) ?? null,
      location: { lat: r.lat as number, lng: r.lng as number },
    };
  }

  async findByDestination(destinationId: string): Promise<Restaurant[]> {
    return this.getFromCacheOrDb(destinationId, () =>
      this.repo.findByDestination(destinationId),
    );
  }

  async findPinsByDestination(destinationId: string): Promise<RestaurantPin[]> {
    const rows = await this.repo.findPinsByDestination(destinationId);
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      location: { lat: r.lat, lng: r.lng },
      type: r.type,
      price: r.price,
    }));
  }

  async create(input: CreateRestaurantInput): Promise<Restaurant> {
    const record = await this.repo.create(input);
    await this.geoMatchingService.recomputeForRestaurant(record.id);
    return this.toEntity(record);
  }

  async update(id: string, input: UpdateRestaurantInput): Promise<Restaurant> {
    const record = await this.repo.update(id, input);
    const latLngChanged = input.lat !== undefined || input.lng !== undefined;
    const destinationIds = await this.repo.findLinkedDestinationIds(id);
    await this.invalidateDestinationCaches(destinationIds);
    if (latLngChanged) {
      await this.geoMatchingService.recomputeForRestaurant(id);
    }
    return this.toEntity(record);
  }

  async delete(id: string): Promise<void> {
    const destinationIds = await this.repo.findLinkedDestinationIds(id);
    await this.repo.delete(id);
    await this.invalidateDestinationCaches(destinationIds);
  }
}
