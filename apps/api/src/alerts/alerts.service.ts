import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Alert } from '../entities/alert.entity';

@Injectable()
export class AlertsService {
  constructor(
    @InjectRepository(Alert)
    private alertRepository: Repository<Alert>,
  ) {}

  async findAll(
    userId: string,
    query: { acknowledged?: string; page?: string; limit?: string },
  ) {
    const page = Math.max(1, parseInt(query.page || '1', 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit || '20', 10) || 20));

    const qb = this.alertRepository
      .createQueryBuilder('a')
      .leftJoinAndSelect('a.reading', 'reading')
      .leftJoinAndSelect('a.type', 'type')
      .where('a.user_id = :userId', { userId });

    if (query.acknowledged === 'true') {
      qb.andWhere('a.acknowledged_at IS NOT NULL');
    } else if (query.acknowledged === 'false') {
      qb.andWhere('a.acknowledged_at IS NULL');
    }

    const [items, total] = await qb
      .orderBy('a.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { items, total, page, limit };
  }

  async pendingCount(userId: string): Promise<{ pending: number }> {
    const pending = await this.alertRepository
      .createQueryBuilder('a')
      .where('a.user_id = :userId', { userId })
      .andWhere('a.acknowledged_at IS NULL')
      .getCount();
    return { pending };
  }

  async findOne(userId: string, id: string) {
    const alert = await this.alertRepository.findOne({
      where: { id, userId },
      relations: { reading: true, type: true },
    });
    if (!alert) {
      throw new NotFoundException('Alerta no encontrada');
    }
    return alert;
  }

  async acknowledge(userId: string, id: string) {
    const alert = await this.findOne(userId, id);
    alert.acknowledgedAt = new Date();
    return this.alertRepository.save(alert);
  }

  async remove(userId: string, id: string) {
    const alert = await this.findOne(userId, id);
    await this.alertRepository.remove(alert);
    return { deleted: true };
  }
}
