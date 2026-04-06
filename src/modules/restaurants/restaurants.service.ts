import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { RestaurantsRepository } from './restaurants.repository';
import { GeoMatchingService } from '../geo-matching/geo-matching.service';
import {
  POI_RESTAURANTS_KEY,
  POI_RESTAURANTS_TTL,
} from '../../cache/cache.constants';
import type {
  Restaurant,
  RestaurantPin,
  CreateRestaurantInput,
  UpdateRestaurantInput,
} from './restaurants.types';

@Injectable()
export class RestaurantsService {
  constructor(
    private readonly repo: RestaurantsRepository,
    private readonly geoMatchingService: GeoMatchingService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  async findByDestination(destinationId: string): Promise<Restaurant[]> {
    const cached = await this.cacheManager.get<Restaurant[]>(
      POI_RESTAURANTS_KEY(destinationId),
    );
    if (cached) return cached;

    const rows = await this.repo.findByDestination(destinationId);
    const restaurants = rows.map((r) => this.toRestaurant(r));
    await this.cacheManager.set(
      POI_RESTAURANTS_KEY(destinationId),
      restaurants,
      POI_RESTAURANTS_TTL * 1000,
    );
    return restaurants;
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
    return this.toRestaurant(record);
  }

  async update(id: string, input: UpdateRestaurantInput): Promise<Restaurant> {
    const record = await this.repo.update(id, input);
    const latLngChanged = input.lat !== undefined || input.lng !== undefined;
    const destinationIds = await this.repo.findLinkedDestinationIds(id);
    await this.invalidateDestinationCaches(destinationIds);
    if (latLngChanged) {
      await this.geoMatchingService.recomputeForRestaurant(id);
    }
    return this.toRestaurant(record);
  }

  async delete(id: string): Promise<void> {
    const destinationIds = await this.repo.findLinkedDestinationIds(id);
    await this.repo.delete(id);
    await this.invalidateDestinationCaches(destinationIds);
  }

  private async invalidateDestinationCaches(destinationIds: string[]): Promise<void> {
    await Promise.all(
      destinationIds.map((did) =>
        this.cacheManager.del(POI_RESTAURANTS_KEY(did)),
      ),
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private toRestaurant(r: any): Restaurant {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const content = (r.content as any) ?? {};
    return {
      id: r.id,
      name: r.name,
      description: r.description,
      price: r.price,
      type: r.type,
      img: r.img,
      lat: r.lat,
      lng: r.lng,
      openingHours: r.openingHours,
      delivery: r.delivery,
      deliveryUrl: r.deliveryUrl,
      petFriendly: r.petFriendly,
      source: r.source,
      content,
      location: { lat: r.lat, lng: r.lng },
      signature: content.signature,
      reviews: content.reviews,
    };
  }
}
