import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { AddMemberDto } from './dto/add-member.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @RequirePermission('project.create')
  @Post()
  create(@Body() dto: CreateProjectDto) {
    return this.projectsService.create(dto);
  }

  @RequirePermission('project.view')
  @Get()
  findAll(@CurrentUser() user: User) {
    return this.projectsService.findAllForUser(user);
  }

  @RequirePermission('project.view')
  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: User) {
    return this.projectsService.findOne(id, user);
  }

  @RequirePermission('project.update')
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateProjectDto,
    @CurrentUser() user: User,
  ) {
    return this.projectsService.update(id, dto, user);
  }

  @RequirePermission('project.delete')
  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: User) {
    return this.projectsService.remove(id, user);
  }

  // --- Участники ---

  @RequirePermission('project.update')
  @Post(':id/members')
  addMember(
    @Param('id') id: string,
    @Body() dto: AddMemberDto,
    @CurrentUser() user: User,
  ) {
    return this.projectsService.addMember(id, dto, user);
  }

  @RequirePermission('project.view')
  @Get(':id/members')
  listMembers(@Param('id') id: string, @CurrentUser() user: User) {
    return this.projectsService.listMembers(id, user);
  }

  @RequirePermission('project.update')
  @Delete(':id/members/:memberId')
  removeMember(
    @Param('id') id: string,
    @Param('memberId') memberId: string,
    @CurrentUser() user: User,
  ) {
    return this.projectsService.removeMember(id, memberId, user);
  }
}