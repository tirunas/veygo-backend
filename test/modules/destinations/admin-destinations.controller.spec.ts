import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { RolesGuard } from '../../../src/common/guards/roles.guard';
import { ROLES_KEY } from '../../../src/common/decorators/roles.decorator';
import { AdminDestinationsController } from '../../../src/modules/destinations/admin-destinations.controller';

describe('AdminDestinationsController — role metadata', () => {
  it('has ADMIN role metadata on the controller class', () => {
    const reflector = new Reflector();
    const roles = reflector.get<Role[]>(ROLES_KEY, AdminDestinationsController);
    expect(roles).toContain(Role.ADMIN);
  });

  it('RolesGuard rejects non-ADMIN user', () => {
    const reflector = new Reflector();
    const guard = new RolesGuard(reflector);

    const mockContext = {
      getHandler: () =>
        AdminDestinationsController.prototype.create.bind(
          AdminDestinationsController.prototype,
        ),
      getClass: () => AdminDestinationsController,
      switchToHttp: () => ({
        getRequest: () => ({ user: { id: 'u1', role: Role.USER } }),
      }),
    } as never;

    expect(() => guard.canActivate(mockContext)).toThrow(ForbiddenException);
  });
});
