import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DestinationsService } from '../destinations/destinations.service';
import { PricingService } from '../pricing/pricing.service';

const DEFAULT_ORIGIN_HUB = 'VNO';

@Injectable()
export class PriceSyncJob {
  private readonly logger = new Logger(PriceSyncJob.name);

  constructor(
    private readonly destinationsService: DestinationsService,
    private readonly pricingService: PricingService,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async warmPrices(): Promise<void> {
    this.logger.log('Warming price cache for all destinations');
    const destinations = await this.destinationsService.findAll();
    const destinationIds = destinations.map((d) => d.id);

    await this.pricingService.getPricesBatch(
      DEFAULT_ORIGIN_HUB,
      destinationIds,
    );
    this.logger.log(
      `Price cache warmed for ${destinations.length} destinations`,
    );
  }
}
