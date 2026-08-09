import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MeasurementTypesController } from './measurement-types.controller';
import { MeasurementTypesService } from './measurement-types.service';
import { MeasurementType } from '../entities/measurement-type.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([MeasurementType]), AuthModule],
  controllers: [MeasurementTypesController],
  providers: [MeasurementTypesService],
  exports: [MeasurementTypesService],
})
export class MeasurementTypesModule {}
