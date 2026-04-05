import { PaymentProvider, PaymentStatus } from '@prisma/client';

export interface PurchaseRecord {
  id: string;
  userId: string;
  userPlanId: string;
  provider: PaymentProvider;
  providerRef: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  paidAt: Date | null;
  createdAt: Date;
}

export interface CreatePurchaseInput {
  userId: string;
  userPlanId: string;
  provider: PaymentProvider;
  providerRef: string;
  amount: number;
  currency: string;
}

export interface InitiatePaymentResponse {
  purchaseId: string;
  provider: PaymentProvider;
  checkoutUrl?: string;
  clientSecret?: string;
}

export interface MontonioPaymentParams {
  orderId: string;
  amountCents: number;
  currency: string;
  returnUrl: string;
  webhookUrl: string;
  accessKey: string;
}

export interface MontonioPaymentResult {
  paymentUrl: string;
  montonioOrderId: string;
}

export interface MontonioWebhookPayload {
  merchant_reference: string;
  payment_status: 'PAID' | 'PENDING' | 'CANCELLED' | 'AUTHORIZED';
  uuid?: string;
}

export interface StripePaymentParams {
  amountCents: number;
  currency: string;
  metadata: {
    purchaseId: string;
    userPlanId: string;
    userId: string;
  };
}

export interface StripePaymentResult {
  clientSecret: string;
  paymentIntentId: string;
}
