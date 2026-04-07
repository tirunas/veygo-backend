import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PipelineService } from './pipeline.service';
import { DestinationsService } from '../destinations/destinations.service';

@Injectable()
export class PipelineCronJob {
  private readonly logger = new Logger(PipelineCronJob.name);

  constructor(
    private readonly pipelineService: PipelineService,
    private readonly destinationsService: DestinationsService,
  ) {}

  @Cron('0 2 * * 0')
  async runWeeklyPipeline(): Promise<void> {
    this.logger.log('Starting weekly pipeline run');
    const destinations = await this.destinationsService.findAll();

    for (const destination of destinations) {
      await this.pipelineService.triggerJob({ destinationId: destination.id, type: 'attraction' });
      await this.pipelineService.triggerJob({ destinationId: destination.id, type: 'restaurant' });
    }

    this.logger.log(`Weekly pipeline triggered for ${destinations.length} destinations`);
  }
}
