import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { DestinationsService } from '../destinations/destinations.service';
import {
  PriceEntry,
  BatchPriceResponse,
  DetectOriginResponse,
  HubCode,
} from './pricing.types';
import { normalizeToHub } from './hub-lookup';
import { PRICE_KEY, PRICE_TTL } from '../../cache/cache.constants';

@Injectable()
export class PricingService {
  constructor(
    private readonly destinationsService: DestinationsService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  async getPrice(
    destinationId: string,
    originCode: string,
  ): Promise<PriceEntry> {
    const hubCode = normalizeToHub(originCode);
    const cacheKey = PRICE_KEY(destinationId, hubCode);

    const cached = await this.cacheManager.get<PriceEntry>(cacheKey);
    if (cached) return cached;

    const destination =
      await this.destinationsService.findByIdOrThrow(destinationId);
    const entry: PriceEntry = {
      destinationId,
      hubCode,
      startingPrice: destination.content.startingPrice ?? 0,
      flightHours: destination.content.flightHours ?? 0,
      currency: 'EUR',
    };

    await this.cacheManager.set(cacheKey, entry, PRICE_TTL * 1000);
    return entry;
  }

  async getPricesBatch(
    originCode: string,
    destinationIds: string[],
  ): Promise<BatchPriceResponse> {
    const prices = await Promise.all(
      destinationIds.map((id) => this.getPrice(id, originCode)),
    );
    return { prices };
  }

  detectOrigin(): DetectOriginResponse {
    return { hubCode: 'VNO' as HubCode };
  }
}
