import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { HotelsRepository } from './hotels.repository';
import { GeoMatchingService } from '../geo-matching/geo-matching.service';
import { PoiServiceBase } from '../../common/base/poi.service.base';
import {
  POI_HOTELS_KEY,
  POI_HOTELS_TTL,
} from '../../cache/cache.constants';
import { resolveImageUrl } from '../../common/utils/directus-asset';
import type {
  Hotel,
  HotelPin,
  CreateHotelInput,
  UpdateHotelInput,
} from './hotels.types';

@Injectable()
export class HotelsService extends PoiServiceBase<Hotel> {
  constructor(
    private readonly repo: HotelsRepository,
    private readonly geoMatchingService: GeoMatchingService,
    @Inject(CACHE_MANAGER) cacheManager: Cache,
  ) {
    super(cacheManager);
  }

  protected getCacheKey(destinationId: string): string {
    return POI_HOTELS_KEY(destinationId);
  }

  protected getCacheTTL(): number {
    return POI_HOTELS_TTL;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected toEntity(r: any): Hotel {
    return {
      id: r.id as string,
      name: r.name as string,
      location: { lat: r.lat as number, lng: r.lng as number },
      tier: r.tier as 'budget' | 'mid' | 'comfort',
      area: r.area as string,
      pricePerNight: r.pricePerNight as number,
      rating: r.rating as string,
      img: resolveImageUrl((r.imgFileId as string | null) ?? (r.img as string)),
      highlights: (r.highlights as string[]) ?? [],
      amenities: (r.amenities as string[]) ?? [],
      roomTypes: (r.roomTypes as string[]) ?? [],
      walkTo: (r.walkTo as Record<string, string>) ?? {},
      source: (r.source as string | null) ?? null,
    };
  }

  async findByDestination(destinationId: string): Promise<Hotel[]> {
    return this.getFromCacheOrDb(destinationId, () =>
      this.repo.findByDestination(destinationId),
    );
  }

  async findPinsByDestination(destinationId: string): Promise<HotelPin[]> {
    const rows = await this.repo.findPinsByDestination(destinationId);
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      location: { lat: r.lat, lng: r.lng },
      tier: r.tier,
      pricePerNight: r.pricePerNight,
    }));
  }

  async create(input: CreateHotelInput): Promise<Hotel> {
    const record = await this.repo.create(input);
    await this.geoMatchingService.recomputeForHotel(record.id);
    return this.toEntity(record);
  }

  async update(id: string, input: UpdateHotelInput): Promise<Hotel> {
    const record = await this.repo.update(id, input);
    const latLngChanged = input.lat !== undefined || input.lng !== undefined;
    const destinationIds = await this.repo.findLinkedDestinationIds(id);
    await this.invalidateDestinationCaches(destinationIds);
    if (latLngChanged) {
      await this.geoMatchingService.recomputeForHotel(id);
    }
    return this.toEntity(record);
  }

  async delete(id: string): Promise<void> {
    const destinationIds = await this.repo.findLinkedDestinationIds(id);
    await this.repo.delete(id);
    await this.invalidateDestinationCaches(destinationIds);
  }
}
