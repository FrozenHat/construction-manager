import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/require-permission.decorator';
import { User } from '../../users/entities/user.entity';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Нет требований — доступ разрешён
    if (!required || required.length === 0) return true;

    const request = context.switchToHttp().getRequest();
    const user: User | undefined = request.user;

    if (!user) {
      throw new ForbiddenException('Пользователь не аутентифицирован');
    }

    const userPermissions = this.collectPermissions(user);

    // chief/admin имеют '*'
    if (userPermissions.has('*')) return true;

    const hasAny = required.some((p) => userPermissions.has(p));
    if (!hasAny) {
      throw new ForbiddenException(
        `Недостаточно прав. Требуется: ${required.join(' или ')}`,
      );
    }
    return true;
  }

  private collectPermissions(user: User): Set<string> {
    const set = new Set<string>();
    for (const role of user.roles ?? []) {
      for (const permission of role.permissions ?? []) {
        if (permission.code === '*') {
          set.add('*');
          return set; // дальше собирать нет смысла
        }
        set.add(permission.code);
      }
    }
    return set;
  }
}