import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { ChangeTaskStatusDto } from './dto/change-task-status.dto';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@Controller('projects/:projectId/stages/:stageId/tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @RequirePermission('task.create')
  @Post()
  create(
    @Param('projectId') projectId: string,
    @Param('stageId') stageId: string,
    @Body() dto: CreateTaskDto,
    @CurrentUser() user: User,
  ) {
    return this.tasksService.create(projectId, stageId, dto, user);
  }

  @RequirePermission('task.view')
  @Get()
  findAll(
    @Param('projectId') projectId: string,
    @Param('stageId') stageId: string,
    @CurrentUser() user: User,
  ) {
    return this.tasksService.findAll(projectId, stageId, user);
  }

  @RequirePermission('task.view')
  @Get(':id')
  findOne(
    @Param('projectId') projectId: string,
    @Param('stageId') stageId: string,
    @Param('id') id: string,
    @CurrentUser() user: User,
  ) {
    return this.tasksService.findOne(projectId, stageId, id, user);
  }

  @RequirePermission('task.update')
  @Patch(':id')
  update(
    @Param('projectId') projectId: string,
    @Param('stageId') stageId: string,
    @Param('id') id: string,
    @Body() dto: UpdateTaskDto,
    @CurrentUser() user: User,
  ) {
    return this.tasksService.update(projectId, stageId, id, dto, user);
  }

  @RequirePermission('task.delete')
  @Delete(':id')
  remove(
    @Param('projectId') projectId: string,
    @Param('stageId') stageId: string,
    @Param('id') id: string,
    @CurrentUser() user: User,
  ) {
    return this.tasksService.remove(projectId, stageId, id, user);
  }

  @RequirePermission('task.update')
  @Post(':id/status')
  changeStatus(
    @Param('projectId') projectId: string,
    @Param('stageId') stageId: string,
    @Param('id') id: string,
    @Body() dto: ChangeTaskStatusDto,
    @CurrentUser() user: User,
  ) {
    return this.tasksService.changeStatus(projectId, stageId, id, dto, user);
  }

  @RequirePermission('task.view')
  @Get(':id/history')
  getHistory(
    @Param('projectId') projectId: string,
    @Param('stageId') stageId: string,
    @Param('id') id: string,
    @CurrentUser() user: User,
  ) {
    return this.tasksService.getHistory(projectId, stageId, id, user);
  }
}