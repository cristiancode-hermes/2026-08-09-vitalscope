import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeedService } from './seed.service';
import { User } from '../entities/user.entity';
import { MeasurementType } from '../entities/measurement-type.entity';
import { Reading } from '../entities/reading.entity';
import { TargetRange } from '../entities/target-range.entity';
import { Provider } from '../entities/provider.entity';
import { Appointment } from '../entities/appointment.entity';
import { Alert } from '../entities/alert.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      MeasurementType,
      Reading,
      TargetRange,
      Provider,
      Appointment,
      Alert,
    ]),
  ],
  providers: [SeedService],
  exports: [SeedService],
})
export class SeedModule {}
