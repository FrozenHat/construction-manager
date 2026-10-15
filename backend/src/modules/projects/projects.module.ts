import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Project } from './entities/project.entity';
import { ProjectMember } from './entities/project-member.entity';
import { ProjectsService } from './projects.service';
import { ProjectsController } from './projects.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Project, ProjectMember]),
    AuthModule, // для PermissionsGuard
  ],
  controllers: [ProjectsController],
  providers: [ProjectsService],
  exports: [ProjectsService, TypeOrmModule],
})
export class ProjectsModule {}