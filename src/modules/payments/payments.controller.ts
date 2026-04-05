import {
  Controller,
  Post,
  Body,
  Req,
  Headers,
  HttpCode,
  HttpStatus,
  UsePipes,
  BadRequestException,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Request } from 'express';
import { z } from 'zod';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { PaymentsService } from './payments.service';
import { MontonioService } from './montonio.service';
import { StripeService } from './stripe.service';

const initiatePaymentSchema = z.object({
  userPlanId: z.string().uuid(),
  currency: z.string().length(3).default('EUR'),
});

const WEBHOOK_THROTTLE_TTL_MS = 60000;
const WEBHOOK_THROTTLE_LIMIT = 5;

interface RawBodyRequest<T = any> extends Request {
  rawBody?: Buffer;
  body: T;
}

@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly montonioService: MontonioService,
    private readonly stripeService: StripeService,
  ) {}

  @Post('montonio/initiate')
  @UsePipes(new ZodValidationPipe(initiatePaymentSchema))
  async initiateMontonio(
    @CurrentUser() user: { id: string; role: string },
    @Body() body: { userPlanId: string; currency: string },
  ) {
    return this.paymentsService.initiateMontonioPayment(
      user.id,
      body.userPlanId,
      body.currency,
    );
  }

  @Post('stripe/initiate')
  @UsePipes(new ZodValidationPipe(initiatePaymentSchema))
  async initiateStripe(
    @CurrentUser() user: { id: string; role: string },
    @Body() body: { userPlanId: string; currency: string },
  ) {
    return this.paymentsService.initiateStripePayment(
      user.id,
      body.userPlanId,
      body.currency,
    );
  }

  @Public()
  @Post('montonio/webhook')
  @HttpCode(HttpStatus.OK)
  @Throttle({
    default: { ttl: WEBHOOK_THROTTLE_TTL_MS, limit: WEBHOOK_THROTTLE_LIMIT },
  })
  async montonioWebhook(@Body() body: { payment_token: string }) {
    if (!body.payment_token) {
      throw new BadRequestException('Missing payment_token');
    }
    const payload = this.montonioService.verifyWebhookJwt(body.payment_token);
    await this.paymentsService.handleMontonioWebhook(
      payload.merchant_reference,
      payload.payment_status,
    );
    return { received: true };
  }

  @Public()
  @Post('stripe/webhook')
  @HttpCode(HttpStatus.OK)
  @Throttle({
    default: { ttl: WEBHOOK_THROTTLE_TTL_MS, limit: WEBHOOK_THROTTLE_LIMIT },
  })
  async stripeWebhook(
    @Req() req: RawBodyRequest,
    @Headers('stripe-signature') signature: string,
  ) {
    if (!req.rawBody) {
      throw new BadRequestException('Raw body not available');
    }
    const event = this.stripeService.verifyWebhookSignature(
      req.rawBody,
      signature,
    );
    if (event.type === 'payment_intent.succeeded') {
      const intent = event.data.object as { id: string };
      await this.paymentsService.handleStripeWebhook(intent.id);
    }
    return { received: true };
  }
}
