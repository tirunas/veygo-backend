import { Test } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { PasswordResetService } from '../../../src/modules/auth/password-reset.service';
import { UsersRepository } from '../../../src/modules/users/users.repository';
import { HasherService } from '../../../src/modules/auth/hasher.service';
import { EmailService } from '../../../src/modules/email/email.service';

const mockCache = {
  set: jest.fn(),
  get: jest.fn(),
  del: jest.fn(),
};

const mockUsersRepo = {
  findByEmail: jest.fn(),
  updatePasswordHash: jest.fn(),
};

const mockHasher = {
  hash: jest.fn().mockResolvedValue('hashed'),
};

const mockEmail = {
  sendPasswordReset: jest.fn(),
};

describe('PasswordResetService', () => {
  let service: PasswordResetService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        PasswordResetService,
        { provide: CACHE_MANAGER, useValue: mockCache },
        { provide: UsersRepository, useValue: mockUsersRepo },
        { provide: HasherService, useValue: mockHasher },
        { provide: EmailService, useValue: mockEmail },
      ],
    }).compile();

    service = module.get(PasswordResetService);
  });

  describe('requestReset', () => {
    it('sends password reset email when user exists', async () => {
      mockUsersRepo.findByEmail.mockResolvedValue({ id: 'user-1' });
      mockCache.set.mockResolvedValue(undefined);
      mockEmail.sendPasswordReset.mockResolvedValue(undefined);

      await service.requestReset('user@example.com');

      expect(mockEmail.sendPasswordReset).toHaveBeenCalledWith(
        'user@example.com',
        expect.any(String),
      );
    });

    it('stores reset token in cache with 15-minute TTL', async () => {
      mockUsersRepo.findByEmail.mockResolvedValue({ id: 'user-1' });
      mockCache.set.mockResolvedValue(undefined);
      mockEmail.sendPasswordReset.mockResolvedValue(undefined);

      await service.requestReset('user@example.com');

      expect(mockCache.set).toHaveBeenCalledWith(
        expect.stringMatching(/^pwd-reset:/),
        'user-1',
        15 * 60 * 1000,
      );
    });

    it('does nothing when user does not exist', async () => {
      mockUsersRepo.findByEmail.mockResolvedValue(null);

      await service.requestReset('ghost@example.com');

      expect(mockEmail.sendPasswordReset).not.toHaveBeenCalled();
      expect(mockCache.set).not.toHaveBeenCalled();
    });
  });

  describe('resetPassword', () => {
    it('updates password hash when token is valid', async () => {
      mockCache.get.mockResolvedValue('user-1');
      mockHasher.hash.mockResolvedValue('new-hashed');
      mockUsersRepo.updatePasswordHash.mockResolvedValue(undefined);
      mockCache.del.mockResolvedValue(undefined);

      await service.resetPassword('valid-token', 'newpass');

      expect(mockUsersRepo.updatePasswordHash).toHaveBeenCalledWith(
        'user-1',
        'new-hashed',
      );
    });

    it('deletes token after successful reset', async () => {
      mockCache.get.mockResolvedValue('user-1');
      mockUsersRepo.updatePasswordHash.mockResolvedValue(undefined);
      mockCache.del.mockResolvedValue(undefined);

      await service.resetPassword('valid-token', 'newpass');

      expect(mockCache.del).toHaveBeenCalledWith('pwd-reset:valid-token');
    });

    it('throws BadRequestException for invalid token', async () => {
      mockCache.get.mockResolvedValue(null);

      await expect(service.resetPassword('bad-token', 'pass')).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
