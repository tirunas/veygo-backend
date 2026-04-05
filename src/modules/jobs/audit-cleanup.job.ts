import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';

const AUDIT_RETENTION_DAYS = 90;
const DAILY_CLEANUP_CRON = '0 3 * * *';

@Injectable()
export class AuditCleanupJob {
  private readonly logger = new Logger(AuditCleanupJob.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron(DAILY_CLEANUP_CRON)
  async cleanupAuditLogs(): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - AUDIT_RETENTION_DAYS);

    const result = await this.prisma.auditLog.deleteMany({
      where: {
        createdAt: { lt: cutoffDate },
      },
    });

    this.logger.log(
      `Deleted ${result.count} audit log entries older than ${AUDIT_RETENTION_DAYS} days`,
    );
  }
}
