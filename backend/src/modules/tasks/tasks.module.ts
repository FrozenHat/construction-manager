import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Task } from './entities/task.entity';
import { TaskStatusHistory } from './entities/task-status-history.entity';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { StagesModule } from '../stages/stages.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Task, TaskStatusHistory]),
    StagesModule,
  ],
  controllers: [TasksController],
  providers: [TasksService],
  exports: [TasksService, TypeOrmModule],
})
export class TasksModule {}