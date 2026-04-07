import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  PipelineJobRecord,
  PipelineItemRecord,
  PipelineJobStatus,
  PipelineItemStatus,
  PipelineType,
  UpdateItemDto,
} from './pipeline.types';

@Injectable()
export class PipelineRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createJob(destinationId: string, type: PipelineType): Promise<PipelineJobRecord> {
    return this.prisma.pipelineJob.create({
      data: { destinationId, type },
    }) as Promise<PipelineJobRecord>;
  }

  async updateJobStatus(
    jobId: string,
    status: PipelineJobStatus,
    errorMessage?: string,
  ): Promise<void> {
    await this.prisma.pipelineJob.update({
      where: { id: jobId },
      data: { status, errorMessage: errorMessage ?? null },
    });
  }

  async incrementJobItemCount(jobId: string, count: number): Promise<void> {
    await this.prisma.pipelineJob.update({
      where: { id: jobId },
      data: { itemCount: { increment: count } },
    });
  }

  async findAllJobs(): Promise<PipelineJobRecord[]> {
    return this.prisma.pipelineJob.findMany({
      orderBy: { createdAt: 'desc' },
    }) as Promise<PipelineJobRecord[]>;
  }

  async findJobById(jobId: string): Promise<PipelineJobRecord | null> {
    return this.prisma.pipelineJob.findUnique({
      where: { id: jobId },
    }) as Promise<PipelineJobRecord | null>;
  }

  async createItem(
    jobId: string,
    data: Omit<PipelineItemRecord, 'id' | 'jobId' | 'status' | 'createdAt' | 'updatedAt'>,
  ): Promise<PipelineItemRecord> {
    return this.prisma.pipelineItem.create({
      data: { jobId, ...data },
    }) as Promise<PipelineItemRecord>;
  }

  async findItemsByJob(jobId: string): Promise<PipelineItemRecord[]> {
    return this.prisma.pipelineItem.findMany({
      where: { jobId },
      orderBy: { createdAt: 'asc' },
    }) as Promise<PipelineItemRecord[]>;
  }

  async findItemById(itemId: string): Promise<PipelineItemRecord | null> {
    return this.prisma.pipelineItem.findUnique({
      where: { id: itemId },
    }) as Promise<PipelineItemRecord | null>;
  }

  async updateItemStatus(itemId: string, status: PipelineItemStatus): Promise<void> {
    await this.prisma.pipelineItem.update({
      where: { id: itemId },
      data: { status },
    });
  }

  async updateItemFields(itemId: string, dto: UpdateItemDto): Promise<PipelineItemRecord> {
    return this.prisma.pipelineItem.update({
      where: { id: itemId },
      data: dto,
    }) as Promise<PipelineItemRecord>;
  }

  async updateItemEnrichment(
    itemId: string,
    enrichment: Pick<PipelineItemRecord, 'nameLt' | 'descriptionLt' | 'wowFacts' | 'hook'>,
  ): Promise<void> {
    await this.prisma.pipelineItem.update({
      where: { id: itemId },
      data: enrichment,
    });
  }

  async updateItemMedia(
    itemId: string,
    media: Pick<PipelineItemRecord, 'youtubeLinks' | 'instagramLinks'>,
  ): Promise<void> {
    await this.prisma.pipelineItem.update({
      where: { id: itemId },
      data: media,
    });
  }
}
