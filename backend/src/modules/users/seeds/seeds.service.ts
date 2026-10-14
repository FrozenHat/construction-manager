import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from '../entities/role.entity';
import { Permission } from '../entities/permission.entity';
import { PERMISSIONS_SEED } from './permissions.seed';
import { ROLES_SEED } from './roles.seed';

@Injectable()
export class SeedsService implements OnModuleInit {
  private readonly logger = new Logger(SeedsService.name);

  constructor(
    @InjectRepository(Role)
    private readonly rolesRepo: Repository<Role>,
    @InjectRepository(Permission)
    private readonly permissionsRepo: Repository<Permission>,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.seedPermissions();
    await this.seedRoles();
  }

  private async seedPermissions(): Promise<void> {
    const existing = await this.permissionsRepo.count();
    if (existing > 0) {
      this.logger.log(`Permissions уже засеяны (${existing}) — пропускаем`);
      return;
    }

    const permissions = PERMISSIONS_SEED.map((p) =>
      this.permissionsRepo.create(p),
    );
    await this.permissionsRepo.save(permissions);
    this.logger.log(`✅ Засеяно прав: ${permissions.length}`);
  }

  private async seedRoles(): Promise<void> {
    const existing = await this.rolesRepo.count();
    if (existing > 0) {
      this.logger.log(`Roles уже засеяны (${existing}) — пропускаем`);
      return;
    }

    const allPermissions = await this.permissionsRepo.find();

    const roles = ROLES_SEED.map((roleSeed) => {
      const role = this.rolesRepo.create({
        code: roleSeed.code,
        name: roleSeed.name,
        description: roleSeed.description,
      });

      if (roleSeed.permissions.includes('*')) {
        role.permissions = allPermissions;
      } else {
        role.permissions = allPermissions.filter((p) =>
          roleSeed.permissions.includes(p.code),
        );
      }

      return role;
    });

    await this.rolesRepo.save(roles);
    this.logger.log(`✅ Засеяно ролей: ${roles.length}`);
  }
}