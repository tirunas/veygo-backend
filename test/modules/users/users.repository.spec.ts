import { UsersRepository } from '../../../src/modules/users/users.repository';
import { PrismaService } from '../../../src/prisma/prisma.service';

const mockPrisma = {
  user: {
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
};

describe('UsersRepository', () => {
  let repo: UsersRepository;

  beforeEach(() => {
    repo = new UsersRepository(mockPrisma as unknown as PrismaService);
    jest.clearAllMocks();
  });

  it('createUser calls prisma.user.create with correct data', async () => {
    const payload = {
      email: 'a@b.com',
      passwordHash: 'hash',
      role: 'USER' as const,
    };
    mockPrisma.user.create.mockResolvedValue({ id: 'uuid', ...payload });

    const result = await repo.createUser(payload);

    expect(mockPrisma.user.create).toHaveBeenCalledWith({ data: payload });
    expect(result).toHaveProperty('id', 'uuid');
  });

  it('findByEmail returns null when user not found', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);
    const result = await repo.findByEmail('notfound@example.com');
    expect(result).toBeNull();
  });

  it('incrementLoginAttempts calls update with incremented count', async () => {
    mockPrisma.user.update.mockResolvedValue({});
    await repo.incrementLoginAttempts('user-id');
    expect(mockPrisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-id' },
      data: { loginAttempts: { increment: 1 } },
    });
  });
});
