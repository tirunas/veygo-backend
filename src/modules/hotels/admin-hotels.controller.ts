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
import { HotelsService } from './hotels.service';
import type { CreateHotelInput, UpdateHotelInput } from './hotels.types';

@Controller('admin/hotels')
@Roles(Role.ADMIN)
@UseGuards(RolesGuard)
export class AdminHotelsController {
  constructor(private readonly service: HotelsService) {}

  @Post()
  create(@Body() body: CreateHotelInput) {
    return this.service.create(body);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: UpdateHotelInput) {
    return this.service.update(id, body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(@Param('id') id: string) {
    return this.service.delete(id);
  }
}
