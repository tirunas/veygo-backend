import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private client: PrismaClient | null = null;

  private initializeClient(): PrismaClient {
    if (!this.client) {
      this.client = new (PrismaClient as unknown as new (
        options?: unknown,
      ) => PrismaClient)({ adapter: null });
    }
    return this.client;
  }

  async onModuleInit(): Promise<void> {
    await this.initializeClient().$connect();
  }

  async onModuleDestroy(): Promise<void> {
    if (this.client) {
      await this.client.$disconnect();
    }
  }

  get user() {
    return this.initializeClient().user;
  }

  get refreshToken() {
    return this.initializeClient().refreshToken;
  }

  get userPlan() {
    return this.initializeClient().userPlan;
  }

  get purchase() {
    return this.initializeClient().purchase;
  }

  get auditLog() {
    return this.initializeClient().auditLog;
  }

  get destination() {
    return this.initializeClient().destination;
  }

  get attraction() {
    return this.initializeClient().attraction;
  }

  get restaurant() {
    return this.initializeClient().restaurant;
  }

  get hotel() {
    return this.initializeClient().hotel;
  }

  get destinationAttraction() {
    return this.initializeClient().destinationAttraction;
  }

  get destinationRestaurant() {
    return this.initializeClient().destinationRestaurant;
  }

  get destinationHotel() {
    return this.initializeClient().destinationHotel;
  }

  async executeRaw(query: TemplateStringsArray): Promise<unknown> {
    const client = this.initializeClient();

    return client.$queryRaw(query);
  }
}
