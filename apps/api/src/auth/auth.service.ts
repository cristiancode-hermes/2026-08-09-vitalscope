import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { User } from '../entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

export interface SafeUser {
  id: string;
  username: string;
  email: string;
  units: string;
  theme: string;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.userRepository.findOne({
      where: [{ username: dto.username }, { email: dto.email }],
    });
    if (existing) {
      const field =
        existing.email === dto.email ? 'email' : 'username';
      throw new ConflictException(
        field === 'email'
          ? 'Ese email ya está en uso'
          : 'Ese nombre de usuario ya está en uso',
      );
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const user = this.userRepository.create({
      username: dto.username.toLowerCase(),
      email: dto.email.toLowerCase(),
      passwordHash: hashedPassword,
    } as any);
    const saved = (await this.userRepository.save(user)) as unknown as User;
    const token = this.generateToken(saved);
    return { token, user: this.toSafeUser(saved) };
  }

  async login(dto: LoginDto) {
    const user = await this.userRepository.findOne({
      where: [
        { username: dto.identifier.toLowerCase() },
        { email: dto.identifier.toLowerCase() },
      ],
    });
    if (!user) {
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    const isValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    const token = this.generateToken(user);
    return { token, user: this.toSafeUser(user) };
  }

  async getMe(userId: string): Promise<SafeUser> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException();
    }
    return this.toSafeUser(user);
  }

  private generateToken(user: User): string {
    const payload = { username: user.username, sub: user.id };
    return this.jwtService.sign(payload);
  }

  private toSafeUser(user: User): SafeUser {
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      units: user.units,
      theme: user.theme,
    };
  }
}
