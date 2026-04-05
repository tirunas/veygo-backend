import { TokenService } from '../../../src/modules/auth/token.service';
import { PrismaService } from '../../../src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';

const mockPrisma = {
  refreshToken: {
    create: jest.fn(),
    findFirst: jest.fn(),
    updateMany: jest.fn(),
    deleteMany: jest.fn(),
  },
};

const mockJwt = {
  signAsync: jest.fn(),
  verifyAsync: jest.fn(),
};

describe('TokenService', () => {
  let service: TokenService;

  beforeEach(() => {
    service = new TokenService(
      mockPrisma as unknown as PrismaService,
      mockJwt as unknown as JwtService,
    );
    jest.clearAllMocks();
  });

  describe('issueTokenPair', () => {
    it('returns accessToken and refreshToken', async () => {
      mockJwt.signAsync.mockResolvedValue('signed-access-token');

      mockPrisma.refreshToken.create.mockResolvedValue({} as unknown);

      const result = await service.issueTokenPair('user-id', 'USER');

      expect(result).toHaveProperty('accessToken', 'signed-access-token');
      expect(result).toHaveProperty('refreshToken');
      expect(typeof result.refreshToken).toBe('string');
      expect(result.refreshToken).toHaveLength(64); // 32 bytes hex
    });
  });

  describe('rotateRefreshToken', () => {
    it('rotates valid token and returns new pair with userId and role', async () => {
      const storedToken = {
        tokenHash: 'hash',
        family: 'fam-1',
        userId: 'user-1',
        user: { role: 'USER' as const },
      };
      mockPrisma.refreshToken.findFirst.mockResolvedValueOnce(storedToken); // found valid token

      mockPrisma.refreshToken.updateMany.mockResolvedValue({
        count: 1,
      });
      mockJwt.signAsync.mockResolvedValue('new-access-token');

      mockPrisma.refreshToken.create.mockResolvedValue({} as unknown);

      const result = await service.rotateRefreshToken('raw-token');

      expect(result).toHaveProperty('accessToken', 'new-access-token');
      expect(result).toHaveProperty('refreshToken');
      expect(result.userId).toBe('user-1');
      expect(mockPrisma.refreshToken.updateMany).toHaveBeenCalled();
    });

    it('detects token theft: revokes family and throws UnauthorizedException', async () => {
      const usedToken = { family: 'stolen-family' };
      mockPrisma.refreshToken.findFirst
        .mockResolvedValueOnce(null) // valid lookup returns null
        .mockResolvedValueOnce(usedToken); // used token found (was revoked)
      mockPrisma.refreshToken.updateMany.mockResolvedValue({ count: 2 });

      await expect(
        service.rotateRefreshToken('stolen-raw-token'),
      ).rejects.toThrow('Invalid or expired refresh token');
      expect(mockPrisma.refreshToken.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            family: 'stolen-family',
          }) as unknown,
        }),
      );
    });

    it('throws UnauthorizedException for completely unknown token', async () => {
      mockPrisma.refreshToken.findFirst
        .mockResolvedValueOnce(null) // valid lookup: not found
        .mockResolvedValueOnce(null); // used token lookup: not found either

      await expect(service.rotateRefreshToken('unknown-token')).rejects.toThrow(
        'Invalid or expired refresh token',
      );
    });
  });

  describe('revokeTokenFamily', () => {
    it('calls updateMany to revoke all tokens in family', async () => {
      const _updateMany: unknown =
        mockPrisma.refreshToken.updateMany.mockResolvedValue({
          count: 3,
        });
      void _updateMany;
      await service.revokeTokenFamily('family-id');
      expect(mockPrisma.refreshToken.updateMany).toHaveBeenCalledWith({
        where: { family: 'family-id', revokedAt: null },
        data: { revokedAt: expect.any(Date) as unknown },
      });
    });
  });

  describe('revokeAllUserTokens', () => {
    it('calls deleteMany for all user tokens', async () => {
      mockPrisma.refreshToken.deleteMany.mockResolvedValue({ count: 5 });
      await service.revokeAllUserTokens('user-id');
      expect(mockPrisma.refreshToken.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'user-id' },
      });
    });
  });
});
