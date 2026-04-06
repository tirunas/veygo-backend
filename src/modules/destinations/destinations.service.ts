import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { DestinationsRepository } from './destinations.repository';
import {
  DestinationRecord,
  DestinationSummary,
  CreateDestinationInput,
  UpdateDestinationInput,
  DestinationSearchResult,
} from './destinations.types';
import { SearchDestinationsDto } from './dto/search-destinations.dto';
import {
  DEST_LIST_KEY,
  DEST_LIST_TTL,
  DEST_CONTENT_KEY,
  DEST_CONTENT_TTL,
  POI_ATTRACTIONS_KEY,
  POI_RESTAURANTS_KEY,
  POI_HOTELS_KEY,
} from '../../cache/cache.constants';
import { GeoMatchingService } from '../geo-matching/geo-matching.service';

@Injectable()
export class DestinationsService {
  constructor(
    private readonly destinationsRepository: DestinationsRepository,
    private readonly geoMatchingService: GeoMatchingService,
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
    if (!record) throw new NotFoundException(`Destination ${id} not found`);
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

    const geoChanged = input.lat !== undefined || input.lng !== undefined || input.radiusKm !== undefined;
    if (geoChanged) {
      await this.geoMatchingService.recomputeForDestination(id);
      await Promise.all([
        this.cacheManager.del(POI_ATTRACTIONS_KEY(id)),
        this.cacheManager.del(POI_RESTAURANTS_KEY(id)),
        this.cacheManager.del(POI_HOTELS_KEY(id)),
      ]);
    }

    return record;
  }

  async deleteDestination(id: string): Promise<void> {
    await this.destinationsRepository.delete(id);
    await this.cacheManager.del(DEST_LIST_KEY);
    await this.cacheManager.del(DEST_CONTENT_KEY(id));
  }


  toSummary(record: DestinationRecord): DestinationSummary {
    const { content: _content, createdAt: _createdAt, updatedAt: _updatedAt, ...summary } = record;
    return summary as DestinationSummary;
  }

  async search(dto: SearchDestinationsDto): Promise<DestinationSearchResult[]> {
    const styles = dto.styles ? dto.styles.split(',').filter(Boolean) : undefined;
    const months = dto.months ? dto.months.split(',').filter(Boolean) : undefined;

    let records = await this.destinationsRepository.search(dto.q, styles);

    if (dto.maxBudget !== undefined) {
      records = records.filter(
        (r) => (r.content.minDailyBudget ?? 0) <= dto.maxBudget!,
      );
    }

    if (dto.maxFlightH !== undefined) {
      records = records.filter(
        (r) => (r.content.flightHours ?? 0) <= dto.maxFlightH!,
      );
    }

    if (months?.length) {
      records = records.filter((r) => {
        const weatherData = (r.content as any).weather as
          | Array<{ month: string; quality: string }>
          | undefined;
        if (!weatherData) return false;
        return weatherData.some(
          (w) => months.includes(w.month) && w.quality === 'best',
        );
      });
    }

    if (dto.weather) {
      records = records.filter((r) => {
        const match = r.currentWeather?.match(/\d+/);
        if (!match) return true;
        const temp = parseInt(match[0], 10);
        if (isNaN(temp)) return true;
        return dto.weather === 'warm' ? temp >= 20 : temp < 20;
      });
    }

    return records.map((r) => this.toSearchResult(r));
  }

  private toSearchResult(record: DestinationRecord): DestinationSearchResult {
    return {
      id: record.id,
      name: record.name,
      country: record.country,
      styles: record.styles,
      bestSeason: record.bestSeason,
      imgUrl: record.imgUrl,
      heroImageUrl: record.heroImageUrl,
      currentWeather: record.currentWeather,
      minDailyBudget: record.content.minDailyBudget ?? 0,
      flightHours: record.content.flightHours ?? 0,
      startingPrice: record.content.startingPrice ?? 0,
    };
  }
}
