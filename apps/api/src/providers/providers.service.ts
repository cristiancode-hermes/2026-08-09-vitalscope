import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Provider } from '../entities/provider.entity';
import { CreateProviderDto, UpdateProviderDto } from './dto/providers.dto';

@Injectable()
export class ProvidersService {
  constructor(
    @InjectRepository(Provider)
    private providerRepository: Repository<Provider>,
  ) {}

  findAll(userId: string) {
    return this.providerRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async create(userId: string, dto: CreateProviderDto) {
    const provider = this.providerRepository.create({
      userId,
      name: dto.name,
      specialty: dto.specialty ?? null,
      phone: dto.phone ?? null,
      email: dto.email ?? null,
      address: dto.address ?? null,
      notes: dto.notes ?? null,
    } as any);
    return this.providerRepository.save(provider);
  }

  async findOne(userId: string, id: string) {
    const provider = await this.providerRepository.findOne({
      where: { id, userId },
    });
    if (!provider) {
      throw new NotFoundException('Profesional no encontrado');
    }
    return provider;
  }

  async update(userId: string, id: string, dto: UpdateProviderDto) {
    const provider = await this.findOne(userId, id);
    if (dto.name !== undefined) provider.name = dto.name;
    if (dto.specialty !== undefined) provider.specialty = dto.specialty;
    if (dto.phone !== undefined) provider.phone = dto.phone;
    if (dto.email !== undefined) provider.email = dto.email;
    if (dto.address !== undefined) provider.address = dto.address;
    if (dto.notes !== undefined) provider.notes = dto.notes;
    return this.providerRepository.save(provider);
  }

  async remove(userId: string, id: string) {
    const provider = await this.findOne(userId, id);
    await this.providerRepository.remove(provider);
    return { deleted: true };
  }
}
