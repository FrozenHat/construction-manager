import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notifRepo: Repository<Notification>,
  ) {}

  async create(userId: string, title: string, message: string, linkUrl?: string) {
    const notif = this.notifRepo.create({ userId, title, message, linkUrl });
    return this.notifRepo.save(notif);
  }

  async findForUser(userId: string) {
    return this.notifRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 20, // Последние 20
    });
  }

  async markAsRead(id: string, userId: string) {
    await this.notifRepo.update({ id, userId }, { isRead: true });
  }
}