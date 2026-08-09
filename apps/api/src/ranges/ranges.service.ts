import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TargetRange } from '../entities/target-range.entity';
import { MeasurementType } from '../entities/measurement-type.entity';
import { UpdateRangeDto } from './dto/update-range.dto';

export interface RangeWithDefaults extends TargetRange {
  type: MeasurementType;
  isCustom: boolean;
}

@Injectable()
export class RangesService {
  constructor(
    @InjectRepository(TargetRange)
    private rangeRepository: Repository<TargetRange>,
    @InjectRepository(MeasurementType)
    private typeRepository: Repository<MeasurementType>,
  ) {}

  /** Lista todos los tipos con su rango efectivo (custom si existe, si no default). */
  async findAll(userId: string): Promise<RangeWithDefaults[]> {
    const types = await this.typeRepository.find({ order: { key: 'ASC' } });
    const customs = await this.rangeRepository.find({ where: { userId } });

    return types.map((type) => {
      const custom = customs.find((c) => c.typeId === type.id);
      return {
        userId,
        typeId: type.id,
        min: custom ? custom.min : type.defaultMin,
        max: custom ? custom.max : type.defaultMax,
        updatedAt: custom ? custom.updatedAt : type.defaultMax ? new Date(0) : new Date(0),
        type,
        isCustom: !!custom,
      } as RangeWithDefaults;
    });
  }

  /** Upsert del rango personalizado de un tipo. */
  async upsert(userId: string, typeId: string, dto: UpdateRangeDto) {
    const type = await this.typeRepository.findOne({ where: { id: typeId } });
    if (!type) {
      throw new NotFoundException('Tipo de medición desconocido');
    }
    if (dto.min >= dto.max) {
      throw new BadRequestException('El mínimo debe ser menor que el máximo');
    }

    const existing = await this.rangeRepository.findOne({
      where: { userId, typeId },
    });
    if (existing) {
      existing.min = dto.min;
      existing.max = dto.max;
      return this.rangeRepository.save(existing);
    }

    const range = this.rangeRepository.create({
      userId,
      typeId: type.id,
      min: dto.min,
      max: dto.max,
      updatedAt: new Date(),
    } as any);
    return this.rangeRepository.save(range);
  }

  /** Borra el override: vuelve al rango default del tipo. */
  async remove(userId: string, typeId: string) {
    const existing = await this.rangeRepository.findOne({
      where: { userId, typeId },
    });
    if (existing) {
      await this.rangeRepository.remove(existing);
    }
    return { deleted: true };
  }
}
