import { BaseEntity } from 'src/common/entities/base.entity';
import { BookingStatus } from 'src/common/enums/booking-status.enum';
import { PaymentStatus } from 'src/common/enums/payment-status.enum';
import { Court } from 'src/modules/court/entities/court.entity';
import { User } from 'src/modules/user/entities/user.entity';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BookingGroup } from './booking-group.entity';

@Entity('bookings')
@Index(['date', 'startTime'])
export class Booking extends BaseEntity {
  @Index()
  @Column({ name: 'court_id' })
  courtId: string;

  @ManyToOne(() => Court)
  @JoinColumn({ name: 'court_id' })
  court: Court;

  @Index()
  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Index()
  @Column({ name: 'group_id', nullable: true })
  groupId: string | null;

  @ManyToOne(() => BookingGroup, (group) => group.bookings, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'group_id' })
  group: BookingGroup;

  @Index()
  @Column({ type: 'date', name: 'booking_date' })
  date: string;

  @Index()
  @Column({ type: 'time', name: 'start_time' })
  startTime: string;

  @Index()
  @Column({ type: 'time', name: 'end_time' })
  endTime: string;

  @Column({ type: 'decimal', precision: 12, scale: 0 })
  price: number;

  @Index()
  @Column({ type: 'enum', enum: BookingStatus, default: BookingStatus.PENDING })
  status: BookingStatus;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  paymentStatus: PaymentStatus;
}
