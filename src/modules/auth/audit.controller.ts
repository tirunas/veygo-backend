import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { AuditService, PaginatedAuditLog } from './audit.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;

@Controller('admin')
@Roles(Role.ADMIN)
@UseGuards(RolesGuard)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get('audit-log')
  async getAuditLog(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<PaginatedAuditLog> {
    const parsedPage = page ? parseInt(page, 10) : DEFAULT_PAGE;
    const parsedLimit = limit ? parseInt(limit, 10) : DEFAULT_LIMIT;
    return this.auditService.findPaginated(parsedPage, parsedLimit);
  }
}
