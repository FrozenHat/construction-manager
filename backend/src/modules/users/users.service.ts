import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { Role } from './entities/role.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    @InjectRepository(Role)
    private readonly rolesRepo: Repository<Role>,
  ) {}

  async create(dto: CreateUserDto): Promise<User> {
    // Взаимоисключение клиента и сотрудника
    if (dto.isClient && dto.isEmployee) {
      throw new BadRequestException(
        'Пользователь не может быть одновременно клиентом и сотрудником',
      );
    }

    // Проверка уникальности
    if (dto.email) {
      const existing = await this.usersRepo.findOne({
        where: { email: dto.email },
      });
      if (existing) throw new ConflictException('Email уже занят');
    }
    if (dto.phone) {
      const existing = await this.usersRepo.findOne({
        where: { phone: dto.phone },
      });
      if (existing) throw new ConflictException('Телефон уже занят');
    }

    const user = this.usersRepo.create(dto);
    return this.usersRepo.save(user);
  }

  async findAll(): Promise<User[]> {
    return this.usersRepo.find();
  }

  async findOne(id: string): Promise<User> {
    const user = await this.usersRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException(`User ${id} не найден`);
    return user;
  }
  async findByLogin(login: string): Promise<User | null> {
    return this.usersRepo
        .createQueryBuilder('user')
        .addSelect('user.passwordHash')
        .leftJoinAndSelect('user.roles', 'role')
        .leftJoinAndSelect('role.permissions', 'permission')
        .where('user.email = :login OR user.phone = :login', { login })
        .getOne();
  }
  async updatePasswordHash(userId: string, hash: string): Promise<void> {
    await this.usersRepo.update({ id: userId }, { passwordHash: hash });
  }
  async update(id: string, dto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);
    Object.assign(user, dto);
    return this.usersRepo.save(user);
  }

  async createWithHash(
  dto: CreateUserDto,
  passwordHash: string,
): Promise<User> {
  const user = await this.create(dto);
  await this.updatePasswordHash(user.id, passwordHash);
  return this.findOne(user.id);
}

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    await this.usersRepo.remove(user);
  }

  async assignRole(userId: string, roleCode: string): Promise<User> {
    const user = await this.findOne(userId);
    const role = await this.rolesRepo.findOne({ where: { code: roleCode } });
    if (!role) throw new NotFoundException(`Role ${roleCode} не найдена`);

    const hasRole = user.roles?.some((r) => r.code === roleCode);
    if (!hasRole) {
      user.roles = [...(user.roles || []), role];
      await this.usersRepo.save(user);
    }
    return user;
  }
}