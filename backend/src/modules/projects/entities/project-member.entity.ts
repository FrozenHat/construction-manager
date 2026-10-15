import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Unique,
} from 'typeorm';
import { Project } from './project.entity';
import { User } from '../../users/entities/user.entity';
import { Role } from '../../users/entities/role.entity';

@Entity('project_members')
@Unique(['projectId', 'userId'])
export class ProjectMember {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'project_id', type: 'uuid' })
  projectId: string;

  @ManyToOne(() => Project, (project) => project.members, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'role_code', length: 32 })
  roleCode: string;

  @ManyToOne(() => Role, { eager: true })
  @JoinColumn({ name: 'role_code', referencedColumnName: 'code' })
  role: Role;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'joined_at', type: 'timestamptz' })
  joinedAt: Date;
}