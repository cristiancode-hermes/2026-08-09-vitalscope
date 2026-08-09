import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async updateMe(userId: string, dto: UpdateUserDto) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    if (dto.username || dto.email) {
      const existing = await this.userRepository.findOne({
        where: [
          ...(dto.username ? [{ username: dto.username.toLowerCase() }] : []),
          ...(dto.email ? [{ email: dto.email.toLowerCase() }] : []),
        ],
      });
      if (existing && existing.id !== userId) {
        throw new ConflictException('Ese nombre de usuario o email ya está en uso');
      }
    }

    if (dto.username) user.username = dto.username.toLowerCase();
    if (dto.email) user.email = dto.email.toLowerCase();
    if (dto.units) user.units = dto.units;
    if (dto.theme) user.theme = dto.theme;

    const saved = await this.userRepository.save(user);
    return {
      id: saved.id,
      username: saved.username,
      email: saved.email,
      units: saved.units,
      theme: saved.theme,
    };
  }
}
