import {
  Controller,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import type {
  DestinationRecord,
  CreateDestinationInput,
  UpdateDestinationInput,
} from './destinations.types';
import { DestinationsService } from './destinations.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';

@Controller('admin/destinations')
@Roles(Role.ADMIN)
@UseGuards(RolesGuard)
export class AdminDestinationsController {
  constructor(private readonly destinationsService: DestinationsService) {}

  @Post()
  async create(
    @Body() body: CreateDestinationInput,
  ): Promise<DestinationRecord> {
    return this.destinationsService.createDestination(body);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() body: UpdateDestinationInput,
  ): Promise<DestinationRecord> {
    return this.destinationsService.updateDestination(id, body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    return this.destinationsService.deleteDestination(id);
  }
}
