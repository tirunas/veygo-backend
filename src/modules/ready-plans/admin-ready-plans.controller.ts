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
import { ReadyPlansService } from './ready-plans.service';
import type { CreateReadyPlanInput, UpdateReadyPlanInput } from './ready-plans.types';

@Controller('admin/ready-plans')
@Roles(Role.ADMIN)
@UseGuards(RolesGuard)
export class AdminReadyPlansController {
  constructor(private readonly service: ReadyPlansService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() body: CreateReadyPlanInput) {
    return this.service.create(body);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: UpdateReadyPlanInput) {
    return this.service.update(id, body);
  }

  @Patch(':id/publish')
  setPublished(
    @Param('id') id: string,
    @Body('isPublished') isPublished: boolean,
  ) {
    return this.service.setPublished(id, isPublished);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(@Param('id') id: string) {
    return this.service.delete(id);
  }
}
