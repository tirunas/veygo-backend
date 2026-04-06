import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { HotelsRepository } from './hotels.repository';
import { GeoMatchingService } from '../geo-matching/geo-matching.service';
import {
  POI_HOTELS_KEY,
  POI_HOTELS_TTL,
} from '../../cache/cache.constants';
import type {
  Hotel,
  HotelPin,
  CreateHotelInput,
  UpdateHotelInput,
} from './hotels.types';

@Injectable()
export class HotelsService {
  constructor(
    private readonly repo: HotelsRepository,
    private readonly geoMatchingService: GeoMatchingService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  async findByDestination(destinationId: string): Promise<Hotel[]> {
    const cached = await this.cacheManager.get<Hotel[]>(
      POI_HOTELS_KEY(destinationId),
    );
    if (cached) return cached;

    const rows = await this.repo.findByDestination(destinationId);
    const hotels = rows.map((r) => this.toHotel(r));
    await this.cacheManager.set(
      POI_HOTELS_KEY(destinationId),
      hotels,
      POI_HOTELS_TTL * 1000,
    );
    return hotels;
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
    return this.toHotel(record);
  }

  async update(id: string, input: UpdateHotelInput): Promise<Hotel> {
    const record = await this.repo.update(id, input);
    const latLngChanged = input.lat !== undefined || input.lng !== undefined;
    const destinationIds = await this.repo.findLinkedDestinationIds(id);
    await this.invalidateDestinationCaches(destinationIds);
    if (latLngChanged) {
      await this.geoMatchingService.recomputeForHotel(id);
    }
    return this.toHotel(record);
  }

  async delete(id: string): Promise<void> {
    const destinationIds = await this.repo.findLinkedDestinationIds(id);
    await this.repo.delete(id);
    await this.invalidateDestinationCaches(destinationIds);
  }

  private async invalidateDestinationCaches(destinationIds: string[]): Promise<void> {
    await Promise.all(
      destinationIds.map((did) =>
        this.cacheManager.del(POI_HOTELS_KEY(did)),
      ),
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private toHotel(r: any): Hotel {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const content = (r.content as any) ?? {};
    return {
      id: r.id,
      name: r.name,
      location: { lat: r.lat, lng: r.lng },
      tier: r.tier,
      area: r.area,
      pricePerNight: r.pricePerNight,
      rating: r.rating,
      img: r.img,
      lat: r.lat,
      lng: r.lng,
      source: r.source,
      highlights: content.highlights,
      amenities: content.amenities,
      walkTo: content.walkTo,
      roomTypes: content.roomTypes,
    };
  }
}
