import {
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StripeService } from '../../../src/modules/payments/stripe.service';

describe('StripeService', () => {
  const mockConfig = {
    get: jest.fn((key: string) => {
      const values: Record<string, string> = {
        STRIPE_SECRET_KEY: 'sk_test_mock',
        STRIPE_WEBHOOK_SECRET: 'whsec_mock',
      };
      return values[key];
    }),
  } as unknown as ConfigService;

  const mockStripe = {
    paymentIntents: {
      create: jest.fn(),
    },
    webhooks: {
      constructEvent: jest.fn(),
    },
  };

  let service: StripeService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new StripeService(mockConfig);
    // Inject mock stripe instance
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    (service as any).stripe = mockStripe;
  });

  describe('createPaymentIntent', () => {
    it('creates a PaymentIntent and returns clientSecret and paymentIntentId', async () => {
      mockStripe.paymentIntents.create.mockResolvedValue({
        client_secret: 'pi_secret_123',
        id: 'pi_123',
      });

      const result = await service.createPaymentIntent({
        amountCents: 50000,
        currency: 'EUR',
        metadata: {
          purchaseId: 'pur-1',
          userPlanId: 'plan-1',
          userId: 'user-1',
        },
      });

      expect(mockStripe.paymentIntents.create).toHaveBeenCalledWith({
        amount: 50000,
        currency: 'eur',
        metadata: {
          purchaseId: 'pur-1',
          userPlanId: 'plan-1',
          userId: 'user-1',
        },
        automatic_payment_methods: { enabled: true },
      });
      expect(result.clientSecret).toBe('pi_secret_123');
      expect(result.paymentIntentId).toBe('pi_123');
    });

    it('throws Error if Stripe returns no client_secret', async () => {
      mockStripe.paymentIntents.create.mockResolvedValue({
        id: 'pi_123',
        client_secret: null,
      });
      await expect(
        service.createPaymentIntent({
          amountCents: 1000,
          currency: 'EUR',
          metadata: { purchaseId: 'p', userPlanId: 'pl', userId: 'u' },
        }),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('verifyWebhookSignature', () => {
    it('returns parsed event for valid signature', () => {
      const event = {
        type: 'payment_intent.succeeded',
        data: { object: { id: 'pi_1' } },
      };

      mockStripe.webhooks.constructEvent.mockReturnValue(event);
      const result = service.verifyWebhookSignature(
        Buffer.from('{}'),
        'stripe-sig',
      );

      expect(mockStripe.webhooks.constructEvent).toHaveBeenCalledWith(
        Buffer.from('{}'),
        'stripe-sig',
        'whsec_mock',
      );
      expect(result).toEqual(event);
    });

    it('throws UnauthorizedException for invalid signature', () => {
      mockStripe.webhooks.constructEvent.mockImplementation(() => {
        throw new Error('No signatures found matching');
      });
      expect(() =>
        service.verifyWebhookSignature(Buffer.from('{}'), 'bad-sig'),
      ).toThrow(UnauthorizedException);
    });
  });
});
