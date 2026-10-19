import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Document, DocumentOwnerType } from './entities/document.entity';
import { StorageService } from './storage.service';
import { ProjectsService } from '../projects/projects.service';
import { User } from '../users/entities/user.entity';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';

@Injectable()
export class DocumentsService {
  constructor(
    @InjectRepository(Document)
    private readonly docsRepo: Repository<Document>,
    private readonly storageService: StorageService,
    private readonly projectsService: ProjectsService,
  ) {}

  async upload(
    projectId: string,
    ownerType: DocumentOwnerType,
    ownerId: string,
    file: Express.Multer.File,
    user: User,
  ): Promise<Document> {
    await this.projectsService.assertAccess(projectId, user);

    // Ищем предыдущую версию этого файла для этого объекта
    const existing = await this.docsRepo.findOne({
      where: { projectId, ownerType, ownerId, fileName: file.originalname },
      order: { version: 'DESC' },
    });

    const version = existing ? existing.version + 1 : 1;
    const parentId = existing ? existing.id : null;
    const storageKey = `${projectId}/${ownerType}/${ownerId}/${uuidv4()}${path.extname(file.originalname)}`;

    // Загружаем в MinIO
    await this.storageService.client.putObject(
      this.storageService.bucket,
      storageKey,
      file.buffer,
      file.size,
      { 'Content-Type': file.mimetype },
    );

    // Сохраняем метаданные в БД
    const doc = this.docsRepo.create({
      projectId,
      ownerType,
      ownerId,
      fileName: file.originalname,
      mimeType: file.mimetype,
      sizeBytes: file.size.toString(),
      storageKey,
      version,
      parentId,
      authorId: user.id,
    });

    return this.docsRepo.save(doc);
  }

  async findAll(projectId: string, user: User): Promise<Document[]> {
    await this.projectsService.assertAccess(projectId, user);
    return this.docsRepo.find({
      where: { projectId },
      order: { createdAt: 'DESC' },
    });
  }

  async findForOwner(
    projectId: string,
    ownerType: DocumentOwnerType,
    ownerId: string,
    user: User,
  ): Promise<Document[]> {
    await this.projectsService.assertAccess(projectId, user);
    return this.docsRepo.find({
      where: { projectId, ownerType, ownerId },
      order: { version: 'DESC', createdAt: 'DESC' },
    });
  }

  // Генерирует временную ссылку на скачивание (валидна 1 час)
  async getDownloadUrl(projectId: string, docId: string, user: User): Promise<string> {
    await this.projectsService.assertAccess(projectId, user);
    const doc = await this.docsRepo.findOne({ where: { id: docId, projectId } });
    if (!doc) throw new NotFoundException('Документ не найден');

    return this.storageService.client.presignedGetObject(
      this.storageService.bucket,
      doc.storageKey,
      60 * 60, // 1 час
    );
  }
}