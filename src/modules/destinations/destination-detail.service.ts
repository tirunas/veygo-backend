import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { AttractionsService } from '../attractions/attractions.service';
import { RestaurantsService } from '../restaurants/restaurants.service';
import { HotelsService } from '../hotels/hotels.service';
import {
  POI_ATTRACTIONS_KEY,
  POI_ATTRACTIONS_TTL,
  POI_RESTAURANTS_KEY,
  POI_RESTAURANTS_TTL,
  POI_HOTELS_KEY,
  POI_HOTELS_TTL,
  DEST_CONTENT_KEY,
  DEST_CONTENT_TTL,
} from '../../cache/cache.constants';
import { DestinationsRepository } from './destinations.repository';
import type { MapData } from './destinations.types';

@Injectable()
export class DestinationDetailService {
  constructor(
    private readonly destinationsRepository: DestinationsRepository,
    private readonly attractionsService: AttractionsService,
    private readonly restaurantsService: RestaurantsService,
    private readonly hotelsService: HotelsService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  async getDetail(destinationId: string) {
    const destination = await this.getDestinationWithCoords(destinationId);

    const [attractions, foodSpots, hotels] = await Promise.all([
      this.attractionsService.findByDestination(destinationId),
      this.restaurantsService.findByDestination(destinationId),
      this.hotelsService.findByDestination(destinationId),
    ]);

    return {
      destination,
      attractions,
      foodSpots,
      hotels,
    };
  }

  async findAttractions(id: string) {
    const attractions = await this.attractionsService.findByDestination(id);
    return { destinationId: id, attractions, totalCount: attractions.length };
  }

  async findFoodSpots(id: string) {
    const foodSpots = await this.restaurantsService.findByDestination(id);
    return { destinationId: id, foodSpots };
  }

  async findMapData(id: string): Promise<MapData | null> {
    const destination = await this.getDestinationWithCoords(id);
    const [attractionPins, restaurantPins] = await Promise.all([
      this.attractionsService.findPinsByDestination(id),
      this.restaurantsService.findPinsByDestination(id),
    ]);

    const attractions = attractionPins.map((pin) => ({
      name: pin.name,
      description: '',
      lat: pin.location.lat,
      lng: pin.location.lng,
      category: pin.category,
    }));

    const foodSpots = restaurantPins.map((pin) => ({
      name: pin.name,
      description: '',
      lat: pin.location.lat,
      lng: pin.location.lng,
      cuisine: pin.type,
      priceRange: pin.price,
    }));

    return {
      centerLat: destination.lat || 0,
      centerLng: destination.lng || 0,
      zoom: 12,
      attractions,
      foodSpots,
    };
  }

  private async getDestinationWithCoords(id: string) {
    const cached = await this.cacheManager.get(DEST_CONTENT_KEY(id));
    if (cached) return cached;

    const record = await this.destinationsRepository.findById(id);
    if (!record) throw new NotFoundException(`Destination ${id} not found`);

    await this.cacheManager.set(
      DEST_CONTENT_KEY(id),
      record,
      DEST_CONTENT_TTL * 1000,
    );
    return record;
  }
}
