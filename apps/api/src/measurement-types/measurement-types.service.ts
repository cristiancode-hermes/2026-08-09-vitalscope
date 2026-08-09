import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MeasurementType } from '../entities/measurement-type.entity';

@Injectable()
export class MeasurementTypesService {
  constructor(
    @InjectRepository(MeasurementType)
    private typeRepository: Repository<MeasurementType>,
  ) {}

  findAll() {
    return this.typeRepository.find({ order: { key: 'ASC' } });
  }

  async findByKey(key: string): Promise<MeasurementType | null> {
    return this.typeRepository.findOne({ where: { key } });
  }

  async findById(id: string): Promise<MeasurementType | null> {
    return this.typeRepository.findOne({ where: { id } });
  }
}
