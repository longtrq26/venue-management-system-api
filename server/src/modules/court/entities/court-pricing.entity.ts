import { BaseEntity } from 'src/common/entities/base.entity';
import { CourtType } from 'src/common/enums/court-type.enum';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { Court } from './court.entity';

@Entity('court_pricings')
export class CourtPricing extends BaseEntity {
  @Index()
  @Column({ type: 'enum', enum: CourtType })
  type: CourtType;

  @Index()
  @Column({ name: 'court_id' })
  courtId: string;

  @ManyToOne(() => Court, (court) => court.pricings, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'court_id' })
  court: Court;

  @Column({ name: 'start_time', type: 'time' })
  startTime: string;

  @Column({ name: 'end_time', type: 'time' })
  endTime: string;

  @Column({ type: 'decimal', precision: 12, scale: 0 })
  price: number;

  @Column({ type: 'int', default: 1 })
  priority: number;
}
