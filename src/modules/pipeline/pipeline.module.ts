import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { PipelineService } from './pipeline.service';
import { PipelineController } from './pipeline.controller';
import { PipelineRepository } from './pipeline.repository';
import { PipelineCronJob } from './pipeline-cron.job';
import { WebSearchStep } from './steps/web-search.step';
import { PlacesStep } from './steps/places.step';
import { AiEnrichStep } from './steps/ai-enrich.step';
import { MediaStep } from './steps/media.step';
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
    WebSearchStep,
    PlacesStep,
    AiEnrichStep,
    MediaStep,
  ],
  controllers: [PipelineController],
  exports: [PipelineService],
})
export class PipelineModule {}
