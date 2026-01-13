import { BaseEntity } from 'src/common/entities/base.entity';
import { Column, Entity, OneToMany } from 'typeorm';
import { OperatingHour } from './operating-hour.entity';

@Entity('venue_configurations')
export class VenueConfiguration extends BaseEntity {
  @Column({ default: 'Venue Management System' })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'slot_duration', type: 'int', default: 30 })
  slotDuration: number; // Duration in minutes per booking slot

  @Column({ name: 'booking_window_days', type: 'int', default: 7 })
  bookingWindowDays: number; // Number of days in the future that bookings can be made

  @Column({ default: 'Asia/Hanoi' })
  timezone: string;

  @OneToMany(() => OperatingHour, (hour) => hour.configuration, {
    cascade: true,
  })
  operatingHours: OperatingHour[];
}
