import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from './entities/project.entity';
import { ProjectMember } from './entities/project-member.entity';
import { User } from '../users/entities/user.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { AddMemberDto } from './dto/add-member.dto';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private readonly projectsRepo: Repository<Project>,
    @InjectRepository(ProjectMember)
    private readonly membersRepo: Repository<ProjectMember>,
  ) {}

  async create(dto: CreateProjectDto): Promise<Project> {
    const project = this.projectsRepo.create(dto);
    return this.projectsRepo.save(project);
  }

  /**
   * Возвращает все проекты, к которым у пользователя есть доступ.
   * Шеф и админ видят все; остальные — только те, где они в project_members.
   */
  async findAllForUser(user: User): Promise<Project[]> {
    if (this.hasGlobalAccess(user)) {
      return this.projectsRepo.find({ order: { createdAt: 'DESC' } });
    }

    const memberships = await this.membersRepo.find({
        where: { userId: user.id, isActive: true },
        select: { projectId: true },   // ✅ так правильно
    });

    const projectIds = memberships.map((m) => m.projectId);
    if (projectIds.length === 0) return [];

    return this.projectsRepo
      .createQueryBuilder('project')
      .where('project.id IN (:...ids)', { ids: projectIds })
      .orderBy('project.created_at', 'DESC')
      .getMany();
  }

  async findOne(id: string, user: User): Promise<Project> {
    const project = await this.projectsRepo.findOne({ where: { id } });
    if (!project) throw new NotFoundException(`Проект ${id} не найден`);

    await this.assertAccess(project.id, user);
    return project;
  }

  async update(
    id: string,
    dto: UpdateProjectDto,
    user: User,
  ): Promise<Project> {
    const project = await this.findOne(id, user);
    Object.assign(project, dto);
    return this.projectsRepo.save(project);
  }

  async remove(id: string, user: User): Promise<void> {
    const project = await this.findOne(id, user);
    await this.projectsRepo.remove(project);
  }

  // --- Участники проекта ---

  async addMember(
    projectId: string,
    dto: AddMemberDto,
    user: User,
  ): Promise<ProjectMember> {
    await this.findOne(projectId, user); // проверка доступа

    const existing = await this.membersRepo.findOne({
      where: { projectId, userId: dto.userId },
    });
    if (existing) {
      throw new ConflictException('Пользователь уже участник проекта');
    }

    const member = this.membersRepo.create({
      projectId,
      userId: dto.userId,
      roleCode: dto.roleCode,
      isActive: dto.isActive ?? true,
    });
    return this.membersRepo.save(member);
  }

  async listMembers(projectId: string, user: User): Promise<ProjectMember[]> {
    await this.findOne(projectId, user);
    return this.membersRepo.find({ where: { projectId } });
  }

  async removeMember(
    projectId: string,
    memberId: string,
    user: User,
  ): Promise<void> {
    await this.findOne(projectId, user);
    const member = await this.membersRepo.findOne({
      where: { id: memberId, projectId },
    });
    if (!member) throw new NotFoundException('Участник не найден');
    await this.membersRepo.remove(member);
  }

  // --- Вспомогательные ---

  /**
   * Шеф и админ — глобальный доступ ко всем проектам.
   */
  private hasGlobalAccess(user: User): boolean {
    const roles = user.roles?.map((r) => r.code) ?? [];
    return roles.includes('chief') || roles.includes('admin');
  }

  /**
   * Проверка, что у пользователя есть доступ к проекту:
   * либо глобальный, либо он в project_members.
   */
  async assertAccess(projectId: string, user: User): Promise<void> {
    if (this.hasGlobalAccess(user)) return;

    const membership = await this.membersRepo.findOne({
      where: { projectId, userId: user.id, isActive: true },
    });

    if (!membership) {
      throw new ForbiddenException('Нет доступа к этому проекту');
    }
  }
}