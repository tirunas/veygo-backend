import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { ItinerariesRepository } from './itineraries.repository';
import {
  ITINERARY_KEY,
  ITINERARY_TTL,
} from '../../cache/cache.constants';
import type {
  Itinerary,
  CreateItineraryInput,
  UpdateItineraryInput,
} from './itineraries.types';

@Injectable()
export class ItinerariesService {
  constructor(
    private readonly repo: ItinerariesRepository,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  async findAll(): Promise<Itinerary[]> {
    const rows = await this.repo.findAll();
    return rows as unknown as Itinerary[];
  }

  async findById(id: string): Promise<Itinerary> {
    const cached = await this.cacheManager.get<Itinerary>(
      ITINERARY_KEY(id),
    );
    if (cached) return cached;

    const row = await this.repo.findById(id);
    if (!row) {
      throw new NotFoundException(`Itinerary ${id} not found`);
    }

    const itinerary = row as unknown as Itinerary;
    await this.cacheManager.set(
      ITINERARY_KEY(id),
      itinerary,
      ITINERARY_TTL * 1000,
    );
    return itinerary;
  }

  async create(data: CreateItineraryInput): Promise<Itinerary> {
    const record = await this.repo.create(data);
    return record as unknown as Itinerary;
  }

  async update(id: string, data: UpdateItineraryInput): Promise<Itinerary> {
    const record = await this.repo.update(id, data);
    await this.cacheManager.del(ITINERARY_KEY(id));
    return record as unknown as Itinerary;
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
    await this.cacheManager.del(ITINERARY_KEY(id));
  }
}
