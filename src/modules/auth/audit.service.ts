import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

const MAX_AUDIT_PAGE_SIZE = 100;

interface AuditEventPayload {
  event: string;
  ip: string;
  userAgent: string;
  userId?: string;
  meta?: Record<string, unknown>;
}

export interface AuditLogEntry {
  id: string;
  event: string;
  ip: string;
  userAgent: string;
  userId: string | null;
  meta: Record<string, unknown>;
  createdAt: Date;
}

export interface PaginatedAuditLog {
  items: AuditLogEntry[];
  total: number;
}

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async logEvent(payload: AuditEventPayload): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        event: payload.event,
        ip: payload.ip,
        userAgent: payload.userAgent,
        userId: payload.userId,

        meta: (payload.meta ?? {}) as Record<string, string>,
      },
    });
  }

  async findPaginated(page: number, limit: number): Promise<PaginatedAuditLog> {
    const safeLimit = Math.min(limit, MAX_AUDIT_PAGE_SIZE);
    const skip = (page - 1) * safeLimit;

    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        skip,
        take: safeLimit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.auditLog.count(),
    ]);

    return {
      items: items.map((item) => ({
        ...item,
        meta: (item.meta as Record<string, unknown>) || {},
      })),
      total,
    };
  }
}
