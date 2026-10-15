import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { User } from '../users/entities/user.entity';

@Injectable()
export class AuthService {
  private readonly SALT_ROUNDS = 10;

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    if (!dto.email && !dto.phone) {
      throw new BadRequestException('Нужен email или телефон');
    }

    // Проверка, что пользователь не существует
    const existing = await this.usersService.findByLogin(
      dto.email ?? dto.phone!,
    );
    if (existing) {
      throw new ConflictException('Пользователь с таким email/телефоном уже существует');
    }

    const passwordHash = await bcrypt.hash(dto.password, this.SALT_ROUNDS);

    const user = await this.usersService.createWithHash(
      {
        fullName: dto.fullName,
        email: dto.email,
        phone: dto.phone,
        isEmployee: false,
        isClient: false,
      },
      passwordHash,
    );

    return this.buildAuthResponse(user);
  }

  async login(dto: LoginDto) {
    const login = dto.email ?? dto.phone;
    if (!login) {
      throw new BadRequestException('Нужен email или телефон');
    }

    const user = await this.usersService.findByLogin(login);
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Неверные учётные данные');
    }

    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException('Неверные учётные данные');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Пользователь заблокирован');
    }

    // Не возвращаем хеш наружу
    delete (user as any).passwordHash;

    return this.buildAuthResponse(user);
  }

  async me(userId: string): Promise<User> {
    return this.usersService.findOne(userId);
  }

  private buildAuthResponse(user: User) {
    const payload = {
      sub: user.id,
      email: user.email,
      phone: user.phone,
      roles: user.roles?.map((r) => r.code) ?? [],
    };

    return {
      accessToken: this.jwtService.sign(payload),
      user,
    };
  }
}