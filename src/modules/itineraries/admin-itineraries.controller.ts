import {
  Controller,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { ItinerariesService } from './itineraries.service';
import type { CreateItineraryInput, UpdateItineraryInput } from './itineraries.types';

@Controller('admin/itineraries')
@Roles(Role.ADMIN)
@UseGuards(RolesGuard)
export class AdminItinerariesController {
  constructor(private readonly service: ItinerariesService) {}

  @Post()
  create(@Body() body: CreateItineraryInput) {
    return this.service.create(body);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: UpdateItineraryInput) {
    return this.service.update(id, body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(@Param('id') id: string) {
    return this.service.delete(id);
  }
}
