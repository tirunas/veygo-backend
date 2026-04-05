import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { DestinationsModule } from '../destinations/destinations.module';
import { PricingModule } from '../pricing/pricing.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { WeatherSyncJob } from './weather-sync.job';
import { PriceSyncJob } from './price-sync.job';
import { CacheWarmJob } from './cache-warm.job';
import { AuditCleanupJob } from './audit-cleanup.job';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    DestinationsModule,
    PricingModule,
    PrismaModule,
  ],
  providers: [WeatherSyncJob, PriceSyncJob, CacheWarmJob, AuditCleanupJob],
})
export class JobsModule {}
