import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { DestinationsRepository } from './destinations.repository';
import {
  DestinationRecord,
  DestinationSummary,
  CreateDestinationInput,
  UpdateDestinationInput,
  AttractionPin,
  FoodSpotPin,
  MapData,
} from './destinations.types';
import {
  DEST_LIST_KEY,
  DEST_LIST_TTL,
  DEST_CONTENT_KEY,
  DEST_CONTENT_TTL,
  DEST_ATTRACTIONS_KEY,
  DEST_ATTRACTIONS_TTL,
  DEST_FOOD_KEY,
  DEST_FOOD_TTL,
  DEST_MAP_KEY,
  DEST_MAP_TTL,
} from '../../cache/cache.constants';

@Injectable()
export class DestinationsService {
  constructor(
    private readonly destinationsRepository: DestinationsRepository,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  async findAll(): Promise<DestinationSummary[]> {
    const cached =
      await this.cacheManager.get<DestinationSummary[]>(DEST_LIST_KEY);
    if (cached) return cached;

    const records = await this.destinationsRepository.findAll();
    const summaries = records.map((record) => this.toSummary(record));
    await this.cacheManager.set(DEST_LIST_KEY, summaries, DEST_LIST_TTL * 1000);
    return summaries;
  }

  async findByIdOrThrow(id: string): Promise<DestinationRecord> {
    const cached = await this.cacheManager.get<DestinationRecord>(
      DEST_CONTENT_KEY(id),
    );
    if (cached) return cached;

    const record = await this.destinationsRepository.findById(id);
    if (!record) throw new NotFoundException('Destination not found');
    await this.cacheManager.set(
      DEST_CONTENT_KEY(id),
      record,
      DEST_CONTENT_TTL * 1000,
    );
    return record;
  }

  async createDestination(
    input: CreateDestinationInput,
  ): Promise<DestinationRecord> {
    const record = await this.destinationsRepository.create(input);
    await this.cacheManager.del(DEST_LIST_KEY);
    return record;
  }

  async updateDestination(
    id: string,
    input: UpdateDestinationInput,
  ): Promise<DestinationRecord> {
    const record = await this.destinationsRepository.update(id, input);
    await this.cacheManager.del(DEST_LIST_KEY);
    await this.cacheManager.del(DEST_CONTENT_KEY(id));
    return record;
  }

  async deleteDestination(id: string): Promise<void> {
    await this.destinationsRepository.delete(id);
    await this.cacheManager.del(DEST_LIST_KEY);
    await this.cacheManager.del(DEST_CONTENT_KEY(id));
  }

  async findAttractions(id: string): Promise<AttractionPin[]> {
    const cached = await this.cacheManager.get<AttractionPin[]>(
      DEST_ATTRACTIONS_KEY(id),
    );
    if (cached) return cached;

    const record = await this.destinationsRepository.findById(id);
    if (!record) throw new NotFoundException('Destination not found');

    await this.cacheManager.set(
      DEST_ATTRACTIONS_KEY(id),
      record.attractions || [],
      DEST_ATTRACTIONS_TTL * 1000,
    );
    return record.attractions || [];
  }

  async findFoodSpots(id: string): Promise<FoodSpotPin[]> {
    const cached = await this.cacheManager.get<FoodSpotPin[]>(
      DEST_FOOD_KEY(id),
    );
    if (cached) return cached;

    const record = await this.destinationsRepository.findById(id);
    if (!record) throw new NotFoundException('Destination not found');

    await this.cacheManager.set(
      DEST_FOOD_KEY(id),
      record.foodSpots || [],
      DEST_FOOD_TTL * 1000,
    );
    return record.foodSpots || [];
  }

  async findMapData(id: string): Promise<MapData | null> {
    const cached = await this.cacheManager.get<MapData>(DEST_MAP_KEY(id));
    if (cached) return cached;

    const record = await this.destinationsRepository.findById(id);
    if (!record) throw new NotFoundException('Destination not found');

    const mapData = record.mapData ?? null;
    if (mapData) {
      await this.cacheManager.set(
        DEST_MAP_KEY(id),
        mapData,
        DEST_MAP_TTL * 1000,
      );
    }
    return mapData;
  }

  toSummary(record: DestinationRecord): DestinationSummary {
    const { content, createdAt, updatedAt, ...summary } = record;
    void content;
    void createdAt;
    void updatedAt;
    return summary;
  }
}
