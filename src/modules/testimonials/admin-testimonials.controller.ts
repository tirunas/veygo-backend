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
import { TestimonialsService } from './testimonials.service';
import type {
  CreateTestimonialInput,
  UpdateTestimonialInput,
} from './testimonials.types';

@Controller('admin/testimonials')
@Roles(Role.ADMIN)
@UseGuards(RolesGuard)
export class AdminTestimonialsController {
  constructor(private readonly service: TestimonialsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() body: CreateTestimonialInput) {
    return this.service.create(body);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: UpdateTestimonialInput) {
    return this.service.update(id, body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(@Param('id') id: string) {
    return this.service.delete(id);
  }
}
