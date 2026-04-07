import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PipelineRepository } from './pipeline.repository';
import { OverpassStep } from './steps/overpass.step';
import { WebSearchStep } from './steps/web-search.step';
import { AiEnrichStep } from './steps/ai-enrich.step';
import { WikiStep } from './steps/wiki.step';
import {
  PipelineJobRecord,
  PipelineItemRecord,
  TriggerPipelineDto,
  UpdateItemDto,
} from './pipeline.types';
import { AttractionsService } from '../attractions/attractions.service';
import { RestaurantsService } from '../restaurants/restaurants.service';
import { DestinationsService } from '../destinations/destinations.service';
import { ResearchStep } from './steps/research.step';
import { createId } from '@paralleldrive/cuid2';

@Injectable()
export class PipelineService {
  private readonly logger = new Logger(PipelineService.name);
  private readonly jobLogs = new Map<string, string[]>();

  private addLog(jobId: string, message: string): void {
    const timestamp = new Date().toISOString().substring(11, 19);
    const line = `[${timestamp}] ${message}`;
    this.logger.log(line);
    if (!this.jobLogs.has(jobId)) this.jobLogs.set(jobId, []);
    this.jobLogs.get(jobId)!.push(line);
  }

  getJobLogs(jobId: string): string[] {
    return this.jobLogs.get(jobId) ?? [];
  }

  constructor(
    private readonly repository: PipelineRepository,
    private readonly overpassStep: OverpassStep,
    private readonly webSearchStep: WebSearchStep,
    private readonly aiEnrichStep: AiEnrichStep,
    private readonly wikiStep: WikiStep,
    private readonly researchStep: ResearchStep,
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
      this.addLog(jobId, `Pipeline started for "${destination.name}" (${type})`);

      // Step 1: Discover places — Overpass (real OSM data) if destination has coords,
      //         fallback to web search (AI + Reddit + DDG) otherwise.
      await this.repository.updateJobStatus(jobId, 'searching');
      this.addLog(jobId, `Step 1: Searching for ${type}s...`);

      const existingNames = await this.loadExistingNames(destinationId, type);

      let candidates: Array<{
        sourceId: string;
        name: string;
        address: string | null;
        lat: number;
        lng: number;
        osmCategory: string | null;
      }> = [];

      const destLat = destination.lat ?? null;
      const destLng = destination.lng ?? null;
      const radiusKm = (destination as any).radiusKm ?? 10;

      if (destLat && destLng) {
        this.addLog(jobId, `Discovering via Overpass (${destLat},${destLng} r=${radiusKm}km)`);
        const osmPlaces = await this.overpassStep.discover(destLat, destLng, radiusKm, type);

        candidates = osmPlaces
          .filter((p) => !existingNames.has(p.name.toLowerCase().trim()))
          .slice(0, 10);

        this.addLog(jobId, `Overpass: ${osmPlaces.length} found, ${candidates.length} new after dedup`);
      } else {
        // Fallback: AI + web search + geocode
        this.addLog(jobId, `No destination coordinates — falling back to web search`);
        await this.repository.updateJobStatus(jobId, 'places');

        const discovered = await this.webSearchStep.discover(destination.name, type);
        const newNames = discovered
          .filter((d) => !existingNames.has(d.name.toLowerCase().trim()))
          .map((d) => d.name)
          .slice(0, 20);

        this.addLog(jobId, `Web search: ${discovered.length} found, ${newNames.length} new`);

        // Geocode each name via Nominatim
        for (const name of newNames) {
          try {
            const geocoded = await this.geocodeViaNominatim(name, destination.name);
            if (geocoded) {
              candidates.push({ ...geocoded, osmCategory: null });
            }
          } catch (err) {
            this.addLog(jobId, `Geocode failed for "${name}": ${String(err)}`);
          }
        }

        this.addLog(jobId, `Geocoded ${candidates.length}/${newNames.length} places`);
      }

      if (candidates.length === 0) {
        this.addLog(jobId, `No new candidates found — pipeline complete with 0 items`);
        await this.repository.updateJobStatus(jobId, 'ready');
        return;
      }

      // Step 2: Save items to DB
      this.addLog(jobId, `Step 2: Saving ${candidates.length} places to database...`);
      await this.repository.updateJobStatus(jobId, 'places');
      const items = await Promise.all(
        candidates.map((place) =>
          this.repository.createItem(jobId, {
            googlePlaceId: place.sourceId,
            name: place.name,
            address: place.address,
            lat: place.lat,
            lng: place.lng,
            rating: null,
            openingHours: null,
            photos: [],
            nameLt: null,
            descriptionLt: null,
            wowFacts: [],
            hook: null,
            category: place.osmCategory,
            ticketInfo: null,
            bestTimeToVisit: null,
            travellerTips: [],
            officialWebsite: null,
            bookingUrls: [],
            youtubeLinks: [],
            instagramLinks: [],
            howToGetThere: null,
            bestPhotoSpot: null,
            insiderTip: null,
            hiddenNearby: null,
            avoidIfYou: null,
            uniquenessScore: null,
          }),
        ),
      );

      await this.repository.incrementJobItemCount(jobId, items.length);
      this.addLog(jobId, `Saved ${items.length} candidates to database`);

      // Step 3: Wikipedia photos + AI enrichment
      await this.repository.updateJobStatus(jobId, 'enriching');
      this.addLog(jobId, `Enriching ${items.length} places with Wikipedia + AI...`);
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        try {
          this.addLog(jobId, `── ${item.name} (${i + 1}/${items.length}) ───────────`);
          const wiki = await this.wikiStep.fetchWikiData(item.name);
          const research = await this.researchStep.research(
            item.name,
            destination.name,
            jobId,
            (msg) => this.addLog(jobId, msg),
            wiki.descriptionEn,
            wiki.photos,
          );

          const enrichment = await this.aiEnrichStep.enrich(
            research,
            type,
            item.address,
          );

          // Preserve OSM category if AI didn't assign a better one
          const category = enrichment.category || item.category;

          await this.repository.updateItemEnrichment(item.id, { ...enrichment, category: category ?? '' });

          if (wiki.photos.length) {
            await this.repository.updateItemMedia(item.id, {
              photos: wiki.photos,
              youtubeLinks: [],
              instagramLinks: [],
            });
          }
          this.addLog(jobId, `  ✓ ${item.name} — enriched (${wiki.photos.length} photos)`);
        } catch (error) {
          this.addLog(jobId, `  ✗ ${item.name} — enrichment failed: ${String(error)}`);
        }
      }

      await this.repository.updateJobStatus(jobId, 'ready');
      this.addLog(jobId, `Pipeline complete — ${items.length} items ready for review`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await this.repository.updateJobStatus(jobId, 'failed', message);
      this.addLog(jobId, `Pipeline FAILED: ${message}`);
    }
  }

  private async loadExistingNames(
    destinationId: string,
    type: 'attraction' | 'restaurant',
  ): Promise<Set<string>> {
    try {
      if (type === 'attraction') {
        const items = await this.attractionsService.findByDestination(destinationId);
        return new Set(items.map((i) => i.name.toLowerCase().trim()));
      } else {
        const items = await this.restaurantsService.findByDestination(destinationId);
        return new Set(items.map((i) => i.name.toLowerCase().trim()));
      }
    } catch {
      return new Set();
    }
  }

  private async geocodeViaNominatim(
    placeName: string,
    destinationName: string,
  ): Promise<{ sourceId: string; name: string; address: string | null; lat: number; lng: number } | null> {
    await this.delay(1200);

    const query = `${placeName}, ${destinationName}`;
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&addressdetails=0`;

    const response = await fetch(url, {
      headers: { 'User-Agent': 'VeygoBot/1.0 (travel planning app)' },
    });

    if (!response.ok) return null;

    const data = await response.json() as Array<{
      osm_type: string;
      osm_id: number;
      display_name: string;
      lat: string;
      lon: string;
    }>;

    if (!data.length) return null;

    const result = data[0];
    return {
      sourceId: `${result.osm_type}-${result.osm_id}`,
      name: placeName,
      address: result.display_name,
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
    };
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async reEnrichItem(itemId: string): Promise<PipelineItemRecord> {
    const item = await this.repository.findItemById(itemId);
    if (!item) throw new NotFoundException(`Pipeline item ${itemId} not found`);

    const job = await this.repository.findJobById(item.jobId);
    if (!job) throw new NotFoundException(`Pipeline job ${item.jobId} not found`);

    const destination = await this.destinationsService.findByIdOrThrow(job.destinationId);
    const type = job.type as 'attraction' | 'restaurant';

    const logFn = (msg: string) => this.addLog(job.id, msg);
    this.addLog(job.id, `── Re-enriching: ${item.name} ───────────`);

    const wiki = await this.wikiStep.fetchWikiData(item.name);
    const research = await this.researchStep.research(
      item.name,
      destination.name,
      job.id,
      logFn,
      wiki.descriptionEn,
      wiki.photos,
    );

    const enrichment = await this.aiEnrichStep.enrich(research, type, item.address);
    const category = enrichment.category || item.category;
    await this.repository.updateItemEnrichment(item.id, { ...enrichment, category: category ?? '' });

    if (wiki.photos.length) {
      await this.repository.updateItemMedia(item.id, { photos: wiki.photos, youtubeLinks: [], instagramLinks: [] });
    }

    this.addLog(job.id, `  ✓ Re-enriched — uniqueness: ${enrichment.uniquenessScore}/10`);
    const updated = await this.repository.findItemById(itemId);
    return updated!;
  }

  async listJobs(): Promise<PipelineJobRecord[]> {
    return this.repository.findAllJobs();
  }

  async getJob(jobId: string): Promise<PipelineJobRecord> {
    const job = await this.repository.findJobById(jobId);
    if (!job) throw new NotFoundException(`Pipeline job ${jobId} not found`);
    return job;
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
        img: item.photos[0] ?? item.instagramLinks[0] ?? '',
        category: 'popular',
        lat: item.lat ?? 0,
        lng: item.lng ?? 0,
        openingHours: item.openingHours ?? undefined,
        content: {
          hook: item.hook ?? undefined,
          photos: [...item.photos, ...item.instagramLinks],
        },
      });
    } else {
      await this.restaurantsService.create({
        id: createId(),
        destinationId: job.destinationId,
        name: item.nameLt ?? item.name,
        description: item.descriptionLt ?? '',
        img: item.photos[0] ?? item.instagramLinks[0] ?? '',
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
