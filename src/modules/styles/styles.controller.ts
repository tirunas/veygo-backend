import { Controller, Get } from '@nestjs/common';
import { StylesService } from './styles.service';
import { StyleRecord } from './styles.types';
import { Public } from '../../common/decorators/public.decorator';

@Controller('styles')
export class StylesController {
  constructor(private readonly stylesService: StylesService) {}

  @Get()
  @Public()
  async findAll(): Promise<StyleRecord[]> {
    return this.stylesService.findAll();
  }
}
