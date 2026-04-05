import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { PlansModule } from '../plans/plans.module';
import { DestinationsModule } from '../destinations/destinations.module';
import { PurchasesRepository } from './purchases.repository';
import { MontonioService } from './montonio.service';
import { StripeService } from './stripe.service';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';

@Module({
  imports: [PrismaModule, PlansModule, DestinationsModule],
  controllers: [PaymentsController],
  providers: [
    PurchasesRepository,
    MontonioService,
    StripeService,
    PaymentsService,
  ],
  exports: [PaymentsService],
})
export class PaymentsModule {}
