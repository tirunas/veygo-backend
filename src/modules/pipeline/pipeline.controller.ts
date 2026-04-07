import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { PipelineService } from './pipeline.service';
import type { TriggerPipelineDto, UpdateItemDto } from './pipeline.types';

@Controller('admin/pipeline')
@Roles(Role.ADMIN)
@UseGuards(RolesGuard)
export class PipelineController {
  constructor(private readonly service: PipelineService) {}

  @Post('trigger')
  async triggerJob(@Body() dto: TriggerPipelineDto) {
    return this.service.triggerJob(dto);
  }

  @Get('jobs')
  async listJobs() {
    return this.service.listJobs();
  }

  @Get('jobs/:jobId')
  async getJob(@Param('jobId') jobId: string) {
    return this.service.getJob(jobId);
  }

  @Get('jobs/:jobId/items')
  async listItems(@Param('jobId') jobId: string) {
    return this.service.listItems(jobId);
  }

  @Get('jobs/:jobId/logs')
  async getJobLogs(@Param('jobId') jobId: string) {
    return { logs: this.service.getJobLogs(jobId) };
  }

  @Patch('items/:itemId/approve')
  @HttpCode(HttpStatus.NO_CONTENT)
  async approveItem(@Param('itemId') itemId: string) {
    return this.service.approveItem(itemId);
  }

  @Patch('items/:itemId/reject')
  @HttpCode(HttpStatus.NO_CONTENT)
  async rejectItem(@Param('itemId') itemId: string) {
    return this.service.rejectItem(itemId);
  }

  @Patch('items/:itemId')
  async updateItem(@Param('itemId') itemId: string, @Body() dto: UpdateItemDto) {
    return this.service.updateItem(itemId, dto);
  }

  @Post('items/:itemId/re-enrich')
  async reEnrichItem(@Param('itemId') itemId: string) {
    return this.service.reEnrichItem(itemId);
  }

  @Patch('jobs/:jobId/retry')
  @HttpCode(HttpStatus.NO_CONTENT)
  async retryJob(@Param('jobId') jobId: string) {
    return this.service.retryJob(jobId);
  }
}
