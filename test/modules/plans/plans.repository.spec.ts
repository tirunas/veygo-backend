import { PlansRepository } from '../../../src/modules/plans/plans.repository';

describe('PlansRepository', () => {
  const mockPrisma = {
    userPlan: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  let repository: PlansRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    repository = new PlansRepository(mockPrisma as any);
  });

  it('findByUserId calls findMany with userId ordered by createdAt desc', async () => {
    mockPrisma.userPlan.findMany.mockResolvedValue([]);
    const result = await repository.findByUserId('user-1');
    expect(mockPrisma.userPlan.findMany).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
      orderBy: { createdAt: 'desc' },
    });
    expect(result).toEqual([]);
  });

  it('findByIdAndUserId calls findFirst with both id and userId', async () => {
    const plan = {
      id: 'plan-1',
      userId: 'user-1',
      destinationId: 'paris',
      status: 'DRAFT',
      customData: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockPrisma.userPlan.findFirst.mockResolvedValue(plan);
    const result = await repository.findByIdAndUserId('plan-1', 'user-1');
    expect(mockPrisma.userPlan.findFirst).toHaveBeenCalledWith({
      where: { id: 'plan-1', userId: 'user-1' },
    });
    expect(result).toEqual(plan);
  });

  it('findByIdAndUserId returns null when record is not found', async () => {
    mockPrisma.userPlan.findFirst.mockResolvedValue(null);
    const result = await repository.findByIdAndUserId('plan-1', 'user-1');
    expect(result).toBeNull();
  });

  it('findById calls findFirst with id only', async () => {
    mockPrisma.userPlan.findFirst.mockResolvedValue(null);
    await repository.findById('plan-1');
    expect(mockPrisma.userPlan.findFirst).toHaveBeenCalledWith({
      where: { id: 'plan-1' },
    });
  });

  it('create inserts a UserPlan with userId and destinationId', async () => {
    const plan = {
      id: 'plan-1',
      userId: 'user-1',
      destinationId: 'paris',
      status: 'DRAFT',
      customData: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockPrisma.userPlan.create.mockResolvedValue(plan);
    const result = await repository.create({
      userId: 'user-1',
      destinationId: 'paris',
    });
    expect(mockPrisma.userPlan.create).toHaveBeenCalledWith({
      data: { userId: 'user-1', destinationId: 'paris' },
    });
    expect(result).toEqual(plan);
  });

  it('updateCustomData calls update with customData field', async () => {
    const customData = { notes: 'bring sunscreen', groupSize: 2 };
    mockPrisma.userPlan.update.mockResolvedValue({});
    await repository.updateCustomData('plan-1', customData);
    expect(mockPrisma.userPlan.update).toHaveBeenCalledWith({
      where: { id: 'plan-1' },
      data: { customData },
    });
  });

  it('updateStatus calls update with status field', async () => {
    mockPrisma.userPlan.update.mockResolvedValue({});
    await repository.updateStatus('plan-1', 'PAID');
    expect(mockPrisma.userPlan.update).toHaveBeenCalledWith({
      where: { id: 'plan-1' },
      data: { status: 'PAID' },
    });
  });

  it('deleteById calls delete with plan id', async () => {
    mockPrisma.userPlan.delete.mockResolvedValue({});
    await repository.deleteById('plan-1');
    expect(mockPrisma.userPlan.delete).toHaveBeenCalledWith({
      where: { id: 'plan-1' },
    });
  });
});
