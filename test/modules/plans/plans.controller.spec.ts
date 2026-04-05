import { NotFoundException } from '@nestjs/common';
import { PlansController } from '../../../src/modules/plans/plans.controller';
import { UserPlansController } from '../../../src/modules/plans/user-plans.controller';

describe('PlansController', () => {
  const mockPlansService = {
    findBasePlan: jest.fn(),
  };

  let controller: PlansController;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new PlansController(mockPlansService as any);
  });

  it('findBasePlan returns the base plan for a destination', async () => {
    const basePlan = { destinationId: 'paris', destinationName: 'Paris' };
    mockPlansService.findBasePlan.mockResolvedValue(basePlan);
    const result = await controller.findBasePlan('paris');
    expect(result).toEqual(basePlan);
  });

  it('findBasePlan propagates NotFoundException from service', async () => {
    mockPlansService.findBasePlan.mockRejectedValue(new NotFoundException());
    await expect(controller.findBasePlan('unknown')).rejects.toThrow(
      NotFoundException,
    );
  });
});

describe('UserPlansController', () => {
  const mockPlansService = {
    findUserPlans: jest.fn(),
    findUserPlanOrThrow: jest.fn(),
    createUserPlan: jest.fn(),
    updateUserPlan: jest.fn(),
    deleteUserPlan: jest.fn(),
  };

  let controller: UserPlansController;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new UserPlansController(mockPlansService as any);
  });

  it('findAll returns list of user plans', async () => {
    const plans = [{ id: 'plan-1', userId: 'user-1' }];
    mockPlansService.findUserPlans.mockResolvedValue(plans);
    const result = await controller.findAll({ id: 'user-1', role: 'USER' });
    expect(mockPlansService.findUserPlans).toHaveBeenCalledWith('user-1');
    expect(result).toEqual(plans);
  });

  it('create returns the new plan', async () => {
    const plan = { id: 'plan-1', userId: 'user-1', destinationId: 'paris' };
    mockPlansService.createUserPlan.mockResolvedValue(plan);
    const result = await controller.create(
      { id: 'user-1', role: 'USER' },
      { destinationId: 'paris' },
    );
    expect(mockPlansService.createUserPlan).toHaveBeenCalledWith(
      'user-1',
      'paris',
    );
    expect(result).toEqual(plan);
  });

  it('update delegates to service with userId and planId', async () => {
    const updated = { id: 'plan-1', customData: { notes: 'test' } };
    mockPlansService.updateUserPlan.mockResolvedValue(updated);
    const result = await controller.update(
      { id: 'user-1', role: 'USER' },
      'plan-1',
      { customData: { notes: 'test' } },
    );
    expect(mockPlansService.updateUserPlan).toHaveBeenCalledWith(
      'plan-1',
      'user-1',
      { notes: 'test' },
    );
    expect(result).toEqual(updated);
  });

  it('remove calls deleteUserPlan', async () => {
    mockPlansService.deleteUserPlan.mockResolvedValue(undefined);
    await controller.remove({ id: 'user-1', role: 'USER' }, 'plan-1');
    expect(mockPlansService.deleteUserPlan).toHaveBeenCalledWith(
      'plan-1',
      'user-1',
    );
  });
});
