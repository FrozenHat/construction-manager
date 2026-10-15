import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Stage } from './entities/stage.entity';
import { StageStatus } from './entities/stage-status.enum';
import { StageStatusHistory } from './entities/stage-status-history.entity';
import { ProjectsService } from '../projects/projects.service';
import { User } from '../users/entities/user.entity';
import { CreateStageDto } from './dto/create-stage.dto';
import { UpdateStageDto } from './dto/update-stage.dto';
import { ChangeStatusDto } from './dto/change-status.dto';

/**
 * Разрешённые переходы статусов этапа.
 * Ключ — текущий статус, значение — массив допустимых следующих.
 */
const ALLOWED_TRANSITIONS: Record<StageStatus, StageStatus[]> = {
  [StageStatus.DRAFT]: [StageStatus.PENDING_APPROVAL, StageStatus.CANCELLED],
  [StageStatus.PENDING_APPROVAL]: [
    StageStatus.IN_PROGRESS,
    StageStatus.DRAFT,
    StageStatus.CANCELLED,
  ],
  [StageStatus.IN_PROGRESS]: [
    StageStatus.ON_REVIEW,
    StageStatus.PAUSED,
    StageStatus.CANCELLED,
  ],
  [StageStatus.ON_REVIEW]: [
    StageStatus.ACCEPTED,
    StageStatus.REJECTED,
  ],
  [StageStatus.ACCEPTED]: [
    StageStatus.COMPLETED,
    StageStatus.REJECTED,
  ],
  [StageStatus.REJECTED]: [
    StageStatus.IN_PROGRESS,
    StageStatus.CANCELLED,
  ],
  [StageStatus.PAUSED]: [
    StageStatus.IN_PROGRESS,
    StageStatus.CANCELLED,
  ],
  [StageStatus.COMPLETED]: [],
  [StageStatus.CANCELLED]: [],
};

@Injectable()
export class StagesService {
  constructor(
    @InjectRepository(Stage)
    private readonly stagesRepo: Repository<Stage>,
    @InjectRepository(StageStatusHistory)
    private readonly historyRepo: Repository<StageStatusHistory>,
    private readonly projectsService: ProjectsService,
  ) {}

  async create(
    projectId: string,
    dto: CreateStageDto,
    user: User,
  ): Promise<Stage> {
    await this.projectsService.assertAccess(projectId, user);

    const stage = this.stagesRepo.create({
      ...dto,
      projectId,
      deadline: dto.deadline ? new Date(dto.deadline) : undefined,
    });
    const saved = await this.stagesRepo.save(stage);

    await this.historyRepo.save(
      this.historyRepo.create({
        stageId: saved.id,
        fromStatus: null,
        toStatus: saved.status,
        changedBy: user.id,
        comment: 'Этап создан',
      }),
    );

    return saved;
  }

  async findAll(projectId: string, user: User): Promise<Stage[]> {
    await this.projectsService.assertAccess(projectId, user);
    return this.stagesRepo.find({
      where: { projectId },
      order: { createdAt: 'ASC' },
    });
  }

  async findOne(
    projectId: string,
    stageId: string,
    user: User,
  ): Promise<Stage> {
    await this.projectsService.assertAccess(projectId, user);

    const stage = await this.stagesRepo.findOne({
      where: { id: stageId, projectId },
    });
    if (!stage) throw new NotFoundException('Этап не найден');
    return stage;
  }

  async update(
    projectId: string,
    stageId: string,
    dto: UpdateStageDto,
    user: User,
  ): Promise<Stage> {
    const stage = await this.findOne(projectId, stageId, user);
    Object.assign(stage, dto);
    if (dto.deadline) stage.deadline = new Date(dto.deadline);
    return this.stagesRepo.save(stage);
  }

  async remove(
    projectId: string,
    stageId: string,
    user: User,
  ): Promise<void> {
    const stage = await this.findOne(projectId, stageId, user);
    await this.stagesRepo.remove(stage);
  }

  async changeStatus(
    projectId: string,
    stageId: string,
    dto: ChangeStatusDto,
    user: User,
  ): Promise<Stage> {
    const stage = await this.findOne(projectId, stageId, user);

    const allowed = ALLOWED_TRANSITIONS[stage.status];
    if (!allowed.includes(dto.status)) {
      throw new BadRequestException(
        `Недопустимый переход: ${stage.status} → ${dto.status}. ` +
          `Разрешено: ${allowed.join(', ') || 'нет переходов'}`,
      );
    }

    const fromStatus = stage.status;
    stage.status = dto.status;

    if (dto.status === StageStatus.IN_PROGRESS && !stage.startedAt) {
      stage.startedAt = new Date();
    }
    if (
      (dto.status === StageStatus.COMPLETED ||
        dto.status === StageStatus.CANCELLED) &&
      !stage.completedAt
    ) {
      stage.completedAt = new Date();
    }

    const saved = await this.stagesRepo.save(stage);

    await this.historyRepo.save(
      this.historyRepo.create({
        stageId: saved.id,
        fromStatus,
        toStatus: saved.status,
        changedBy: user.id,
        comment: dto.comment,
      }),
    );

    return saved;
  }

  async getHistory(
    projectId: string,
    stageId: string,
    user: User,
  ): Promise<StageStatusHistory[]> {
    await this.findOne(projectId, stageId, user);
    return this.historyRepo.find({
      where: { stageId },
      order: { createdAt: 'DESC' },
    });
  }
}