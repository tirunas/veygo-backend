import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentProvider, PaymentStatus, PlanStatus } from '@prisma/client';
import { randomUUID } from 'crypto';
import { PurchasesRepository } from './purchases.repository';
import { MontonioService } from './montonio.service';
import { StripeService } from './stripe.service';
import { PlansService } from '../plans/plans.service';
import { DestinationsService } from '../destinations/destinations.service';
import { PurchaseRecord, InitiatePaymentResponse } from './payments.types';

const CENTS_PER_EURO = 100;

@Injectable()
export class PaymentsService {
  private readonly appUrl: string;

  constructor(
    private readonly purchasesRepository: PurchasesRepository,
    private readonly plansService: PlansService,
    private readonly destinationsService: DestinationsService,
    private readonly montonioService: MontonioService,
    private readonly stripeService: StripeService,
    private readonly config: ConfigService,
  ) {
    this.appUrl = this.config.get<string>('APP_URL')!;
  }

  async initiateMontonioPayment(
    userId: string,
    userPlanId: string,
    currency: string,
  ): Promise<InitiatePaymentResponse> {
    const plan = await this.plansService.findPlanByIdOrThrow(userPlanId);
    if (plan.userId !== userId) {
      throw new BadRequestException('Plan does not belong to the current user');
    }

    const destination = await this.destinationsService.findByIdOrThrow(
      plan.destinationId,
    );
    if (!destination.content.startingPrice) {
      throw new BadRequestException('Destination has no starting price');
    }

    const amountCents = destination.content.startingPrice * CENTS_PER_EURO;
    const orderId = randomUUID();

    const purchase = await this.purchasesRepository.create({
      userId,
      userPlanId,
      provider: PaymentProvider.MONTONIO,
      providerRef: orderId,
      amount: amountCents,
      currency,
    });

    const result = await this.montonioService.initiatePayment({
      orderId,
      amountCents,
      currency,
      returnUrl: `${this.appUrl}/payments/success`,
      webhookUrl: `${this.appUrl}/payments/montonio/webhook`,
      accessKey: '',
    });

    return {
      purchaseId: purchase.id,
      provider: PaymentProvider.MONTONIO,
      checkoutUrl: result.paymentUrl,
    };
  }

  async initiateStripePayment(
    userId: string,
    userPlanId: string,
    currency: string,
  ): Promise<InitiatePaymentResponse> {
    const plan = await this.plansService.findPlanByIdOrThrow(userPlanId);
    if (plan.userId !== userId) {
      throw new BadRequestException('Plan does not belong to the current user');
    }

    const destination = await this.destinationsService.findByIdOrThrow(
      plan.destinationId,
    );
    if (!destination.content.startingPrice) {
      throw new BadRequestException('Destination has no starting price');
    }

    const amountCents = destination.content.startingPrice * CENTS_PER_EURO;
    const purchase = await this.purchasesRepository.create({
      userId,
      userPlanId,
      provider: PaymentProvider.STRIPE,
      providerRef: 'pending',
      amount: amountCents,
      currency,
    });

    const result = await this.stripeService.createPaymentIntent({
      amountCents,
      currency,
      metadata: { purchaseId: purchase.id, userPlanId, userId },
    });

    await this.purchasesRepository.updateStatus(
      purchase.id,
      PaymentStatus.PENDING,
    );

    return {
      purchaseId: purchase.id,
      provider: PaymentProvider.STRIPE,
      clientSecret: result.clientSecret,
    };
  }

  async handleMontonioWebhook(
    providerRef: string,
    paymentStatus: string,
  ): Promise<void> {
    const purchase =
      await this.purchasesRepository.findByProviderRef(providerRef);
    if (!purchase) return;

    if (paymentStatus === 'PAID') {
      await this.purchasesRepository.updateStatus(
        purchase.id,
        PaymentStatus.PAID,
        new Date(),
      );
      await this.plansService.updatePlanStatus(
        purchase.userPlanId,
        PlanStatus.PAID,
      );
    } else if (paymentStatus === 'CANCELLED') {
      await this.purchasesRepository.updateStatus(
        purchase.id,
        PaymentStatus.FAILED,
      );
    }
  }

  async handleStripeWebhook(paymentIntentId: string): Promise<void> {
    const purchase =
      await this.purchasesRepository.findByProviderRef(paymentIntentId);
    if (!purchase) return;

    await this.purchasesRepository.updateStatus(
      purchase.id,
      PaymentStatus.PAID,
      new Date(),
    );
    await this.plansService.updatePlanStatus(
      purchase.userPlanId,
      PlanStatus.PAID,
    );
  }

  async findUserPurchases(userId: string): Promise<PurchaseRecord[]> {
    return this.purchasesRepository.findByUserId(userId);
  }
}
