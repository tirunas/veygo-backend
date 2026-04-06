import { Module } from '@nestjs/common';
import { RestaurantsRepository } from './restaurants.repository';
import { RestaurantsService } from './restaurants.service';
import { RestaurantsController } from './restaurants.controller';
import { AdminRestaurantsController } from './admin-restaurants.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { GeoMatchingModule } from '../geo-matching/geo-matching.module';
import { CacheModule } from '@nestjs/cache-manager';

@Module({
  imports: [PrismaModule, GeoMatchingModule, CacheModule.register()],
  controllers: [RestaurantsController, AdminRestaurantsController],
  providers: [RestaurantsRepository, RestaurantsService],
  exports: [RestaurantsService],
})
export class RestaurantsModule {}
