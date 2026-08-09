import { Module, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_PIPE } from '@nestjs/core';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { MeasurementTypesModule } from './measurement-types/measurement-types.module';
import { ReadingsModule } from './readings/readings.module';
import { RangesModule } from './ranges/ranges.module';
import { AlertsModule } from './alerts/alerts.module';
import { ProvidersModule } from './providers/providers.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { SeedModule } from './seed/seed.module';
import { User } from './entities/user.entity';
import { MeasurementType } from './entities/measurement-type.entity';
import { Reading } from './entities/reading.entity';
import { TargetRange } from './entities/target-range.entity';
import { Alert } from './entities/alert.entity';
import { Provider } from './entities/provider.entity';
import { Appointment } from './entities/appointment.entity';

const dbType = process.env.DATABASE_TYPE || 'better-sqlite3';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot(
      dbType === 'postgres'
        ? {
            type: 'postgres',
            url: process.env.DATABASE_URL,
            ssl: { rejectUnauthorized: false },
            entities: [
              User,
              MeasurementType,
              Reading,
              TargetRange,
              Alert,
              Provider,
              Appointment,
            ],
            synchronize: true,
          }
        : {
            type: 'better-sqlite3' as const,
            database: process.env.DATABASE_URL || 'data/vitalscope.db',
            entities: [
              User,
              MeasurementType,
              Reading,
              TargetRange,
              Alert,
              Provider,
              Appointment,
            ],
            synchronize: true,
          },
    ),
    AuthModule,
    UsersModule,
    MeasurementTypesModule,
    ReadingsModule,
    RangesModule,
    AlertsModule,
    ProvidersModule,
    AppointmentsModule,
    SeedModule,
  ],
  providers: [
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    },
  ],
})
export class AppModule {}
