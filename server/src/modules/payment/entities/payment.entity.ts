import { BaseEntity } from 'src/common/entities/base.entity';
import { PaymentStatus } from 'src/common/enums/payment-status.enum';
import { BookingGroup } from 'src/modules/booking/entities/booking-group.entity';
import { User } from 'src/modules/user/entities/user.entity';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';

@Entity('payments')
export class Payment extends BaseEntity {
  @Index({ unique: true })
  @Column({ type: 'bigint', name: 'order_code' })
  orderCode: number;

  @Column({ type: 'decimal', precision: 12, scale: 0 })
  amount: number;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  status: PaymentStatus;

  @Index()
  @Column({ name: 'booking_group_id', nullable: true })
  bookingGroupId: string;

  @ManyToOne(() => BookingGroup)
  @JoinColumn({ name: 'booking_group_id' })
  bookingGroup: BookingGroup;

  @Index()
  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'checkout_url', type: 'text', nullable: true })
  checkoutUrl: string;

  @Column({ name: 'payment_link_id', type: 'text', nullable: true })
  paymentLinkId: string;

  @Column({ name: 'reference_id', type: 'text', nullable: true })
  referenceId: string;

  @Column({ name: 'paid_at', type: 'timestamp', nullable: true })
  paidAt: Date;
}
