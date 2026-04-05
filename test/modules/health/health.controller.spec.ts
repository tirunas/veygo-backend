import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from '../../../src/health/health.controller';
import { PrismaService } from '../../../src/prisma/prisma.service';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';

describe('HealthController', () => {
  let controller: HealthController;
  let cacheManager: jest.Mocked<Cache>;
  let prismaService: jest.Mocked<PrismaService>;

  beforeEach(async () => {
    cacheManager = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      reset: jest.fn(),
    } as unknown as jest.Mocked<Cache>;

    prismaService = {
      executeRaw: jest.fn(),
    } as unknown as jest.Mocked<PrismaService>;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: PrismaService,
          useValue: prismaService,
        },
        {
          provide: CACHE_MANAGER,
          useValue: cacheManager,
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  describe('check()', () => {
    it('should return { status: "ok" }', () => {
      const result = controller.check();
      expect(result).toEqual({ status: 'ok' });
    });
  });

  describe('readiness()', () => {
    it('should return database and redis status as ok when both succeed', async () => {
      prismaService.executeRaw.mockResolvedValue([{ 1: 1 }]);
      cacheManager.set.mockResolvedValue(undefined);

      const result = await controller.readiness();

      expect(result).toEqual({ database: 'ok', redis: 'ok' });
      expect(cacheManager.set).toHaveBeenCalledWith(
        'health:ping',
        'pong',
        expect.any(Number),
      );
    });

    it('should return database error when database ping fails', async () => {
      prismaService.executeRaw.mockRejectedValue(
        new Error('DB connection failed'),
      );
      cacheManager.set.mockResolvedValue(undefined);

      const result = await controller.readiness();

      expect(result.database).toBe('error');
      expect(result.redis).toBe('ok');
    });

    it('should return redis error when cache ping fails', async () => {
      prismaService.executeRaw.mockResolvedValue([{ 1: 1 }]);
      cacheManager.set.mockRejectedValue(new Error('Redis connection failed'));

      const result = await controller.readiness();

      expect(result.database).toBe('ok');
      expect(result.redis).toBe('error');
    });

    it('should return both errors when both database and redis fail', async () => {
      prismaService.executeRaw.mockRejectedValue(
        new Error('DB connection failed'),
      );
      cacheManager.set.mockRejectedValue(new Error('Redis connection failed'));

      const result = await controller.readiness();

      expect(result).toEqual({ database: 'error', redis: 'error' });
    });
  });
});
