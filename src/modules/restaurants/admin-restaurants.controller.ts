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
import { RestaurantsService } from './restaurants.service';
import type { CreateRestaurantInput, UpdateRestaurantInput } from './restaurants.types';

@Controller('admin/restaurants')
@Roles(Role.ADMIN)
@UseGuards(RolesGuard)
export class AdminRestaurantsController {
  constructor(private readonly service: RestaurantsService) {}

  @Post()
  create(@Body() body: CreateRestaurantInput) {
    return this.service.create(body);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: UpdateRestaurantInput) {
    return this.service.update(id, body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(@Param('id') id: string) {
    return this.service.delete(id);
  }
}
