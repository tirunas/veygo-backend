import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { AttractionsRepository } from './attractions.repository';
import { GeoMatchingService } from '../geo-matching/geo-matching.service';
import { PoiServiceBase } from '../../common/base/poi.service.base';
import {
  POI_ATTRACTIONS_KEY,
  POI_ATTRACTIONS_TTL,
} from '../../cache/cache.constants';
import type {
  Attraction,
  AttractionPin,
  CreateAttractionInput,
  UpdateAttractionInput,
} from './attractions.types';

@Injectable()
export class AttractionsService extends PoiServiceBase<Attraction> {
  constructor(
    private readonly repo: AttractionsRepository,
    private readonly geoMatchingService: GeoMatchingService,
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
  protected toEntity(r: any): Attraction {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const content = (r.content as any) ?? {};
    return {
      id: r.id,
      destinationId: r.destinationId,
      name: r.name,
      description: r.description,
      priceAndDuration: r.priceAndDuration,
      img: r.img,
      category: r.category as 'popular' | 'gem',
      lat: r.lat,
      lng: r.lng,
      openingHours: r.openingHours,
      bestTime: r.bestTime,
      source: r.source,
      content,
      location: { lat: r.lat, lng: r.lng },
      hook: content.hook,
      tip: content.tip,
      tickets: content.tickets,
      crowd: content.crowd,
      photos: content.photos,
      nearbyFood: content.nearbyFood,
    };
  }

  async findByDestination(destinationId: string): Promise<Attraction[]> {
    return this.getFromCacheOrDb(destinationId, () =>
      this.repo.findByDestination(destinationId),
    );
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
