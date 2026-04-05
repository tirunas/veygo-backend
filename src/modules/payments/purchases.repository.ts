import { Injectable } from '@nestjs/common';
import { PaymentStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { PurchaseRecord, CreatePurchaseInput } from './payments.types';

@Injectable()
export class PurchasesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreatePurchaseInput): Promise<PurchaseRecord> {
    const record = await this.prisma.purchase.create({
      data: {
        userId: input.userId,
        userPlanId: input.userPlanId,
        provider: input.provider,
        providerRef: input.providerRef,
        amount: input.amount,
        currency: input.currency,
      },
    });
    return record as PurchaseRecord;
  }

  async findByProviderRef(providerRef: string): Promise<PurchaseRecord | null> {
    const record = await this.prisma.purchase.findFirst({
      where: { providerRef },
    });
    return record ? (record as PurchaseRecord) : null;
  }

  async findByUserId(userId: string): Promise<PurchaseRecord[]> {
    const records = await this.prisma.purchase.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return records as PurchaseRecord[];
  }

  async updateStatus(
    id: string,
    status: PaymentStatus,
    paidAt?: Date,
  ): Promise<void> {
    await this.prisma.purchase.update({
      where: { id },
      data: { status, paidAt },
    });
  }
}
