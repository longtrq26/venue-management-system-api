import { Exclude } from 'class-transformer';
import { BaseEntity } from 'src/common/entities/base.entity';
import { Role } from 'src/common/enums/role.enum';
import { Column, Entity, Index } from 'typeorm';

@Entity('users')
export class User extends BaseEntity {
  @Index()
  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({
    name: 'password_hash',
    type: 'varchar',
    length: 255,
    select: false,
  })
  @Exclude()
  passwordHash: string;

  @Column({ name: 'full_name', type: 'varchar', length: 255 })
  fullName: string;

  @Index()
  @Column({ name: 'phone_number', type: 'varchar', length: 20, nullable: true, unique: true })
  phoneNumber: string | null;

  @Index()
  @Column({ type: 'enum', enum: Role, default: Role.CUSTOMER })
  role: Role;

  @Index()
  @Column({ name: 'is_verified', type: 'boolean', default: false })
  isVerified: boolean;

  @Column({
    name: 'verification_token',
    type: 'varchar',
    length: 255,
    nullable: true,
    select: false,
  })
  @Exclude()
  verificationToken: string | null;

  @Column({
    name: 'verification_token_expiry',
    type: 'timestamptz',
    nullable: true,
    select: false,
  })
  @Exclude()
  verificationTokenExpiry: Date | null;

  @Column({
    name: 'refresh_token_hash',
    type: 'varchar',
    nullable: true,
    select: false,
  })
  @Exclude()
  refreshTokenHash: string | null;

  @Column({
    name: 'refresh_token_expiry',
    type: 'timestamptz',
    nullable: true,
    select: false,
  })
  @Exclude()
  refreshTokenExpiry: Date | null;

  @Column({
    name: 'pending_email',
    type: 'varchar',
    nullable: true,
    select: false,
  })
  @Exclude()
  pendingEmail: string | null;

  @Column({
    name: 'email_change_token',
    type: 'varchar',
    length: 255,
    nullable: true,
    select: false,
  })
  @Exclude()
  emailChangeToken: string | null;

  @Column({
    name: 'email_change_token_expiry',
    type: 'timestamptz',
    nullable: true,
    select: false,
  })
  @Exclude()
  emailChangeTokenExpiry: Date | null;

  @Column({
    name: 'password_reset_token',
    type: 'varchar',
    length: 255,
    nullable: true,
    select: false,
  })
  @Exclude()
  passwordResetToken: string | null;

  @Column({
    name: 'password_reset_token_expiry',
    type: 'timestamptz',
    nullable: true,
    select: false,
  })
  @Exclude()
  passwordResetTokenExpiry: Date | null;
}
