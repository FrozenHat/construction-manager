import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Task } from './entities/task.entity';
import { TaskStatusHistory } from './entities/task-status-history.entity';
import { ProjectMember } from '../projects/entities/project-member.entity'; // Проверьте путь
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { StagesModule } from '../stages/stages.module';
import { TransactionsModule } from '../transactions/transactions.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Task, 
      TaskStatusHistory, 
      ProjectMember // <--- ОБЯЗАТЕЛЬНО ДОЛЖНО БЫТЬ ЗДЕСЬ
    ]),
    StagesModule,
    TransactionsModule,
    NotificationsModule,
  ],
  controllers: [TasksController],
  providers: [TasksService],
  exports: [TasksService, TypeOrmModule],
})
export class TasksModule {}