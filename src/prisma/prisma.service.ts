import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private client: PrismaClient | null = null;

  private initializeClient(): PrismaClient {
    if (!this.client) {
      const pool = new Pool({ connectionString: process.env.DATABASE_URL });
      const adapter = new PrismaPg(pool);
      this.client = new (PrismaClient as unknown as new (
        options?: unknown,
      ) => PrismaClient)({ adapter });
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

  get experience() {
    return this.initializeClient().experience;
  }

  get itinerary() {
    return this.initializeClient().itinerary;
  }

  get readyPlan() {
    return this.initializeClient().readyPlan;
  }

  get testimonial() {
    return this.initializeClient().testimonial;
  }

  get pipelineJob() {
    return this.initializeClient().pipelineJob;
  }

  get pipelineItem() {
    return this.initializeClient().pipelineItem;
  }

  get photo() {
    return this.initializeClient().photo;
  }

  get style() {
    return this.initializeClient().style;
  }

  get destinationStyle() {
    return this.initializeClient().destinationStyle;
  }

  get $transaction() {
    return this.initializeClient().$transaction.bind(this.initializeClient());
  }
}
