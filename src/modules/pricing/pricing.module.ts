import { Module } from '@nestjs/common';
import { CacheModule } from '../../cache/cache.module';
import { DestinationsModule } from '../destinations/destinations.module';
import { PricingService } from './pricing.service';
import { PricingController } from './pricing.controller';

@Module({
  imports: [CacheModule, DestinationsModule],
  controllers: [PricingController],
  providers: [PricingService],
  exports: [PricingService],
})
export class PricingModule {}
