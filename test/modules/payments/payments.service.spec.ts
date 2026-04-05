import { BadRequestException } from '@nestjs/common';
import { PaymentProvider, PlanStatus, PaymentStatus } from '@prisma/client';
import { PaymentsService } from '../../../src/modules/payments/payments.service';

describe('PaymentsService', () => {
  const mockPurchasesRepository = {
    create: jest.fn(),
    findByProviderRef: jest.fn(),
    findByUserId: jest.fn(),
    updateStatus: jest.fn(),
  };

  const mockPlansService = {
    findPlanByIdOrThrow: jest.fn(),
    updatePlanStatus: jest.fn(),
  };

  const mockDestinationsService = {
    findByIdOrThrow: jest.fn(),
  };

  const mockMontonioService = {
    initiatePayment: jest.fn(),
  };

  const mockStripeService = {
    createPaymentIntent: jest.fn(),
    verifyWebhookSignature: jest.fn(),
  };

  const mockConfig = {
    get: jest.fn((key: string) => {
      const values: Record<string, string> = {
        APP_URL: 'https://app.example.com',
      };
      return values[key];
    }),
  };

  let service: PaymentsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new PaymentsService(
      mockPurchasesRepository as any,
      mockPlansService as any,
      mockDestinationsService as any,
      mockMontonioService as any,
      mockStripeService as any,
      mockConfig as any,
    );
  });

  describe('initiateMontonioPayment', () => {
    const plan = {
      id: 'plan-1',
      userId: 'user-1',
      destinationId: 'paris',
      status: PlanStatus.DRAFT,
    };
    const destination = {
      id: 'paris',
      content: { startingPrice: 500 },
    };

    it('creates a purchase and returns checkoutUrl', async () => {
      mockPlansService.findPlanByIdOrThrow.mockResolvedValue(plan);
      mockDestinationsService.findByIdOrThrow.mockResolvedValue(destination);
      mockPurchasesRepository.create.mockResolvedValue({
        id: 'pur-1',
        provider: PaymentProvider.MONTONIO,
      });
      mockMontonioService.initiatePayment.mockResolvedValue({
        paymentUrl: 'https://montonio.com/pay',
        montonioOrderId: 'mont-order-1',
      });

      const result = await service.initiateMontonioPayment(
        'user-1',
        'plan-1',
        'EUR',
      );

      expect(mockPurchasesRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-1',
          userPlanId: 'plan-1',
          provider: PaymentProvider.MONTONIO,
          amount: 50000,
          currency: 'EUR',
        }),
      );
      expect(result.checkoutUrl).toBe('https://montonio.com/pay');
      expect(result.provider).toBe(PaymentProvider.MONTONIO);
    });

    it('throws BadRequestException when plan does not belong to user', async () => {
      const otherUserPlan = { ...plan, userId: 'other-user' };
      mockPlansService.findPlanByIdOrThrow.mockResolvedValue(otherUserPlan);
      await expect(
        service.initiateMontonioPayment('user-1', 'plan-1', 'EUR'),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when destination has no starting price', async () => {
      mockPlansService.findPlanByIdOrThrow.mockResolvedValue(plan);
      mockDestinationsService.findByIdOrThrow.mockResolvedValue({
        id: 'paris',
        content: { startingPrice: undefined },
      });
      await expect(
        service.initiateMontonioPayment('user-1', 'plan-1', 'EUR'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('handleMontonioWebhook', () => {
    it('updates purchase and plan to PAID on PAID status', async () => {
      const purchase = {
        id: 'pur-1',
        userPlanId: 'plan-1',
        status: PaymentStatus.PENDING,
      };
      mockPurchasesRepository.findByProviderRef.mockResolvedValue(purchase);
      mockPurchasesRepository.updateStatus.mockResolvedValue(undefined);
      mockPlansService.updatePlanStatus.mockResolvedValue(undefined);

      await service.handleMontonioWebhook('order-1', 'PAID');

      expect(mockPurchasesRepository.updateStatus).toHaveBeenCalledWith(
        'pur-1',
        PaymentStatus.PAID,
        expect.any(Date),
      );
      expect(mockPlansService.updatePlanStatus).toHaveBeenCalledWith(
        'plan-1',
        PlanStatus.PAID,
      );
    });

    it('updates purchase to FAILED on CANCELLED status', async () => {
      const purchase = {
        id: 'pur-1',
        userPlanId: 'plan-1',
        status: PaymentStatus.PENDING,
      };
      mockPurchasesRepository.findByProviderRef.mockResolvedValue(purchase);
      mockPurchasesRepository.updateStatus.mockResolvedValue(undefined);

      await service.handleMontonioWebhook('order-1', 'CANCELLED');

      expect(mockPurchasesRepository.updateStatus).toHaveBeenCalledWith(
        'pur-1',
        PaymentStatus.FAILED,
      );
      expect(mockPlansService.updatePlanStatus).not.toHaveBeenCalled();
    });

    it('skips processing when purchase is not found', async () => {
      mockPurchasesRepository.findByProviderRef.mockResolvedValue(null);
      await service.handleMontonioWebhook('unknown-order', 'PAID');
      expect(mockPurchasesRepository.updateStatus).not.toHaveBeenCalled();
    });
  });

  describe('findUserPurchases', () => {
    it('returns purchases from repository', async () => {
      const purchases = [{ id: 'pur-1', userId: 'user-1' }];
      mockPurchasesRepository.findByUserId.mockResolvedValue(purchases);
      const result = await service.findUserPurchases('user-1');
      expect(result).toEqual(purchases);
    });
  });
});
