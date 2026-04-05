import { UsersController } from '../../../src/modules/users/users.controller';

describe('UsersController', () => {
  const mockUsersService = {
    findByIdOrThrow: jest.fn(),
    toPublicUser: jest.fn(),
  };

  const mockPaymentsService = {
    findUserPurchases: jest.fn(),
  };

  let controller: UsersController;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new UsersController(
      mockUsersService as any,
      mockPaymentsService as any,
    );
  });

  it('getProfile fetches and returns the public user', async () => {
    const userRecord = {
      id: 'user-1',
      email: 'user@example.com',
      passwordHash: 'hash',
      loginAttempts: 0,
      lockedUntil: null,
      role: 'USER',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const publicUser = {
      id: 'user-1',
      email: 'user@example.com',
      role: 'USER',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockUsersService.findByIdOrThrow.mockResolvedValue(userRecord);
    mockUsersService.toPublicUser.mockReturnValue(publicUser);

    const result = await controller.getProfile({ id: 'user-1', role: 'USER' });
    expect(mockUsersService.findByIdOrThrow).toHaveBeenCalledWith('user-1');
    expect(result).toEqual(publicUser);
  });

  it('getPurchases returns purchases from PaymentsService', async () => {
    const purchases = [{ id: 'pur-1', userId: 'user-1' }];
    mockPaymentsService.findUserPurchases.mockResolvedValue(purchases);

    const result = await controller.getPurchases({
      id: 'user-1',
      role: 'USER',
    });
    expect(mockPaymentsService.findUserPurchases).toHaveBeenCalledWith(
      'user-1',
    );
    expect(result).toEqual(purchases);
  });
});
