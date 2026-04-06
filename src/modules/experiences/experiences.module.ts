import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { PrismaModule } from '../../prisma/prisma.module';
import { ExperiencesRepository } from './experiences.repository';
import { ExperiencesService } from './experiences.service';
import { ExperiencesController } from './experiences.controller';
import { AdminExperiencesController } from './admin-experiences.controller';

@Module({
  imports: [PrismaModule, CacheModule.register()],
  providers: [ExperiencesRepository, ExperiencesService],
  controllers: [ExperiencesController, AdminExperiencesController],
  exports: [ExperiencesService],
})
export class ExperiencesModule {}
