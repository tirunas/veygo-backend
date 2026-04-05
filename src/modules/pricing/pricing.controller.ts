import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { PricingService } from './pricing.service';
import type {
  PriceEntry,
  BatchPriceRequest,
  BatchPriceResponse,
  DetectOriginResponse,
} from './pricing.types';

@Public()
@Controller('pricing')
export class PricingController {
  constructor(private readonly pricingService: PricingService) {}

  @Get('detect-origin')
  detectOrigin(): DetectOriginResponse {
    return this.pricingService.detectOrigin();
  }

  @Post('batch')
  async getPricesBatch(
    @Body() body: BatchPriceRequest,
  ): Promise<BatchPriceResponse> {
    return this.pricingService.getPricesBatch(
      body.originCode,
      body.destinationIds,
    );
  }

  @Get(':destinationId/:hubCode')
  async getPrice(
    @Param('destinationId') destinationId: string,
    @Param('hubCode') hubCode: string,
  ): Promise<PriceEntry> {
    return this.pricingService.getPrice(destinationId, hubCode);
  }
}
