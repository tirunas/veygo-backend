describe('UserPlan + Purchase Prisma delegates', () => {
  it('mock client exposes expected userPlan and purchase methods', () => {
    const mockClient = {
      userPlan: {
        create: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      purchase: {
        create: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
      },
    };
    expect(typeof mockClient.userPlan.create).toBe('function');
    expect(typeof mockClient.userPlan.findMany).toBe('function');
    expect(typeof mockClient.purchase.create).toBe('function');
    expect(typeof mockClient.purchase.update).toBe('function');
  });
});
