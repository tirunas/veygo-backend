import { Module } from '@nestjs/common';
import { AttractionsRepository } from './attractions.repository';
import { AttractionsService } from './attractions.service';
import { AttractionsController } from './attractions.controller';
import { AdminAttractionsController } from './admin-attractions.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { GeoMatchingModule } from '../geo-matching/geo-matching.module';
import { CacheModule } from '@nestjs/cache-manager';

@Module({
  imports: [PrismaModule, GeoMatchingModule, CacheModule.register()],
  controllers: [AttractionsController, AdminAttractionsController],
  providers: [AttractionsRepository, AttractionsService],
  exports: [AttractionsService],
})
export class AttractionsModule {}
