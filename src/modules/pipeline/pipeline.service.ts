import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PipelineRepository } from './pipeline.repository';
import { WebSearchStep } from './steps/web-search.step';
import { PlacesStep } from './steps/places.step';
import { AiEnrichStep } from './steps/ai-enrich.step';
import { MediaStep } from './steps/media.step';
import {
  PipelineJobRecord,
  PipelineItemRecord,
  TriggerPipelineDto,
  UpdateItemDto,
} from './pipeline.types';
import { AttractionsService } from '../attractions/attractions.service';
import { RestaurantsService } from '../restaurants/restaurants.service';
import { DestinationsService } from '../destinations/destinations.service';
import { createId } from '@paralleldrive/cuid2';

@Injectable()
export class PipelineService {
  private readonly logger = new Logger(PipelineService.name);

  constructor(
    private readonly repository: PipelineRepository,
    private readonly webSearchStep: WebSearchStep,
    private readonly placesStep: PlacesStep,
    private readonly aiEnrichStep: AiEnrichStep,
    private readonly mediaStep: MediaStep,
    private readonly attractionsService: AttractionsService,
    private readonly restaurantsService: RestaurantsService,
    private readonly destinationsService: DestinationsService,
  ) {}

  async triggerJob(dto: TriggerPipelineDto): Promise<PipelineJobRecord> {
    const job = await this.repository.createJob(dto.destinationId, dto.type);
    this.runPipeline(job.id, dto.destinationId, dto.type).catch((error: unknown) => {
      this.logger.error(`Pipeline ${job.id} crashed: ${String(error)}`);
    });
    return job;
  }

  private async runPipeline(
    jobId: string,
    destinationId: string,
    type: 'attraction' | 'restaurant',
  ): Promise<void> {
    try {
      const destination = await this.destinationsService.findByIdOrThrow(destinationId);
      const destinationName = destination.name;

      await this.repository.updateJobStatus(jobId, 'searching');
      const discovered = await this.webSearchStep.discover(destinationName, type);

      await this.repository.updateJobStatus(jobId, 'places');
      const placeDetails = await Promise.all(
        discovered.map((place) => this.placesStep.fetchDetails(place.name, destinationName)),
      );
      const validPlaces = placeDetails.filter((p): p is NonNullable<typeof p> => p !== null);

      const items = await Promise.all(
        validPlaces.map((place) =>
          this.repository.createItem(jobId, {
            googlePlaceId: place.googlePlaceId,
            name: place.name,
            address: place.address,
            lat: place.lat,
            lng: place.lng,
            rating: place.rating,
            openingHours: place.openingHours,
            photos: place.photos,
            nameLt: null,
            descriptionLt: null,
            wowFacts: [],
            hook: null,
            youtubeLinks: [],
            instagramLinks: [],
          }),
        ),
      );

      await this.repository.incrementJobItemCount(jobId, items.length);

      await this.repository.updateJobStatus(jobId, 'enriching');
      for (const item of items) {
        try {
          const enrichment = await this.aiEnrichStep.enrich(item.name, item.address, type);
          await this.repository.updateItemEnrichment(item.id, enrichment);
        } catch (error) {
          this.logger.warn(`Enrichment failed for item ${item.id}: ${String(error)}`);
        }
      }

      await this.repository.updateJobStatus(jobId, 'media');
      for (const item of items) {
        try {
          const media = await this.mediaStep.findMedia(item.name, destinationName);
          await this.repository.updateItemMedia(item.id, media);
        } catch (error) {
          this.logger.warn(`Media search failed for item ${item.id}: ${String(error)}`);
        }
      }

      await this.repository.updateJobStatus(jobId, 'ready');
      this.logger.log(`Pipeline ${jobId} completed with ${items.length} items`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await this.repository.updateJobStatus(jobId, 'failed', message);
      this.logger.error(`Pipeline ${jobId} failed: ${message}`);
    }
  }

  async listJobs(): Promise<PipelineJobRecord[]> {
    return this.repository.findAllJobs();
  }

  async listItems(jobId: string): Promise<PipelineItemRecord[]> {
    return this.repository.findItemsByJob(jobId);
  }

  async approveItem(itemId: string): Promise<void> {
    const item = await this.repository.findItemById(itemId);
    if (!item) throw new NotFoundException(`Pipeline item ${itemId} not found`);

    const job = await this.repository.findJobById(item.jobId);
    if (!job) throw new NotFoundException(`Pipeline job ${item.jobId} not found`);

    if (job.type === 'attraction') {
      await this.attractionsService.create({
        id: createId(),
        destinationId: job.destinationId,
        name: item.nameLt ?? item.name,
        description: item.descriptionLt ?? '',
        priceAndDuration: '',
        img: item.photos[0] ?? '',
        category: 'popular',
        lat: item.lat ?? 0,
        lng: item.lng ?? 0,
        openingHours: item.openingHours ?? undefined,
        content: {
          hook: item.hook ?? undefined,
          photos: item.photos,
        },
      });
    } else {
      await this.restaurantsService.create({
        id: createId(),
        destinationId: job.destinationId,
        name: item.nameLt ?? item.name,
        description: item.descriptionLt ?? '',
        img: item.photos[0] ?? '',
        type: 'restaurant',
        price: '€€',
        lat: item.lat ?? 0,
        lng: item.lng ?? 0,
        openingHours: item.openingHours ?? undefined,
      });
    }

    await this.repository.updateItemStatus(itemId, 'approved');
  }

  async rejectItem(itemId: string): Promise<void> {
    const item = await this.repository.findItemById(itemId);
    if (!item) throw new NotFoundException(`Pipeline item ${itemId} not found`);
    await this.repository.updateItemStatus(itemId, 'rejected');
  }

  async updateItem(itemId: string, dto: UpdateItemDto): Promise<PipelineItemRecord> {
    const item = await this.repository.findItemById(itemId);
    if (!item) throw new NotFoundException(`Pipeline item ${itemId} not found`);
    return this.repository.updateItemFields(itemId, dto);
  }

  async retryJob(jobId: string): Promise<void> {
    const job = await this.repository.findJobById(jobId);
    if (!job) throw new NotFoundException(`Pipeline job ${jobId} not found`);
    this.runPipeline(jobId, job.destinationId, job.type).catch((error: unknown) => {
      this.logger.error(`Pipeline retry ${jobId} crashed: ${String(error)}`);
    });
  }
}
