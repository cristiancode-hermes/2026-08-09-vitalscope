import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReadingsController } from './readings.controller';
import { ReadingsService } from './readings.service';
import { Reading } from '../entities/reading.entity';
import { TargetRange } from '../entities/target-range.entity';
import { Alert } from '../entities/alert.entity';
import { MeasurementType } from '../entities/measurement-type.entity';
import { User } from '../entities/user.entity';
import { AuthModule } from '../auth/auth.module';
import { MeasurementTypesModule } from '../measurement-types/measurement-types.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Reading, TargetRange, Alert, MeasurementType, User]),
    AuthModule,
    MeasurementTypesModule,
  ],
  controllers: [ReadingsController],
  providers: [ReadingsService],
  exports: [ReadingsService],
})
export class ReadingsModule {}
