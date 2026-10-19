import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn,
  CreateDateColumn, Index
} from 'typeorm';
import { Project } from '../../projects/entities/project.entity';
import { Stage } from '../../stages/entities/stage.entity';
import { Task } from '../../tasks/entities/task.entity';
import { User } from '../../users/entities/user.entity';
import { TransactionType, TransactionCategory, TransactionStatus } from './transaction.enums';

@Entity('transactions')
@Index(['projectId', 'status'])
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'project_id', type: 'uuid' })
  projectId: string;

  @ManyToOne(() => Project, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @Column({ name: 'stage_id', type: 'uuid', nullable: true })
  stageId: string | null;

  @ManyToOne(() => Stage, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'stage_id' })
  stage: Stage | null;

  @Column({ name: 'task_id', type: 'uuid', nullable: true })
  taskId: string | null;

  @ManyToOne(() => Task, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'task_id' })
  task: Task | null;

  @Column({ type: 'varchar', length: 16 })
  type: TransactionType;

  @Column({ type: 'varchar', length: 32 })
  category: TransactionCategory;

  @Column({ type: 'numeric', precision: 14, scale: 2 })
  amount: string; // Храним как строку для точности

  @Column({ type: 'char', length: 3, default: 'MDL' })
  currency: string;

  @Column({ type: 'varchar', length: 16, default: TransactionStatus.PENDING })
  status: TransactionStatus;

  @Column({ name: 'author_id', type: 'uuid', nullable: true })
  authorId: string | null;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'author_id' })
  author: User;

  @Column({ name: 'approver_id', type: 'uuid', nullable: true })
  approverId: string | null;

  @ManyToOne(() => User, { eager: true, nullable: true })
  @JoinColumn({ name: 'approver_id' })
  approver: User | null;

  @Column({ type: 'text', nullable: true })
  comment: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @Column({ name: 'approved_at', type: 'timestamptz', nullable: true })
  approvedAt: Date | null;
}