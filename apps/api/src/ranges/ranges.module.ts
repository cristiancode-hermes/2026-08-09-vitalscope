import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RangesController } from './ranges.controller';
import { RangesService } from './ranges.service';
import { TargetRange } from '../entities/target-range.entity';
import { MeasurementType } from '../entities/measurement-type.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([TargetRange, MeasurementType]), AuthModule],
  controllers: [RangesController],
  providers: [RangesService],
  exports: [RangesService],
})
export class RangesModule {}
