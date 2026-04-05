import { Injectable } from '@nestjs/common';
import { PlanStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  UserPlanRecord,
  CreateUserPlanInput,
  PlanCustomData,
} from './plans.types';

@Injectable()
export class PlansRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByUserId(userId: string): Promise<UserPlanRecord[]> {
    const records = await this.prisma.userPlan.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return records as unknown as UserPlanRecord[];
  }

  async findByIdAndUserId(
    id: string,
    userId: string,
  ): Promise<UserPlanRecord | null> {
    const record = await this.prisma.userPlan.findFirst({
      where: { id, userId },
    });
    return record ? (record as unknown as UserPlanRecord) : null;
  }

  async findById(id: string): Promise<UserPlanRecord | null> {
    const record = await this.prisma.userPlan.findFirst({ where: { id } });
    return record ? (record as unknown as UserPlanRecord) : null;
  }

  async create(input: CreateUserPlanInput): Promise<UserPlanRecord> {
    const record = await this.prisma.userPlan.create({
      data: { userId: input.userId, destinationId: input.destinationId },
    });
    return record as unknown as UserPlanRecord;
  }

  async updateCustomData(
    id: string,
    customData: PlanCustomData,
  ): Promise<UserPlanRecord> {
    const record = await this.prisma.userPlan.update({
      where: { id },
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      data: { customData: customData as any },
    });
    return record as unknown as UserPlanRecord;
  }

  async updateStatus(id: string, status: PlanStatus): Promise<void> {
    await this.prisma.userPlan.update({
      where: { id },
      data: { status },
    });
  }

  async deleteById(id: string): Promise<void> {
    await this.prisma.userPlan.delete({ where: { id } });
  }
}
