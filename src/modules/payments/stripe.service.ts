import {
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import type {
  StripePaymentParams,
  StripePaymentResult,
} from './payments.types';

@Injectable()
export class StripeService {
  private readonly stripe: unknown;
  private readonly webhookSecret: string;

  constructor(private readonly config: ConfigService) {
    this.stripe = new (Stripe as unknown as new (key: string) => unknown)(
      this.config.get<string>('STRIPE_SECRET_KEY')!,
    );
    this.webhookSecret = this.config.get<string>('STRIPE_WEBHOOK_SECRET')!;
  }

  async createPaymentIntent(
    params: StripePaymentParams,
  ): Promise<StripePaymentResult> {
    const intent = await (
      this.stripe as {
        paymentIntents: {
          create: (
            params: unknown,
          ) => Promise<{ client_secret: string; id: string }>;
        };
      }
    ).paymentIntents.create({
      amount: params.amountCents,
      currency: params.currency.toLowerCase(),
      metadata: params.metadata,
      automatic_payment_methods: { enabled: true },
    });

    if (!intent.client_secret) {
      throw new InternalServerErrorException(
        'Stripe PaymentIntent missing client_secret',
      );
    }

    return { clientSecret: intent.client_secret, paymentIntentId: intent.id };
  }

  verifyWebhookSignature(
    rawBody: Buffer,
    signature: string,
  ): { type: string; data: { object: unknown } } {
    try {
      return (
        this.stripe as {
          webhooks: {
            constructEvent: (
              rawBody: Buffer,
              sig: string,
              secret: string,
            ) => { type: string; data: { object: unknown } };
          };
        }
      ).webhooks.constructEvent(rawBody, signature, this.webhookSecret);
    } catch {
      throw new UnauthorizedException('Invalid Stripe webhook signature');
    }
  }
}
