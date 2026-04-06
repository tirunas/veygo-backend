import { Module } from '@nestjs/common';
import { ReadyPlansRepository } from './ready-plans.repository';
import { ReadyPlansService } from './ready-plans.service';
import { ReadyPlansController } from './ready-plans.controller';
import { AdminReadyPlansController } from './admin-ready-plans.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { CacheModule } from '@nestjs/cache-manager';

@Module({
  imports: [PrismaModule, CacheModule.register()],
  controllers: [ReadyPlansController, AdminReadyPlansController],
  providers: [ReadyPlansRepository, ReadyPlansService],
  exports: [ReadyPlansService],
})
export class ReadyPlansModule {}
