import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { AttractionsRepository } from './attractions.repository';
import { GeoMatchingService } from '../geo-matching/geo-matching.service';
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
export class AttractionsService {
  constructor(
    private readonly repo: AttractionsRepository,
    private readonly geoMatchingService: GeoMatchingService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  async findByDestination(destinationId: string): Promise<Attraction[]> {
    const cached = await this.cacheManager.get<Attraction[]>(
      POI_ATTRACTIONS_KEY(destinationId),
    );
    if (cached) return cached;

    const rows = await this.repo.findByDestination(destinationId);
    const attractions = rows.map((r) => this.toAttraction(r));
    await this.cacheManager.set(
      POI_ATTRACTIONS_KEY(destinationId),
      attractions,
      POI_ATTRACTIONS_TTL * 1000,
    );
    return attractions;
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
    return this.toAttraction(record);
  }

  async update(id: string, input: UpdateAttractionInput): Promise<Attraction> {
    const record = await this.repo.update(id, input);
    const latLngChanged = input.lat !== undefined || input.lng !== undefined;
    const destinationIds = await this.repo.findLinkedDestinationIds(id);
    await this.invalidateDestinationCaches(destinationIds);
    if (latLngChanged) {
      await this.geoMatchingService.recomputeForAttraction(id);
    }
    return this.toAttraction(record);
  }

  async delete(id: string): Promise<void> {
    const destinationIds = await this.repo.findLinkedDestinationIds(id);
    await this.repo.delete(id);
    await this.invalidateDestinationCaches(destinationIds);
  }

  private async invalidateDestinationCaches(destinationIds: string[]): Promise<void> {
    await Promise.all(
      destinationIds.map((did) =>
        this.cacheManager.del(POI_ATTRACTIONS_KEY(did)),
      ),
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private toAttraction(r: any): Attraction {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const content = (r.content as any) ?? {};
    return {
      id: r.id,
      destinationId: r.destinationId ?? '',
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
}
