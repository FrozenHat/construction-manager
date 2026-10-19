import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from './entities/task.entity';
import { TaskStatus, PauseReason } from './entities/task-status.enum';
import { TaskStatusHistory } from './entities/task-status-history.entity';
import { StagesService } from '../stages/stages.service';
import { User } from '../users/entities/user.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { ChangeTaskStatusDto } from './dto/change-task-status.dto';
import { TransactionsService } from '../transactions/transactions.service';
import { TransactionCategory } from '../transactions/entities/transaction.enums';

import { NotificationsService } from '../notifications/notifications.service';
import { AcceptTaskDto } from './dto/accept-task.dto';
import { ProjectMember } from '../projects/entities/project-member.entity';

/**
 * Конечный автомат статусов задач.
 * Учитывает ТЗ: утверждение шефом, готовность прораба, согласие исполнителя,
 * приёмку технадзором, приостановку по причине.
 */
const ALLOWED_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  [TaskStatus.DRAFT]: [
    TaskStatus.PENDING_APPROVAL,
    TaskStatus.CANCELLED,
  ],
  [TaskStatus.PENDING_APPROVAL]: [
    TaskStatus.SENT_TO_CONTRACTOR,
    TaskStatus.DRAFT,
    TaskStatus.CANCELLED,
  ],
  [TaskStatus.SENT_TO_CONTRACTOR]: [
    TaskStatus.IN_PROGRESS,
    TaskStatus.PENDING_APPROVAL,
    TaskStatus.CANCELLED,
  ],
  [TaskStatus.IN_PROGRESS]: [
    TaskStatus.ON_REVIEW,
    TaskStatus.PAUSED,
    TaskStatus.CANCELLED,
  ],
  [TaskStatus.ON_REVIEW]: [
    TaskStatus.ACCEPTED,
    TaskStatus.REJECTED,
  ],
  [TaskStatus.ACCEPTED]: [
    TaskStatus.COMPLETED,
    TaskStatus.REJECTED,
  ],
  [TaskStatus.REJECTED]: [
    TaskStatus.PAUSED,
    TaskStatus.CANCELLED,
  ],
  [TaskStatus.PAUSED]: [
    TaskStatus.IN_PROGRESS,
    TaskStatus.CANCELLED,
  ],
  [TaskStatus.COMPLETED]: [],
  [TaskStatus.CANCELLED]: [],
};

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private readonly tasksRepo: Repository<Task>,
    @InjectRepository(TaskStatusHistory)
    private readonly historyRepo: Repository<TaskStatusHistory>,
    private readonly membersRepo: Repository<ProjectMember>,
    private readonly stagesService: StagesService,
    private readonly transactionsService: TransactionsService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(
    projectId: string,
    stageId: string,
    dto: CreateTaskDto,
    user: User,
  ): Promise<Task> {
    // Проверка доступа к проекту + существование этапа в этом проекте
    await this.stagesService.findOne(projectId, stageId, user);

    const task = this.tasksRepo.create({
      ...dto,
      projectId,
      stageId,
      deadline: dto.deadline ? new Date(dto.deadline) : null,
    });
    const saved = await this.tasksRepo.save(task);

    await this.historyRepo.save(
      this.historyRepo.create({
        taskId: saved.id,
        fromStatus: null,
        toStatus: saved.status,
        changedBy: user.id,
        comment: 'Задача создана',
      }),
    );

    return saved;
  }

    async acceptTask(
    projectId: string,
    stageId: string,
    taskId: string,
    dto: AcceptTaskDto,
    user: User,
  ): Promise<Task> {
    const task = await this.findOne(projectId, stageId, taskId, user);

    // Проверка, что это именно назначенный исполнитель
    if (task.contractorId !== user.id) {
      throw new BadRequestException('Вы не назначены исполнителем на эту задачу');
    }

    if (task.status !== TaskStatus.SENT_TO_CONTRACTOR) {
      throw new BadRequestException('Задача находится не в том статусе для принятия');
    }

    // Фиксируем цену и меняем статус
    task.contractorFee = dto.contractorFee;
    task.status = TaskStatus.IN_PROGRESS;
    task.startedAt = new Date();

    const saved = await this.tasksRepo.save(task);

    // Пишем в историю
    await this.historyRepo.save(
      this.historyRepo.create({
        taskId: saved.id,
        fromStatus: TaskStatus.SENT_TO_CONTRACTOR,
        toStatus: TaskStatus.IN_PROGRESS,
        changedBy: user.id,
        comment: dto.comment ? `Исполнитель принял задачу. Комментарий: ${dto.comment}` : 'Исполнитель принял задачу',
      }),
    );

    // Отправляем уведомление менеджеру
    if (saved.managerId) {
      await this.notificationsService.create(
        saved.managerId,
        'Исполнитель принял задачу',
        `Сотрудник ${user.fullName} принял задачу "${saved.name}". Его стоимость: ${saved.contractorFee} MDL. ${dto.comment ? 'Комментарий: ' + dto.comment : ''}`,
        `/projects/${projectId}`
      );
    }

    return saved;
  }

  async findAll(
    projectId: string,
    stageId: string,
    user: User,
  ): Promise<Task[]> {
    await this.stagesService.findOne(projectId, stageId, user);

    return this.tasksRepo.find({
      where: { projectId, stageId },
      order: { createdAt: 'ASC' },
    });
  }

  async findOne(
    projectId: string,
    stageId: string,
    taskId: string,
    user: User,
  ): Promise<Task> {
    await this.stagesService.findOne(projectId, stageId, user);

    const task = await this.tasksRepo.findOne({
      where: { id: taskId, projectId, stageId },
    });
    if (!task) throw new NotFoundException('Задача не найдена');
    return task;
  }

  async update(
    projectId: string,
    stageId: string,
    taskId: string,
    dto: UpdateTaskDto,
    user: User,
  ): Promise<Task> {
    const task = await this.findOne(projectId, stageId, taskId, user);
    Object.assign(task, dto);
    if (dto.deadline) task.deadline = new Date(dto.deadline);
    return this.tasksRepo.save(task);
  }

  async remove(
    projectId: string,
    stageId: string,
    taskId: string,
    user: User,
  ): Promise<void> {
    const task = await this.findOne(projectId, stageId, taskId, user);
    await this.tasksRepo.remove(task);
  }

  async changeStatus(
    projectId: string,
    stageId: string,
    taskId: string,
    dto: ChangeTaskStatusDto,
    user: User,
  ): Promise<Task> {
    const task = await this.findOne(projectId, stageId, taskId, user);
    
    const allowed = ALLOWED_TRANSITIONS[task.status];
    if (!allowed.includes(dto.status)) {
      throw new BadRequestException(
        `Недопустимый переход: ${task.status} → ${dto.status}. ` +
          `Разрешено: ${allowed.join(', ') || 'нет переходов'}`,
      );
    }
    

    // Особые требования к переходу в PAUSED — обязательно указать причину
    if (
      dto.status === TaskStatus.PAUSED &&
      !dto.pauseReason
    ) {
      throw new BadRequestException(
        'При приостановке задачи нужно указать причину (materials | finance | quality)',
      );
    }
    

    const fromStatus = task.status;
    task.status = dto.status;

    // ФИКСАЦИЯ СТОИМОСТИ ИСПОЛНИТЕЛЕМ
    if (fromStatus === TaskStatus.SENT_TO_CONTRACTOR && dto.status === TaskStatus.IN_PROGRESS) {
    if (dto.contractorFee) task.contractorFee = dto.contractorFee;
    if (dto.foremanFee) task.foremanFee = dto.foremanFee;
    }

    // Автоустановка временных меток
    if (dto.status === TaskStatus.IN_PROGRESS && !task.startedAt) {
      task.startedAt = new Date();
    }
    if (
      (dto.status === TaskStatus.COMPLETED ||
        dto.status === TaskStatus.CANCELLED) &&
      !task.completedAt
    ) {
      task.completedAt = new Date();
    }

    // Управление pause_reason
    if (dto.status === TaskStatus.PAUSED) {
      task.pauseReason = dto.pauseReason ?? null;
      task.pauseComment = dto.pauseComment ?? null;
    } else if (fromStatus === TaskStatus.PAUSED) {
      // выходим из паузы — чистим причину
      task.pauseReason = null;
      task.pauseComment = null;
    }

    const saved = await this.tasksRepo.save(task);

    // Отправка уведомления
    if (saved.status === TaskStatus.SENT_TO_CONTRACTOR && saved.contractorId) {
      await this.notificationsService.create(
        saved.contractorId,
        'Новая задача',
        `Вам предложена задача: ${saved.name}. Пожалуйста, подтвердите готовность или откажитесь.`,
        `/projects/${saved.projectId}`
      );
    }
    // НОВАЯ ЛОГИКА: Если работа сдана на проверку
    if (dto.status === TaskStatus.ON_REVIEW) {
      // 1. Уведомляем менеджера о смене статуса
      if (saved.managerId) {
        await this.notificationsService.create(
          saved.managerId,
          'Смена статуса задачи',
          `Задача "${saved.name}" сдана исполнителем и ожидает проверки Технадзором.`,
          `/projects/${saved.projectId}`
        );
      }

      // 2. Ищем Технадзоров в этом проекте и отправляем им задачу
      const supervisors = await this.membersRepo.find({
        where: { projectId: saved.projectId, roleCode: 'supervisor', isActive: true },
      });

      for (const sup of supervisors) {
        await this.notificationsService.create(
          sup.userId,
          'Требуется проверка задачи',
          `Задача "${saved.name}" ожидает вашей проверки. Пожалуйста, осмотрите объект и составьте отчет.`,
          `/projects/${saved.projectId}`
        );
      }
    }

    await this.historyRepo.save(
      this.historyRepo.create({
        taskId: saved.id,
        fromStatus,
        toStatus: saved.status,
        changedBy: user.id,
        comment: dto.comment ?? null,
      }),
    );
    

    // НАЧИСЛЕНИЕ ГОНОРАРОВ ПРИ УСПЕШНОМ ЗАВЕРШЕНИИ (Код перенесен ДО return)
    if (dto.status === TaskStatus.COMPLETED) {
      // 1. Транзакция на гонорар исполнителю
      if (saved.contractorFee && saved.contractorId) {
        await this.transactionsService.createSystemTransaction({
          projectId: saved.projectId,
          stageId: saved.stageId,
          taskId: saved.id,
          amount: saved.contractorFee,
          category: TransactionCategory.FEE,
          comment: `Гонорар исполнителю по задаче: ${saved.name}`,
        });
      }

      // 2. Транзакция на гонорар прорабу
      if (saved.foremanFee && saved.foremanId) {
        await this.transactionsService.createSystemTransaction({
          projectId: saved.projectId,
          stageId: saved.stageId,
          taskId: saved.id,
          amount: saved.foremanFee,
          category: TransactionCategory.FEE,
          comment: `Гонорар прорабу по задаче: ${saved.name}`,
        });
      }
    }

    return saved; // Теперь возвращаем результат в самом конце метода
  }

  async getHistory(
    projectId: string,
    stageId: string,
    taskId: string,
    user: User,
  ): Promise<TaskStatusHistory[]> {
    await this.findOne(projectId, stageId, taskId, user);
    return this.historyRepo.find({
      where: { taskId },
      order: { createdAt: 'DESC' },
    });
  }
}