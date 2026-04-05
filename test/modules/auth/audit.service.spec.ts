import { AuditService } from '../../../src/modules/auth/audit.service';
import { PrismaService } from '../../../src/prisma/prisma.service';

const mockPrisma = {
  auditLog: { create: jest.fn() },
};

describe('AuditService', () => {
  let service: AuditService;

  beforeEach(() => {
    service = new AuditService(mockPrisma as unknown as PrismaService);
    jest.clearAllMocks();
  });

  it('logEvent calls prisma.auditLog.create with correct fields', async () => {
    mockPrisma.auditLog.create.mockResolvedValue({} as unknown);
    await service.logEvent({
      event: 'login',
      ip: '127.0.0.1',
      userAgent: 'jest',
      userId: 'user-1',
    });

    expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        event: 'login',
        ip: '127.0.0.1',
        userAgent: 'jest',
        userId: 'user-1',
      }) as unknown,
    });
  });

  it('logEvent accepts null userId for anonymous events', async () => {
    mockPrisma.auditLog.create.mockResolvedValue({} as unknown);
    await service.logEvent({
      event: 'login_failed',
      ip: '1.2.3.4',
      userAgent: 'browser',
    });

    expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: undefined,
        event: 'login_failed',
      }) as unknown,
    });
  });
});

describe('AuditService.findPaginated', () => {
  let service: AuditService;
  const mockPrisma = {
    auditLog: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
  };

  beforeEach(() => {
    service = new AuditService(mockPrisma as never);
    jest.clearAllMocks();
  });

  it('returns items and total with correct skip/take', async () => {
    const fakeEntries = [
      {
        id: '1',
        event: 'LOGIN',
        ip: '1.2.3.4',
        userAgent: 'UA',
        userId: null,
        meta: {},
        createdAt: new Date(),
      },
    ];
    mockPrisma.auditLog.findMany.mockResolvedValue(fakeEntries);
    mockPrisma.auditLog.count.mockResolvedValue(42);

    const result = await service.findPaginated(2, 10);

    expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith({
      skip: 10,
      take: 10,
      orderBy: { createdAt: 'desc' },
    });
    expect(result).toEqual({ items: fakeEntries, total: 42 });
  });

  it('clamps limit to MAX_AUDIT_PAGE_SIZE (100)', async () => {
    mockPrisma.auditLog.findMany.mockResolvedValue([]);
    mockPrisma.auditLog.count.mockResolvedValue(0);

    await service.findPaginated(1, 9999);

    expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 100 }),
    );
  });
});
