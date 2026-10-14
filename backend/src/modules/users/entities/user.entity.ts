import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
  JoinTable,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Role } from './role.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'full_name', length: 255 })
  fullName: string;

  @Column({ length: 32, unique: true, nullable: true })
  phone?: string;

  @Column({ length: 255, unique: true, nullable: true })
  email?: string;

  @Column({ name: 'telegram_id', type: 'bigint', unique: true, nullable: true })
  telegramId?: string;

  @Column({ name: 'password_hash', length: 255, nullable: true, select: false })
  passwordHash?: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'is_client', default: false })
  isClient: boolean;

  @Column({ name: 'is_employee', default: false })
  isEmployee: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @ManyToMany(() => Role, { eager: true })
  @JoinTable({
    name: 'user_roles',
    joinColumn: { name: 'user_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'role_code', referencedColumnName: 'code' },
  })
  roles: Role[];
}