import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Appointment } from '../entities/appointment.entity';
import { CreateAppointmentDto, UpdateAppointmentDto } from './dto/appointments.dto';

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectRepository(Appointment)
    private appointmentRepository: Repository<Appointment>,
  ) {}

  async findAll(userId: string, scope: 'upcoming' | 'past' | 'all' = 'all') {
    const qb = this.appointmentRepository
      .createQueryBuilder('a')
      .leftJoinAndSelect('a.provider', 'provider')
      .where('a.user_id = :userId', { userId });

    const now = new Date();
    if (scope === 'upcoming') {
      qb.andWhere('a.scheduled_at >= :now', { now });
      qb.orderBy('a.scheduled_at', 'ASC');
    } else if (scope === 'past') {
      qb.andWhere('a.scheduled_at < :now', { now });
      qb.orderBy('a.scheduled_at', 'DESC');
    } else {
      qb.orderBy('a.scheduled_at', 'DESC');
    }

    return qb.getMany();
  }

  async create(userId: string, dto: CreateAppointmentDto) {
    const appointment = this.appointmentRepository.create({
      userId,
      providerId: dto.providerId,
      scheduledAt: new Date(dto.scheduledAt),
      reason: dto.reason ?? null,
      notes: dto.notes ?? null,
      followUp: dto.followUp ?? null,
    } as any);
    const saved = (await this.appointmentRepository.save(appointment)) as unknown as Appointment;
    return this.appointmentRepository.findOne({
      where: { id: saved.id, userId },
      relations: { provider: true },
    });
  }

  async findOne(userId: string, id: string) {
    const appointment = await this.appointmentRepository.findOne({
      where: { id, userId },
      relations: { provider: true },
    });
    if (!appointment) {
      throw new NotFoundException('Cita no encontrada');
    }
    return appointment;
  }

  async update(userId: string, id: string, dto: UpdateAppointmentDto) {
    const appointment = await this.findOne(userId, id);
    if (dto.scheduledAt !== undefined) appointment.scheduledAt = new Date(dto.scheduledAt);
    if (dto.reason !== undefined) appointment.reason = dto.reason;
    if (dto.notes !== undefined) appointment.notes = dto.notes;
    if (dto.followUp !== undefined) appointment.followUp = dto.followUp;
    await this.appointmentRepository.save(appointment);
    return this.findOne(userId, id);
  }

  async remove(userId: string, id: string) {
    const appointment = await this.findOne(userId, id);
    await this.appointmentRepository.remove(appointment);
    return { deleted: true };
  }
}
