import { BaseEntity } from 'src/common/entities/base.entity';
import { CourtStatus } from 'src/common/enums/court-status.enum';
import { CourtType } from 'src/common/enums/court-type.enum';
import { Column, Entity, Index, OneToMany, VersionColumn } from 'typeorm';
import { CourtPricing } from './court-pricing.entity';

@Entity('courts')
export class Court extends BaseEntity {
  @Index({ unique: true })
  @Column()
  name: string;

  @Index()
  @Column({ type: 'enum', enum: CourtType })
  type: CourtType;

  @Column({ type: 'enum', enum: CourtStatus, default: CourtStatus.ACTIVE })
  status: CourtStatus;

  @Column({ type: 'text', nullable: true })
  description: string;

  @OneToMany(() => CourtPricing, (pricing) => pricing.court)
  pricings: CourtPricing[];

  @VersionColumn()
  version: number;
}
