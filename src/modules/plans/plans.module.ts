import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { DestinationsModule } from '../destinations/destinations.module';
import { CacheModule } from '../../cache/cache.module';
import { PlansRepository } from './plans.repository';
import { PlansService } from './plans.service';
import { PlansController } from './plans.controller';
import { UserPlansController } from './user-plans.controller';

@Module({
  imports: [PrismaModule, DestinationsModule, CacheModule],
  controllers: [PlansController, UserPlansController],
  providers: [PlansRepository, PlansService],
  exports: [PlansService],
})
export class PlansModule {}
