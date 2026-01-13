import { BaseEntity } from 'src/common/entities/base.entity';
import { DayOfWeek } from 'src/common/enums/day-of-week.enum';
import { Column, Entity, Index, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { VenueConfiguration } from './venue-configuration.entity';

@Entity('operating_hours')
@Unique(['configurationId', 'day'])
export class OperatingHour extends BaseEntity {
  @Index()
  @Column({ name: 'configuration_id' })
  configurationId: string;

  @ManyToOne(() => VenueConfiguration, (config) => config.operatingHours, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'configuration_id' })
  configuration: VenueConfiguration;

  @Column({
    type: 'enum',
    enum: DayOfWeek,
  })
  day: DayOfWeek;

  @Column({ name: 'open_time', type: 'time', default: '06:00:00' })
  openTime: string;

  @Column({ name: 'close_time', type: 'time', default: '22:00:00' })
  closeTime: string;

  @Column({ name: 'is_closed', default: false })
  isClosed: boolean;
}
