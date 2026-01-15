import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { PayOS, Webhook } from '@payos/node';
import { BookingStatus } from 'src/common/enums/booking-status.enum';
import { PaymentStatus } from 'src/common/enums/payment-status.enum';
import { LoggerService } from 'src/providers/logger/logger.service';
import { Repository } from 'typeorm';
import { BookingGroupService } from '../booking/services/booking-group.service';
import { BookingService } from '../booking/services/booking.service';
import { Payment } from './entities/payment.entity';

@Injectable()
export class PaymentService {
  private readonly payOS: PayOS;
  private readonly CONTEXT = PaymentService.name;

  constructor(
    private readonly logger: LoggerService,
    private readonly config: ConfigService,
    private readonly bookingGroupService: BookingGroupService,
    private readonly bookingService: BookingService,

    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
  ) {
    try {
      const clientId = this.config.getOrThrow<string>('payment.clientId');
      const apiKey = this.config.getOrThrow<string>('payment.apiKey');
      const checksumKey = this.config.getOrThrow<string>('payment.checksumKey');

      this.payOS = new PayOS({
        clientId,
        apiKey,
        checksumKey,
      });

      this.logger.log('PaymentService initialized with PayOS client', this.CONTEXT);
    } catch (error) {
      this.logger.error(
        `Failed to initialize PayOS client: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
        this.CONTEXT,
      );
      throw error;
    }
  }

  async createPaymentLink(userId: string, bookingGroupId: string) {
    try {
      this.logger.debug(
        `Creating payment link for BookingGroup: ${bookingGroupId}, User: ${userId}`,
        this.CONTEXT,
      );

      const bookingGroup = await this.bookingGroupService.getBookingGroupById(bookingGroupId);

      if (!bookingGroup) {
        this.logger.warn(`Booking group not found: ${bookingGroupId}`, this.CONTEXT);
        throw new NotFoundException('Booking group does not exist');
      }

      if (bookingGroup.userId !== userId) {
        this.logger.warn(
          `Unauthorized payment attempt - User: ${userId}, Group: ${bookingGroupId} (Owner: ${bookingGroup.userId})`,
          this.CONTEXT,
        );
        throw new BadRequestException('You do not have permission to pay for this booking');
      }

      const existingPayment = await this.paymentRepository.findOne({
        where: { bookingGroupId, status: PaymentStatus.PAID },
      });

      if (existingPayment) {
        this.logger.warn(
          `Booking already paid - Group: ${bookingGroupId}, Payment: ${existingPayment.orderCode}`,
          this.CONTEXT,
        );
        throw new BadRequestException('This booking has already been paid');
      }

      const orderCode = Number(Date.now().toString().slice(-6) + Math.floor(Math.random() * 1000));
      const amount = Number(bookingGroup.totalAmount);

      if (amount <= 0) {
        this.logger.warn(
          `Invalid payment amount: ${amount} for group ${bookingGroupId}`,
          this.CONTEXT,
        );
        throw new BadRequestException('Invalid payment amount');
      }

      const description = `Pay ${bookingGroupId.slice(0, 8)}`;
      const returnUrl = `${this.config.getOrThrow<string>('client.url')}/payment/success`;
      const cancelUrl = `${this.config.getOrThrow<string>('client.url')}/payment/cancel`;

      const paymentData = {
        orderCode,
        amount,
        description,
        cancelUrl,
        returnUrl,
      };

      this.logger.debug(
        `Sending payment request to PayOS - OrderCode: ${orderCode}, Amount: ${amount}`,
        this.CONTEXT,
      );
      const paymentLink = await this.payOS.paymentRequests.create(paymentData);

      const payment = this.paymentRepository.create({
        orderCode,
        amount,
        description,
        userId,
        bookingGroupId,
        checkoutUrl: paymentLink.checkoutUrl,
        paymentLinkId: paymentLink.paymentLinkId,
        status: PaymentStatus.PENDING,
      });

      await this.paymentRepository.save(payment);

      this.logger.log(
        `Payment link created successfully - OrderCode: ${orderCode}, Group: ${bookingGroupId}, Amount: ${amount}`,
        this.CONTEXT,
      );

      return {
        checkoutUrl: paymentLink.checkoutUrl,
        orderCode: payment.orderCode,
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }

      this.logger.error(
        `Failed to create payment link for group ${bookingGroupId}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
        error instanceof Error ? error.stack : undefined,
        this.CONTEXT,
      );
      throw new InternalServerErrorException('Unable to initialize payment');
    }
  }

  async handleWebhook(body: Webhook) {
    try {
      this.logger.debug(
        `Received webhook from PayOS - Code: ${body.code}, Success: ${body.success}`,
        this.CONTEXT,
      );

      const webhookData = await this.payOS.webhooks.verify(body);

      // test only
      // const webhookData = body.data;

      if (!webhookData) {
        this.logger.error('Invalid PayOS webhook signature', undefined, this.CONTEXT);
        throw new BadRequestException('Invalid signature');
      }

      const { orderCode, amount } = webhookData;

      this.logger.log(
        `Webhook verified - OrderCode: ${orderCode}, Amount: ${amount}, Status: ${body.success}`,
        this.CONTEXT,
      );

      // Find corresponding payment in database
      const payment = await this.paymentRepository.findOne({
        where: { orderCode },
      });

      if (!payment) {
        this.logger.error(`Payment not found for orderCode: ${orderCode}`, undefined, this.CONTEXT);
        return { success: false };
      }

      // Process successful payment
      if (body.code === '00' && body.success) {
        this.logger.debug(`Processing successful payment - OrderCode: ${orderCode}`, this.CONTEXT);

        // Update payment status
        const oldStatus = payment.status;
        payment.status = PaymentStatus.PAID;
        payment.referenceId = webhookData.reference;
        payment.paidAt = new Date();
        await this.paymentRepository.save(payment);

        try {
          // Update booking group and bookings status
          if (payment.bookingGroupId) {
            await this.bookingService.updateGroupPaymentStatus(
              payment.bookingGroupId,
              PaymentStatus.PAID,
              BookingStatus.CONFIRMED,
            );
          }
        } catch (bookingError) {
          this.logger.error(
            `CRITICAL: Payment marked as PAID but failed to update BookingGroup status. OrderCode: ${orderCode}, Group: ${payment.bookingGroupId}`,
            bookingError instanceof Error ? bookingError.stack : undefined,
            this.CONTEXT,
          );
          // Potentially revert payment status? Or alert admin?
          // For now, logging critical error is better than crashing webhook response.
        }

        this.logger.log(
          `Payment completed successfully - OrderCode: ${orderCode}, Group: ${payment.bookingGroupId}, Status: ${oldStatus} -> ${PaymentStatus.PAID}`,
          this.CONTEXT,
        );
      } else {
        this.logger.warn(
          `Webhook received with failure - OrderCode: ${orderCode}, Code: ${body.code}, Success: ${body.success}`,
          this.CONTEXT,
        );
      }

      return { success: true };
    } catch (error) {
      this.logger.error(
        `Error handling PayOS webhook: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
        this.CONTEXT,
      );
      throw error;
    }
  }
}
