import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PERMISSIONS_KEY } from '../decorators/require-permission.decorator';
import { User } from '../../users/entities/user.entity';
import { ProjectMember } from '../../projects/entities/project-member.entity';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @InjectRepository(ProjectMember)
    private readonly membersRepo: Repository<ProjectMember>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const required = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!required || required.length === 0) return true;

    const request = context.switchToHttp().getRequest();
    const user: User | undefined = request.user;

    if (!user) {
      throw new ForbiddenException('Пользователь не аутентифицирован');
    }

    // 1. Глобальные права
    const globalPermissions = this.collectGlobalPermissions(user);
    if (globalPermissions.has('*')) return true;
    if (required.some((p) => globalPermissions.has(p))) return true;

    // 2. Проектные права — если в URL есть projectId
    const projectId = this.extractProjectId(request);
    if (projectId) {
      const projectPermissions = await this.collectProjectPermissions(
        user.id,
        projectId,
      );
      if (projectPermissions.has('*')) return true;
      if (required.some((p) => projectPermissions.has(p))) return true;
    }

    throw new ForbiddenException(
      `Недостаточно прав. Требуется: ${required.join(' или ')}`,
    );
  }

  private collectGlobalPermissions(user: User): Set<string> {
    const set = new Set<string>();
    for (const role of user.roles ?? []) {
      for (const permission of role.permissions ?? []) {
        if (permission.code === '*') {
          set.add('*');
          return set;
        }
        set.add(permission.code);
      }
    }
    return set;
  }

  private async collectProjectPermissions(
    userId: string,
    projectId: string,
  ): Promise<Set<string>> {
    const member = await this.membersRepo.findOne({
      where: { projectId, userId, isActive: true },
      relations: { role: { permissions: true } },
    });

    const set = new Set<string>();
    if (!member?.role?.permissions) return set;

    for (const permission of member.role.permissions) {
      if (permission.code === '*') {
        set.add('*');
        return set;
      }
      set.add(permission.code);
    }
    return set;
  }

  /**
   * Извлекает projectId из параметров URL.
   * Поддерживает роуты вида /projects/:id/... и /projects/:projectId/...
   */
  private extractProjectId(request: any): string | undefined {
    const params = request.params ?? {};
    return params.projectId ?? params.id ?? undefined;
  }
}