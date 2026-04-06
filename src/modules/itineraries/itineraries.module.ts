import { Module } from '@nestjs/common';
import { ItinerariesRepository } from './itineraries.repository';
import { ItinerariesService } from './itineraries.service';
import { ItinerariesController } from './itineraries.controller';
import { AdminItinerariesController } from './admin-itineraries.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { CacheModule } from '@nestjs/cache-manager';

@Module({
  imports: [PrismaModule, CacheModule.register()],
  controllers: [ItinerariesController, AdminItinerariesController],
  providers: [ItinerariesRepository, ItinerariesService],
  exports: [ItinerariesService],
})
export class ItinerariesModule {}
