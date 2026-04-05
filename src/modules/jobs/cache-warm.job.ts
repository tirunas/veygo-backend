import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { DestinationsService } from '../destinations/destinations.service';

@Injectable()
export class CacheWarmJob implements OnApplicationBootstrap {
  private readonly logger = new Logger(CacheWarmJob.name);

  constructor(private readonly destinationsService: DestinationsService) {}

  async onApplicationBootstrap(): Promise<void> {
    this.logger.log('Warming destination cache on bootstrap');
    const destinations = await this.destinationsService.findAll();
    this.logger.log(`Cache warmed with ${destinations.length} destinations`);
  }
}
