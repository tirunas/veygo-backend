import { PrismaService } from '../../../src/prisma/prisma.service';
import { PurchasesRepository } from '../../../src/modules/payments/purchases.repository';

describe('PurchasesRepository', () => {
  const mockPrisma = {
    purchase: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
  } as unknown as PrismaService;

  let repository: PurchasesRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    repository = new PurchasesRepository(mockPrisma);
  });

  it('create inserts a Purchase record', async () => {
    const purchase = {
      id: 'pur-1',
      userId: 'user-1',
      userPlanId: 'plan-1',
      provider: 'MONTONIO',
      providerRef: 'ref-1',
      amount: 50000,
      currency: 'EUR',
      status: 'PENDING',
      paidAt: null,
      createdAt: new Date(),
    };

    (mockPrisma.purchase.create as jest.Mock).mockResolvedValue(purchase);

    const result: typeof purchase = await repository.create({
      userId: 'user-1',
      userPlanId: 'plan-1',

      provider: 'MONTONIO' as never,
      providerRef: 'ref-1',
      amount: 50000,
      currency: 'EUR',
    });

    const createCall = (mockPrisma.purchase.create as jest.Mock).mock
      .calls[0] as [{ data: Record<string, unknown> }];
    expect(createCall[0]).toEqual({
      data: {
        userId: 'user-1',
        userPlanId: 'plan-1',
        provider: 'MONTONIO',
        providerRef: 'ref-1',
        amount: 50000,
        currency: 'EUR',
      },
    });
    expect(result).toEqual(purchase);
  });

  it('findByProviderRef calls findFirst with providerRef', async () => {
    (mockPrisma.purchase.findFirst as jest.Mock).mockResolvedValue(null);
    await repository.findByProviderRef('ref-1');

    const calls = (mockPrisma.purchase.findFirst as jest.Mock).mock.calls as [
      [{ where: { providerRef: string } }],
    ];
    expect(calls[0][0]).toEqual({
      where: { providerRef: 'ref-1' },
    });
  });

  it('findByUserId calls findMany ordered by createdAt desc', async () => {
    (mockPrisma.purchase.findMany as jest.Mock).mockResolvedValue([]);
    await repository.findByUserId('user-1');

    const calls = (mockPrisma.purchase.findMany as jest.Mock).mock.calls as [
      [{ where: { userId: string }; orderBy: { createdAt: string } }],
    ];
    expect(calls[0][0]).toEqual({
      where: { userId: 'user-1' },
      orderBy: { createdAt: 'desc' },
    });
  });

  it('updateStatus updates status and optionally paidAt', async () => {
    (mockPrisma.purchase.update as jest.Mock).mockResolvedValue({});
    const paidAt = new Date();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    await repository.updateStatus('pur-1', 'PAID' as any, paidAt);

    const calls = (mockPrisma.purchase.update as jest.Mock).mock.calls as [
      [{ where: { id: string }; data: Record<string, unknown> }],
    ];
    expect(calls[0][0]).toEqual({
      where: { id: 'pur-1' },
      data: { status: 'PAID', paidAt },
    });
  });

  it('updateStatus omits paidAt when not provided', async () => {
    (mockPrisma.purchase.update as jest.Mock).mockResolvedValue({});
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    await repository.updateStatus('pur-1', 'FAILED' as any);

    const calls = (mockPrisma.purchase.update as jest.Mock).mock.calls as [
      [{ where: { id: string }; data: Record<string, unknown> }],
    ];
    expect(calls[0][0]).toEqual({
      where: { id: 'pur-1' },
      data: { status: 'FAILED', paidAt: undefined },
    });
  });
});
