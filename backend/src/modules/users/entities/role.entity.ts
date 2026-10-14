import {
  Entity,
  PrimaryColumn,
  Column,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { Permission } from './permission.entity';

@Entity('roles')
export class Role {
  @PrimaryColumn({ length: 32 })
  code: string;

  @Column({ length: 128 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @ManyToMany(() => Permission, { eager: true })
  @JoinTable({
    name: 'role_permissions',
    joinColumn: { name: 'role_code', referencedColumnName: 'code' },
    inverseJoinColumn: { name: 'permission_code', referencedColumnName: 'code' },
  })
  permissions: Permission[];
}