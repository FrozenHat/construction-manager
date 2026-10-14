import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('permissions')
export class Permission {
  @PrimaryColumn({ length: 64 })
  code: string;

  @Column({ type: 'text', nullable: true })
  description?: string;
}