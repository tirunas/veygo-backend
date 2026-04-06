import { Module } from '@nestjs/common';
import { HotelsRepository } from './hotels.repository';
import { HotelsService } from './hotels.service';
import { HotelsController } from './hotels.controller';
import { AdminHotelsController } from './admin-hotels.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { GeoMatchingModule } from '../geo-matching/geo-matching.module';
import { CacheModule } from '@nestjs/cache-manager';

@Module({
  imports: [PrismaModule, GeoMatchingModule, CacheModule.register()],
  controllers: [HotelsController, AdminHotelsController],
  providers: [HotelsRepository, HotelsService],
  exports: [HotelsService],
})
export class HotelsModule {}
