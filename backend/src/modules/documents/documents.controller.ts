import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  UploadedFile,
  UseInterceptors,
  Body,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { DocumentsService } from './documents.service';
import { DocumentOwnerType } from './entities/document.entity';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@Controller('projects/:projectId/documents')
export class DocumentsController {
  constructor(private readonly docsService: DocumentsService) {}

  @RequirePermission('document.upload')
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  upload(
    @Param('projectId') projectId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('ownerType') ownerType: DocumentOwnerType,
    @Body('ownerId') ownerId: string,
    @CurrentUser() user: User,
  ) {
    return this.docsService.upload(projectId, ownerType, ownerId, file, user);
  }

  @RequirePermission('document.view')
  @Get()
  findAll(
    @Param('projectId') projectId: string,
    @CurrentUser() user: User,
  ) {
    return this.docsService.findAll(projectId, user);
  }

  @RequirePermission('document.view')
  @Get('owner')
  findForOwner(
    @Param('projectId') projectId: string,
    @Query('type') type: DocumentOwnerType,
    @Query('id') id: string,
    @CurrentUser() user: User,
  ) {
    return this.docsService.findForOwner(projectId, type, id, user);
  }

  @RequirePermission('document.view')
  @Get(':id/download')
  getDownloadUrl(
    @Param('projectId') projectId: string,
    @Param('id') id: string,
    @CurrentUser() user: User,
  ) {
    return this.docsService.getDownloadUrl(projectId, id, user).then(url => ({ url }));
  }
}