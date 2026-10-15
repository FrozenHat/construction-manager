import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { ProjectMember } from './project-member.entity';

export enum ProjectStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

@Entity('projects')
export class Project {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'text', nullable: true })
  address?: string;

  @Column({
    type: 'varchar',
    length: 32,
    default: ProjectStatus.ACTIVE,
  })
  status: ProjectStatus;

  @Column({ name: 'owner_id', type: 'uuid', nullable: true })
  ownerId?: string;

  @ManyToOne(() => User, { eager: true, nullable: true })
  @JoinColumn({ name: 'owner_id' })
  owner?: User;

  @Column({ name: 'client_id', type: 'uuid', nullable: true })
  clientId?: string;

  @ManyToOne(() => User, { eager: true, nullable: true })
  @JoinColumn({ name: 'client_id' })
  client?: User;

  @Column({ name: 'start_date', type: 'date', nullable: true })
  startDate?: Date;

  @Column({ name: 'planned_end', type: 'date', nullable: true })
  plannedEnd?: Date;

  @Column({ name: 'actual_end', type: 'date', nullable: true })
  actualEnd?: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @OneToMany(() => ProjectMember, (member) => member.project)
  members: ProjectMember[];
}