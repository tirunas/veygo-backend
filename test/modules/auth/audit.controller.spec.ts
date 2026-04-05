import { AuditController } from '../../../src/modules/auth/audit.controller';
import {
  AuditService,
  PaginatedAuditLog,
} from '../../../src/modules/auth/audit.service';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../../../src/common/decorators/roles.decorator';
import { Role } from '@prisma/client';

describe('AuditController', () => {
  let controller: AuditController;
  const mockAuditService = {
    findPaginated: jest.fn(),
  };

  beforeEach(() => {
    controller = new AuditController(
      mockAuditService as unknown as AuditService,
    );
    jest.clearAllMocks();
  });

  describe('getAuditLog', () => {
    it('delegates to auditService.findPaginated with parsed page and limit', async () => {
      const fakeResult: PaginatedAuditLog = { items: [], total: 0 };
      mockAuditService.findPaginated.mockResolvedValue(fakeResult);

      const result = await controller.getAuditLog('2', '20');

      expect(mockAuditService.findPaginated).toHaveBeenCalledWith(2, 20);
      expect(result).toBe(fakeResult);
    });

    it('defaults page to 1 and limit to 20 when query params absent', async () => {
      const fakeResult: PaginatedAuditLog = { items: [], total: 0 };
      mockAuditService.findPaginated.mockResolvedValue(fakeResult);

      await controller.getAuditLog(undefined, undefined);

      expect(mockAuditService.findPaginated).toHaveBeenCalledWith(1, 20);
    });
  });

  describe('role metadata', () => {
    it('has ADMIN role metadata on the controller class', () => {
      const reflector = new Reflector();
      const roles = reflector.get<Role[]>(ROLES_KEY, AuditController);
      expect(roles).toContain(Role.ADMIN);
    });
  });
});
