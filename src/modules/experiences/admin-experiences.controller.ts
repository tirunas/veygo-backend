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
import { ExperiencesService } from './experiences.service';
import type {
  CreateExperienceInput,
  UpdateExperienceInput,
  Experience,
} from './experiences.types';

@Controller('admin/experiences')
@Roles(Role.ADMIN)
@UseGuards(RolesGuard)
export class AdminExperiencesController {
  constructor(private readonly service: ExperiencesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() body: CreateExperienceInput): Promise<Experience> {
    return this.service.create(body);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() body: UpdateExperienceInput,
  ): Promise<Experience> {
    return this.service.update(id, body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(@Param('id') id: string): Promise<void> {
    return this.service.delete(id);
  }
}
