import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import type { Webhook } from '@payos/node';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { Public } from 'src/common/decorators/public.decorator';
import { AccessTokenGuard } from 'src/common/guards/access-token.guard';
import { PaymentService } from './payment.service';

@Controller('payments')
@UseGuards(AccessTokenGuard)
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('create-link')
  async createPaymentLink(
    @CurrentUser('sub') userId: string,
    @Body('bookingGroupId') bookingGroupId: string,
  ) {
    return this.paymentService.createPaymentLink(userId, bookingGroupId);
  }

  @Public()
  @Post('webhook')
  async handleWebhook(@Body() body: Webhook) {
    return this.paymentService.handleWebhook(body);
  }
}
