import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { StagesService } from './stages.service';
import { CreateStageDto } from './dto/create-stage.dto';
import { UpdateStageDto } from './dto/update-stage.dto';
import { ChangeStatusDto } from './dto/change-status.dto';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@Controller('projects/:projectId/stages')
export class StagesController {
  constructor(private readonly stagesService: StagesService) {}

  @RequirePermission('stage.create')
  @Post()
  create(
    @Param('projectId') projectId: string,
    @Body() dto: CreateStageDto,
    @CurrentUser() user: User,
  ) {
    return this.stagesService.create(projectId, dto, user);
  }

  @RequirePermission('stage.view')
  @Get()
  findAll(
    @Param('projectId') projectId: string,
    @CurrentUser() user: User,
  ) {
    return this.stagesService.findAll(projectId, user);
  }

  @RequirePermission('stage.view')
  @Get(':id')
  findOne(
    @Param('projectId') projectId: string,
    @Param('id') id: string,
    @CurrentUser() user: User,
  ) {
    return this.stagesService.findOne(projectId, id, user);
  }

  @RequirePermission('stage.update')
  @Patch(':id')
  update(
    @Param('projectId') projectId: string,
    @Param('id') id: string,
    @Body() dto: UpdateStageDto,
    @CurrentUser() user: User,
  ) {
    return this.stagesService.update(projectId, id, dto, user);
  }

  @RequirePermission('stage.delete')
  @Delete(':id')
  remove(
    @Param('projectId') projectId: string,
    @Param('id') id: string,
    @CurrentUser() user: User,
  ) {
    return this.stagesService.remove(projectId, id, user);
  }

  @RequirePermission('stage.approve')
  @Post(':id/status')
  changeStatus(
    @Param('projectId') projectId: string,
    @Param('id') id: string,
    @Body() dto: ChangeStatusDto,
    @CurrentUser() user: User,
  ) {
    return this.stagesService.changeStatus(projectId, id, dto, user);
  }

  @RequirePermission('stage.view')
  @Get(':id/history')
  getHistory(
    @Param('projectId') projectId: string,
    @Param('id') id: string,
    @CurrentUser() user: User,
  ) {
    return this.stagesService.getHistory(projectId, id, user);
  }
}