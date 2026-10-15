import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Stage } from './entities/stage.entity';
import { StageStatusHistory } from './entities/stage-status-history.entity';
import { StagesService } from './stages.service';
import { StagesController } from './stages.controller';
import { ProjectsModule } from '../projects/projects.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Stage, StageStatusHistory]),
    ProjectsModule,   // для ProjectsService.assertAccess
  ],
  controllers: [StagesController],
  providers: [StagesService],
  exports: [StagesService, TypeOrmModule],
})
export class StagesModule {}