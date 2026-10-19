import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { Project } from '../../projects/entities/project.entity';
import { Stage } from '../../stages/entities/stage.entity';
import { User } from '../../users/entities/user.entity';
import { TaskStatus, PauseReason } from './task-status.enum';

@Entity('tasks')
@Index(['projectId'])
@Index(['stageId'])
@Index(['status'])
export class Task {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'project_id', type: 'uuid' })
  projectId: string;

  @ManyToOne(() => Project, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @Column({ name: 'stage_id', type: 'uuid' })
  stageId: string;

  @ManyToOne(() => Stage, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'stage_id' })
  stage: Stage;

  @Column({ length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'varchar', length: 32, default: TaskStatus.DRAFT })
  status: TaskStatus;

  // --- Участники ---

  @Column({ name: 'manager_id', type: 'uuid', nullable: true })
  managerId: string | null;

  @ManyToOne(() => User, { eager: true, nullable: true })
  @JoinColumn({ name: 'manager_id' })
  manager: User | null;

  @Column({ name: 'foreman_id', type: 'uuid', nullable: true })
  foremanId: string | null;

  @ManyToOne(() => User, { eager: true, nullable: true })
  @JoinColumn({ name: 'foreman_id' })
  foreman: User | null;

  @Column({ name: 'contractor_id', type: 'uuid', nullable: true })
  contractorId: string | null;

  @ManyToOne(() => User, { eager: true, nullable: true })
  @JoinColumn({ name: 'contractor_id' })
  contractor: User | null;

  // --- Финансы ---

  @Column({
    name: 'foreman_fee',
    type: 'numeric',
    precision: 14,
    scale: 2,
    nullable: true,
  })
  foremanFee: string | null;

  @Column({
    name: 'contractor_fee',
    type: 'numeric',
    precision: 14,
    scale: 2,
    nullable: true,
  })
  contractorFee: string | null;

  @Column({ type: 'char', length: 3, default: 'MDL' })
  currency: string;

  // --- Сроки ---

  @Column({ type: 'date', nullable: true })
  deadline: Date | null;

  @Column({ name: 'started_at', type: 'timestamptz', nullable: true })
  startedAt: Date | null;

  @Column({ name: 'completed_at', type: 'timestamptz', nullable: true })
  completedAt: Date | null;

  // --- Пауза ---

  @Column({
    name: 'pause_reason',
    type: 'varchar',
    length: 32,
    nullable: true,
  })
  pauseReason: PauseReason | null;

  @Column({ name: 'pause_comment', type: 'text', nullable: true })
  pauseComment: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}