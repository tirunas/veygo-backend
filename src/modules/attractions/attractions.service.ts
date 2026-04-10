import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { AttractionsRepository } from './attractions.repository';
import { GeoMatchingService } from '../geo-matching/geo-matching.service';
import { PoiServiceBase } from '../../common/base/poi.service.base';
import { PrismaService } from '../../prisma/prisma.service';
import { haversineDistanceKm } from '../geo-matching/haversine';
import { resolveImageUrl } from '../../common/utils/directus-asset';
import {
  POI_ATTRACTIONS_KEY,
  POI_ATTRACTIONS_TTL,
} from '../../cache/cache.constants';
import type {
  Attraction,
  AttractionPin,
  CreateAttractionInput,
  UpdateAttractionInput,
  NearbyFood,
} from './attractions.types';

@Injectable()
export class AttractionsService extends PoiServiceBase<Attraction> {
  constructor(
    private readonly repo: AttractionsRepository,
    private readonly geoMatchingService: GeoMatchingService,
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) cacheManager: Cache,
  ) {
    super(cacheManager);
  }

  protected getCacheKey(destinationId: string): string {
    return POI_ATTRACTIONS_KEY(destinationId);
  }

  protected getCacheTTL(): number {
    return POI_ATTRACTIONS_TTL;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected toEntity(r: any, nearbyFood: NearbyFood[] = []): Attraction {
    return {
      id: r.id as string,
      destinationId: r.destinationId as string,
      name: r.name as string,
      description: r.description as string,
      priceAndDuration: (r.priceAndDuration as string | null) ?? null,
      img: resolveImageUrl((r.imgFileId as string | null) ?? (r.img as string)),
      category: r.category as 'popular' | 'gem',
      lat: r.lat as number,
      lng: r.lng as number,
      hook: (r.hook as string | null) ?? null,
      tip: (r.tip as string | null) ?? null,
      nearbyFoodRadiusKm: (r.nearbyFoodRadiusKm as number) ?? 1.0,
      openingHours: (r.openingHours as string | null) ?? null,
      bestTime: (r.bestTime as string | null) ?? null,
      source: (r.source as string | null) ?? null,
      location: { lat: r.lat as number, lng: r.lng as number },
      nearbyFood,
    };
  }

  async findByDestination(destinationId: string): Promise<Attraction[]> {
    return this.getFromCacheOrDb(destinationId, async () => {
      const rows = await this.repo.findByDestination(destinationId);
      const allRestaurants = await this.prisma.restaurant.findMany({
        select: { id: true, name: true, type: true, price: true, lat: true, lng: true },
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (rows as any[]).map((r) => {
        const radiusKm = (r.nearbyFoodRadiusKm as number) ?? 1.0;
        const nearbyFood: NearbyFood[] = allRestaurants
          .map((rest) => ({
            id: rest.id,
            name: rest.name,
            type: rest.type,
            price: rest.price,
            distance: haversineDistanceKm(r.lat as number, r.lng as number, rest.lat, rest.lng),
          }))
          .filter((rest) => rest.distance <= radiusKm)
          .sort((a, b) => a.distance - b.distance);
        return this.toEntity(r, nearbyFood);
      });
    });
  }

  async findPinsByDestination(destinationId: string): Promise<AttractionPin[]> {
    const rows = await this.repo.findPinsByDestination(destinationId);
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      location: { lat: r.lat, lng: r.lng },
      category: r.category,
      img: r.img,
    }));
  }

  async create(input: CreateAttractionInput): Promise<Attraction> {
    const record = await this.repo.create(input);
    await this.geoMatchingService.recomputeForAttraction(record.id);
    return this.toEntity(record);
  }

  async update(id: string, input: UpdateAttractionInput): Promise<Attraction> {
    const record = await this.repo.update(id, input);
    const latLngChanged = input.lat !== undefined || input.lng !== undefined;
    const destinationIds = await this.repo.findLinkedDestinationIds(id);
    await this.invalidateDestinationCaches(destinationIds);
    if (latLngChanged) {
      await this.geoMatchingService.recomputeForAttraction(id);
    }
    return this.toEntity(record);
  }

  async delete(id: string): Promise<void> {
    const destinationIds = await this.repo.findLinkedDestinationIds(id);
    await this.repo.delete(id);
    await this.invalidateDestinationCaches(destinationIds);
  }
}
