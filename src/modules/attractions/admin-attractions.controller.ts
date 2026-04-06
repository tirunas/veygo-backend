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
import { AttractionsService } from './attractions.service';
import type { CreateAttractionInput, UpdateAttractionInput } from './attractions.types';

@Controller('admin/attractions')
@Roles(Role.ADMIN)
@UseGuards(RolesGuard)
export class AdminAttractionsController {
  constructor(private readonly service: AttractionsService) {}

  @Post()
  create(@Body() body: CreateAttractionInput) {
    return this.service.create(body);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: UpdateAttractionInput) {
    return this.service.update(id, body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(@Param('id') id: string) {
    return this.service.delete(id);
  }
}
