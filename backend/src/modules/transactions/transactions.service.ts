import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction } from './entities/transaction.entity';
import { TransactionStatus, TransactionType, TransactionCategory } from './entities/transaction.enums';
import { ProjectsService } from '../projects/projects.service';
import { User } from '../users/entities/user.entity';
import { CreateTransactionDto } from './dto/create-transaction.dto';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction)
    private readonly txRepo: Repository<Transaction>,
    private readonly projectsService: ProjectsService,
  ) {}

  async create(projectId: string, dto: CreateTransactionDto, user: User): Promise<Transaction> {
    await this.projectsService.assertAccess(projectId, user);

    const tx = this.txRepo.create({
      projectId,
      amount: dto.amount,
      category: dto.category,
      type: dto.type,
      comment: dto.comment,
      stageId: dto.stageId,
      taskId: dto.taskId,
      authorId: user.id,
      // Если создает бухгалтер или шеф, можно сразу делать approved (в реальности требует проверки)
      status: TransactionStatus.PENDING, 
    });
    return this.txRepo.save(tx);
  }
    async findAll(projectId: string, user: User): Promise<Transaction[]> {
    await this.projectsService.assertAccess(projectId, user);
    return this.txRepo.find({
      where: { projectId },
      order: { createdAt: 'DESC' },
    });
  }

  // СИСТЕМНАЯ ТРАНЗАКЦИЯ (вызывается автоматически из TasksService)
  async createSystemTransaction(data: {
    projectId: string;
    stageId?: string;
    taskId?: string;
    amount: string;
    category: TransactionCategory;
    comment: string;
  }): Promise<Transaction> {
    const tx = this.txRepo.create({
      projectId: data.projectId,
      stageId: data.stageId,
      taskId: data.taskId,
      amount: data.amount,
      category: data.category,
      comment: data.comment,
      type: TransactionType.EXPENSE,
      status: TransactionStatus.APPROVED, // Автоматические транзакции сразу утверждены
      authorId: null, // Система
      approvedAt: new Date(),
    });
    return this.txRepo.save(tx);
  }

  async approve(txId: string, user: User): Promise<Transaction> {
    const tx = await this.txRepo.findOne({ where: { id: txId } });
    if (!tx) throw new NotFoundException('Транзакция не найдена');

    await this.projectsService.assertAccess(tx.projectId, user);

    tx.status = TransactionStatus.APPROVED;
    tx.approverId = user.id;
    tx.approvedAt = new Date();
    return this.txRepo.save(tx);
  }

  // РАСЧЕТ БАЛАНСА ПРОЕКТА
  async getProjectBalance(projectId: string, user: User) {
    await this.projectsService.assertAccess(projectId, user);

    const result = await this.txRepo
      .createQueryBuilder('tx')
      .select(
        `SUM(CASE WHEN tx.type = '${TransactionType.INCOME}' THEN tx.amount ELSE -tx.amount END)`,
        'balance'
      )
      .where('tx.project_id = :projectId', { projectId })
      .andWhere('tx.status = :status', { status: TransactionStatus.APPROVED })
      .getRawOne();

    return {
      projectId,
      balance: result.balance || '0.00',
      currency: '₽',
    };
  }
}