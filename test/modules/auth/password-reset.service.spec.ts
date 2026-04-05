import { BadRequestException } from '@nestjs/common';
import { Cache } from '@nestjs/cache-manager';
import { PasswordResetService } from '../../../src/modules/auth/password-reset.service';
import { UsersRepository } from '../../../src/modules/users/users.repository';
import { HasherService } from '../../../src/modules/auth/hasher.service';

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

const mockCacheManager = {
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
};

const mockUsersRepo = {
  findByEmail: jest.fn(),
  updatePasswordHash: jest.fn(),
};

const mockHasher = {
  hash: jest.fn(),
};

describe('PasswordResetService', () => {
  let service: PasswordResetService;

  beforeEach(() => {
    service = new PasswordResetService(
      mockCacheManager as unknown as Cache,
      mockUsersRepo as unknown as UsersRepository,
      mockHasher as unknown as HasherService,
    );
    jest.clearAllMocks();
  });

  describe('requestReset', () => {
    it('should store token in Redis with user ID when email exists', async () => {
      mockUsersRepo.findByEmail.mockResolvedValue(mockUser);
      mockCacheManager.set.mockResolvedValue(undefined);

      await service.requestReset('test@veygo.lt');

      expect(mockUsersRepo.findByEmail).toHaveBeenCalledWith('test@veygo.lt');
      expect(mockCacheManager.set).toHaveBeenCalledWith(
        expect.stringContaining('pwd-reset:'),
        'user-1',
        15 * 60 * 1000,
      );
    });

    it('should return silently when email does not exist', async () => {
      mockUsersRepo.findByEmail.mockResolvedValue(null);

      await service.requestReset('nonexistent@veygo.lt');

      expect(mockCacheManager.set).not.toHaveBeenCalled();
    });

    it('should log the reset token for email testing (no email service)', async () => {
      const logSpy = jest.spyOn(service['logger'], 'log');
      mockUsersRepo.findByEmail.mockResolvedValue(mockUser);
      mockCacheManager.set.mockResolvedValue(undefined);

      await service.requestReset('test@veygo.lt');

      expect(logSpy).toHaveBeenCalledWith(
        expect.stringMatching(
          /Password reset token for test@veygo\.lt: [a-f0-9-]{36}/,
        ),
      );
    });
  });

  describe('resetPassword', () => {
    it('should reset password when token is valid', async () => {
      const token = 'valid-token-uuid';
      mockCacheManager.get.mockResolvedValue('user-1');
      mockHasher.hash.mockResolvedValue('new-hashed-password');
      mockUsersRepo.updatePasswordHash.mockResolvedValue(undefined);
      mockCacheManager.del.mockResolvedValue(undefined);

      await service.resetPassword(token, 'newPassword123');

      expect(mockCacheManager.get).toHaveBeenCalledWith(
        expect.stringContaining(token),
      );
      expect(mockHasher.hash).toHaveBeenCalledWith('newPassword123');
      expect(mockUsersRepo.updatePasswordHash).toHaveBeenCalledWith(
        'user-1',
        'new-hashed-password',
      );
      expect(mockCacheManager.del).toHaveBeenCalledWith(
        expect.stringContaining(token),
      );
    });

    it('should throw BadRequestException when token is invalid', async () => {
      mockCacheManager.get.mockResolvedValue(null);

      await expect(
        service.resetPassword('invalid-token', 'newPassword123'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when token is expired', async () => {
      mockCacheManager.get.mockResolvedValue(null);

      await expect(
        service.resetPassword('expired-token', 'newPassword123'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should delete token from cache after password reset', async () => {
      const token = 'valid-token-uuid';
      mockCacheManager.get.mockResolvedValue('user-1');
      mockHasher.hash.mockResolvedValue('new-hashed-password');
      mockUsersRepo.updatePasswordHash.mockResolvedValue(undefined);
      mockCacheManager.del.mockResolvedValue(undefined);

      await service.resetPassword(token, 'newPassword123');

      expect(mockCacheManager.del).toHaveBeenCalledWith(`pwd-reset:${token}`);
    });
  });
});
