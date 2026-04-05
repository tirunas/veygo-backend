import { NotFoundException, BadRequestException } from '@nestjs/common';
import { PlanStatus } from '@prisma/client';
import { PlansService } from '../../../src/modules/plans/plans.service';

describe('PlansService', () => {
  const mockPlansRepository = {
    findByUserId: jest.fn(),
    findByIdAndUserId: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    updateCustomData: jest.fn(),
    updateStatus: jest.fn(),
    deleteById: jest.fn(),
  };

  const mockDestinationsService = {
    findByIdOrThrow: jest.fn(),
  };

  const mockCacheManager = {
    get: jest.fn(),
    set: jest.fn(),
  };

  let service: PlansService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new PlansService(
      mockPlansRepository as any,
      mockDestinationsService as any,
      mockCacheManager as any,
    );
  });

  describe('findBasePlan', () => {
    it('returns cached base plan when cache hit', async () => {
      const cached = { destinationId: 'paris', destinationName: 'Paris' };
      mockCacheManager.get.mockResolvedValue(cached);
      const result = await service.findBasePlan('paris');
      expect(result).toEqual(cached);
      expect(mockDestinationsService.findByIdOrThrow).not.toHaveBeenCalled();
    });

    it('fetches from destination service on cache miss and caches result', async () => {
      mockCacheManager.get.mockResolvedValue(null);
      const destination = {
        id: 'paris',
        name: 'Paris',
        country: 'France',
        content: {
          itinerary: [{ day: 1, title: 'Arrive', description: 'Check in' }],
          attractions: [],
          foodSpots: [],
          startingPrice: 500,
          flightHours: 3,
        },
      };
      mockDestinationsService.findByIdOrThrow.mockResolvedValue(destination);
      mockCacheManager.set.mockResolvedValue(undefined);

      const result = await service.findBasePlan('paris');

      expect(result.destinationId).toBe('paris');
      expect(result.destinationName).toBe('Paris');
      expect(result.startingPrice).toBe(500);
      expect(mockCacheManager.set).toHaveBeenCalled();
    });
  });

  describe('findUserPlans', () => {
    it('delegates to repository', async () => {
      mockPlansRepository.findByUserId.mockResolvedValue([]);
      const result = await service.findUserPlans('user-1');
      expect(mockPlansRepository.findByUserId).toHaveBeenCalledWith('user-1');
      expect(result).toEqual([]);
    });
  });

  describe('findUserPlanOrThrow', () => {
    it('returns plan when found', async () => {
      const plan = { id: 'plan-1', userId: 'user-1', status: PlanStatus.DRAFT };
      mockPlansRepository.findByIdAndUserId.mockResolvedValue(plan);
      const result = await service.findUserPlanOrThrow('plan-1', 'user-1');
      expect(result).toEqual(plan);
    });

    it('throws NotFoundException when plan not found', async () => {
      mockPlansRepository.findByIdAndUserId.mockResolvedValue(null);
      await expect(
        service.findUserPlanOrThrow('plan-1', 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('createUserPlan', () => {
    it('creates a plan via repository', async () => {
      const plan = {
        id: 'plan-1',
        userId: 'user-1',
        destinationId: 'paris',
        status: PlanStatus.DRAFT,
      };
      mockPlansRepository.create.mockResolvedValue(plan);
      const result = await service.createUserPlan('user-1', 'paris');
      expect(mockPlansRepository.create).toHaveBeenCalledWith({
        userId: 'user-1',
        destinationId: 'paris',
      });
      expect(result).toEqual(plan);
    });
  });

  describe('updateUserPlan', () => {
    it('updates customData for DRAFT plan', async () => {
      const plan = { id: 'plan-1', userId: 'user-1', status: PlanStatus.DRAFT };
      const updated = { ...plan, customData: { notes: 'test' } };
      mockPlansRepository.findByIdAndUserId.mockResolvedValue(plan);
      mockPlansRepository.updateCustomData.mockResolvedValue(updated);

      const result = await service.updateUserPlan('plan-1', 'user-1', {
        notes: 'test',
      });
      expect(result).toEqual(updated);
    });

    it('throws BadRequestException for non-DRAFT plan', async () => {
      const plan = { id: 'plan-1', userId: 'user-1', status: PlanStatus.PAID };
      mockPlansRepository.findByIdAndUserId.mockResolvedValue(plan);

      await expect(
        service.updateUserPlan('plan-1', 'user-1', { notes: 'test' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('deleteUserPlan', () => {
    it('deletes DRAFT plan', async () => {
      const plan = { id: 'plan-1', userId: 'user-1', status: PlanStatus.DRAFT };
      mockPlansRepository.findByIdAndUserId.mockResolvedValue(plan);
      mockPlansRepository.deleteById.mockResolvedValue(undefined);

      await service.deleteUserPlan('plan-1', 'user-1');
      expect(mockPlansRepository.deleteById).toHaveBeenCalledWith('plan-1');
    });

    it('throws BadRequestException for non-DRAFT plan', async () => {
      const plan = { id: 'plan-1', userId: 'user-1', status: PlanStatus.PAID };
      mockPlansRepository.findByIdAndUserId.mockResolvedValue(plan);

      await expect(service.deleteUserPlan('plan-1', 'user-1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('findPlanByIdOrThrow', () => {
    it('throws NotFoundException when plan not found', async () => {
      mockPlansRepository.findById.mockResolvedValue(null);
      await expect(service.findPlanByIdOrThrow('plan-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('returns plan when found', async () => {
      const plan = { id: 'plan-1' };
      mockPlansRepository.findById.mockResolvedValue(plan);
      const result = await service.findPlanByIdOrThrow('plan-1');
      expect(result).toEqual(plan);
    });
  });

  describe('updatePlanStatus', () => {
    it('delegates to repository', async () => {
      mockPlansRepository.updateStatus.mockResolvedValue(undefined);
      await service.updatePlanStatus('plan-1', PlanStatus.PAID);
      expect(mockPlansRepository.updateStatus).toHaveBeenCalledWith(
        'plan-1',
        PlanStatus.PAID,
      );
    });
  });
});
