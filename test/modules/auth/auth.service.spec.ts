import { AuthService } from '../../../src/modules/auth/auth.service';
import { UsersService } from '../../../src/modules/users/users.service';
import { UsersRepository } from '../../../src/modules/users/users.repository';
import { HasherService } from '../../../src/modules/auth/hasher.service';
import { TokenService } from '../../../src/modules/auth/token.service';
import { AuditService } from '../../../src/modules/auth/audit.service';
import { UnauthorizedException, ConflictException } from '@nestjs/common';

const mockUser = {
  id: 'user-1',
  email: 'test@veygo.lt',
  passwordHash: 'hashed',
  role: 'USER' as const,
  loginAttempts: 0,
  lockedUntil: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockUsersService = {
  findByEmailOrNull: jest.fn(),
  assertEmailIsAvailable: jest.fn(),
  findByIdOrThrow: jest.fn(),
  toPublicUser: jest.fn(),
};

const mockUsersRepo = {
  createUser: jest.fn(),
  resetLoginAttempts: jest.fn(),
  incrementLoginAttempts: jest.fn(),
  lockAccount: jest.fn(),
};

const mockHasher = { hash: jest.fn(), verify: jest.fn() };
const mockTokenService = {
  issueTokenPair: jest.fn(),
  revokeAllUserTokens: jest.fn(),
  revokeTokenByHash: jest.fn(),
  hashToken: jest.fn(),
};
const mockAudit = { logEvent: jest.fn() };

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    service = new AuthService(
      mockUsersService as unknown as UsersService,
      mockUsersRepo as unknown as UsersRepository,
      mockHasher as unknown as HasherService,
      mockTokenService as unknown as TokenService,
      mockAudit as unknown as AuditService,
    );
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('creates user and returns token pair', async () => {
      mockUsersService.assertEmailIsAvailable.mockResolvedValue(undefined);
      mockHasher.hash.mockResolvedValue('hashed-password');
      mockUsersRepo.createUser.mockResolvedValue(mockUser);
      mockTokenService.issueTokenPair.mockResolvedValue({
        accessToken: 'at',
        refreshToken: 'rt',
      });
      mockUsersService.toPublicUser.mockReturnValue({
        id: 'user-1',
        email: 'test@veygo.lt',
      });

      const result = await service.register({
        email: 'test@veygo.lt',
        password: 'secret123',
        ip: '127.0.0.1',
        userAgent: 'jest',
      });

      expect(result).toHaveProperty('accessToken', 'at');
      expect(result).toHaveProperty('refreshToken', 'rt');
      expect(mockUsersService.assertEmailIsAvailable).toHaveBeenCalledWith(
        'test@veygo.lt',
      );
      expect(mockHasher.hash).toHaveBeenCalledWith('secret123');
    });

    it('throws ConflictException when email is taken', async () => {
      mockUsersService.assertEmailIsAvailable.mockRejectedValue(
        new ConflictException(),
      );
      await expect(
        service.register({
          email: 'taken@veygo.lt',
          password: 'secret123',
          ip: '127.0.0.1',
          userAgent: 'jest',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    it('returns token pair on valid credentials', async () => {
      mockUsersService.findByEmailOrNull.mockResolvedValue(mockUser);
      mockHasher.verify.mockResolvedValue(true);
      mockUsersRepo.resetLoginAttempts.mockResolvedValue(undefined);
      mockTokenService.issueTokenPair.mockResolvedValue({
        accessToken: 'at',
        refreshToken: 'rt',
      });
      mockUsersService.toPublicUser.mockReturnValue({ id: 'user-1' });

      const result = await service.login({
        email: 'test@veygo.lt',
        password: 'secret123',
        ip: '127.0.0.1',
        userAgent: 'jest',
      });
      expect(result).toHaveProperty('accessToken', 'at');
    });

    it('throws UnauthorizedException on wrong password', async () => {
      mockUsersService.findByEmailOrNull.mockResolvedValue(mockUser);
      mockHasher.verify.mockResolvedValue(false);
      mockUsersRepo.incrementLoginAttempts.mockResolvedValue(undefined);

      await expect(
        service.login({
          email: 'test@veygo.lt',
          password: 'wrong',
          ip: '127.0.0.1',
          userAgent: 'jest',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException when user not found', async () => {
      mockUsersService.findByEmailOrNull.mockResolvedValue(null);
      await expect(
        service.login({
          email: 'nope@veygo.lt',
          password: 'secret',
          ip: '127.0.0.1',
          userAgent: 'jest',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('locks account after MAX_LOGIN_ATTEMPTS failed attempts', async () => {
      const userAt4Attempts = { ...mockUser, loginAttempts: 4 };
      mockUsersService.findByEmailOrNull.mockResolvedValue(userAt4Attempts);
      mockHasher.verify.mockResolvedValue(false);
      mockUsersRepo.incrementLoginAttempts.mockResolvedValue(undefined);
      mockUsersRepo.lockAccount.mockResolvedValue(undefined);
      mockAudit.logEvent.mockResolvedValue(undefined);

      await expect(
        service.login({
          email: 'test@veygo.lt',
          password: 'wrong',
          ip: '127.0.0.1',
          userAgent: 'jest',
        }),
      ).rejects.toThrow(UnauthorizedException);

      expect(mockUsersRepo.lockAccount).toHaveBeenCalledWith(
        'user-1',
        expect.any(Date),
      );
      expect(mockAudit.logEvent).toHaveBeenCalledWith(
        expect.objectContaining({ event: 'account_locked', userId: 'user-1' }),
      );
    });

    it('throws UnauthorizedException without password check when account is locked', async () => {
      const lockedUser = {
        ...mockUser,
        lockedUntil: new Date(Date.now() + 60_000),
      };
      mockUsersService.findByEmailOrNull.mockResolvedValue(lockedUser);

      await expect(
        service.login({
          email: 'test@veygo.lt',
          password: 'any',
          ip: '127.0.0.1',
          userAgent: 'jest',
        }),
      ).rejects.toThrow('Account temporarily locked');

      expect(mockHasher.verify).not.toHaveBeenCalled();
    });
  });
});
