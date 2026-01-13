import { BaseEntity } from 'src/common/entities/base.entity';
import { User } from 'src/modules/user/entities/user.entity';
import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { Booking } from './booking.entity';

@Entity('booking_groups')
export class BookingGroup extends BaseEntity {
  @Index()
  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'decimal', precision: 12, scale: 0, default: 0 })
  totalAmount: number;

  @Column({ name: 'is_recurring', default: false })
  isRecurring: boolean;

  @Column({ type: 'text', nullable: true })
  note: string;

  @OneToMany(() => Booking, (booking) => booking.group, { cascade: true })
  bookings: Booking[];
}
