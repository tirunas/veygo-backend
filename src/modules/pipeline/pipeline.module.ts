import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { PipelineService } from './pipeline.service';
import { PipelineController } from './pipeline.controller';
import { PipelineRepository } from './pipeline.repository';
import { PipelineCronJob } from './pipeline-cron.job';
import { OverpassStep } from './steps/overpass.step';
import { WebSearchStep } from './steps/web-search.step';
import { AiEnrichStep } from './steps/ai-enrich.step';
import { WikiStep } from './steps/wiki.step';
import { ResearchStep } from './steps/research.step';
import { PrismaModule } from '../../prisma/prisma.module';
import { AttractionsModule } from '../attractions/attractions.module';
import { RestaurantsModule } from '../restaurants/restaurants.module';
import { DestinationsModule } from '../destinations/destinations.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    PrismaModule,
    AttractionsModule,
    RestaurantsModule,
    DestinationsModule,
  ],
  providers: [
    PipelineRepository,
    PipelineService,
    PipelineCronJob,
    OverpassStep,
    WebSearchStep,
    AiEnrichStep,
    WikiStep,
    ResearchStep,
  ],
  controllers: [PipelineController],
  exports: [PipelineService],
})
export class PipelineModule {}
