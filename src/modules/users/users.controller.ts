import { Controller, Get } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UsersService } from './users.service';
import { PaymentsService } from '../payments/payments.service';
import type { PublicUser } from './users.types';
import type { PurchaseRecord } from '../payments/payments.types';

@Controller('users/me')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly paymentsService: PaymentsService,
  ) {}

  @Get()
  async getProfile(
    @CurrentUser() user: { id: string; role: string },
  ): Promise<PublicUser> {
    const userRecord = await this.usersService.findByIdOrThrow(user.id);
    return this.usersService.toPublicUser(userRecord);
  }

  @Get('purchases')
  async getPurchases(
    @CurrentUser() user: { id: string; role: string },
  ): Promise<PurchaseRecord[]> {
    return this.paymentsService.findUserPurchases(user.id);
  }
}
