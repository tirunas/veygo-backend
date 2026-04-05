import { JwtAuthGuard } from '../../src/common/guards/jwt-auth.guard';
import { Reflector } from '@nestjs/core';
import { ExecutionContext } from '@nestjs/common';

const mockReflector = { getAllAndOverride: jest.fn() };

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;

  beforeEach(() => {
    guard = new JwtAuthGuard(mockReflector as unknown as Reflector);
  });

  it('allows public routes without calling super', () => {
    mockReflector.getAllAndOverride.mockReturnValue(true); // isPublic = true
    const mockContext = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
    } as unknown as ExecutionContext;

    const result = guard.canActivate(mockContext);
    expect(result).toBe(true);
  });
});
