import { Module } from '@nestjs/common';
import { CacheModule } from '../../cache/cache.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { GeoMatchingModule } from '../geo-matching/geo-matching.module';
import { AttractionsModule } from '../attractions/attractions.module';
import { RestaurantsModule } from '../restaurants/restaurants.module';
import { DestinationsRepository } from './destinations.repository';
import { DestinationsService } from './destinations.service';
import { DestinationsController } from './destinations.controller';
import { AdminDestinationsController } from './admin-destinations.controller';

@Module({
  imports: [CacheModule, PrismaModule, GeoMatchingModule, AttractionsModule, RestaurantsModule],
  controllers: [DestinationsController, AdminDestinationsController],
  providers: [DestinationsRepository, DestinationsService],
  exports: [DestinationsService],
})
export class DestinationsModule {}
