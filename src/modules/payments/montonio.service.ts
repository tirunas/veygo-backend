import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac } from 'crypto';
import * as jwt from 'jsonwebtoken';
import {
  MontonioPaymentParams,
  MontonioPaymentResult,
  MontonioWebhookPayload,
} from './payments.types';

const MONTONIO_JWT_EXPIRY_SECONDS = 600;

@Injectable()
export class MontonioService {
  private readonly accessKey: string;
  private readonly secretKey: string;
  private readonly baseUrl: string;
  private readonly appUrl: string;

  constructor(private readonly config: ConfigService) {
    this.accessKey = this.config.get<string>('MONTONIO_ACCESS_KEY')!;
    this.secretKey = this.config.get<string>('MONTONIO_SECRET_KEY')!;
    this.baseUrl = this.config.get<string>('MONTONIO_BASE_URL')!;
    this.appUrl = this.config.get<string>('APP_URL')!;
  }

  async initiatePayment(
    params: MontonioPaymentParams,
  ): Promise<MontonioPaymentResult> {
    const nowSeconds = Math.floor(Date.now() / 1000);
    const orderPayload = {
      access_key: this.accessKey,
      merchant_reference: params.orderId,
      return_url: params.returnUrl,
      notification_url: params.webhookUrl,
      currency: params.currency,
      grand_total: params.amountCents / 100,
      locale: 'en',
      payment: {
        amount: params.amountCents / 100,
        currency: params.currency,
        method_options_locale: 'LT',
      },
      iat: nowSeconds,
      exp: nowSeconds + MONTONIO_JWT_EXPIRY_SECONDS,
    };

    const orderToken = jwt.sign(orderPayload, this.secretKey, {
      algorithm: 'HS256',
    });

    const response = await fetch(`${this.baseUrl}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: orderToken }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new BadRequestException(
        `Montonio API error: ${response.status} — ${errorText}`,
      );
    }

    const result = (await response.json()) as {
      payment_url: string;
      uuid: string;
    };
    return { paymentUrl: result.payment_url, montonioOrderId: result.uuid };
  }

  verifyWebhookJwt(token: string): MontonioWebhookPayload {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new UnauthorizedException('Invalid Montonio webhook token format');
    }
    const [headerB64, payloadB64, signatureB64] = parts;
    const expectedSignature = createHmac('sha256', this.secretKey)
      .update(`${headerB64}.${payloadB64}`)
      .digest('base64url');

    if (signatureB64 !== expectedSignature) {
      throw new UnauthorizedException('Invalid Montonio webhook signature');
    }

    const decoded = JSON.parse(
      Buffer.from(payloadB64, 'base64url').toString('utf8'),
    ) as MontonioWebhookPayload;
    return decoded;
  }
}
