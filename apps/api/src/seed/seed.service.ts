import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from '../entities/user.entity';
import { MeasurementType } from '../entities/measurement-type.entity';
import { Reading } from '../entities/reading.entity';
import { TargetRange } from '../entities/target-range.entity';
import { Provider } from '../entities/provider.entity';
import { Appointment } from '../entities/appointment.entity';
import { Alert } from '../entities/alert.entity';

const MEASUREMENT_TYPES: Array<Partial<MeasurementType>> = [
  { id: 'mt-bp', key: 'blood_pressure', label: 'Tensión arterial', unit: 'mmHg', category: 'blood_pressure', defaultMin: 90, defaultMax: 130, icon: 'heart-pulse' },
  { id: 'mt-hr', key: 'heart_rate', label: 'Frecuencia cardíaca', unit: 'bpm', category: 'single', defaultMin: 60, defaultMax: 100, icon: 'heart' },
  { id: 'mt-weight', key: 'weight', label: 'Peso', unit: 'kg', category: 'single', defaultMin: 40, defaultMax: 200, icon: 'scale' },
  { id: 'mt-glucose', key: 'blood_glucose', label: 'Glucosa en sangre', unit: 'mg/dL', category: 'single', defaultMin: 70, defaultMax: 140, icon: 'droplet' },
  { id: 'mt-spo2', key: 'oxygen_saturation', label: 'Saturación O₂', unit: '%', category: 'single', defaultMin: 95, defaultMax: 100, icon: 'lungs' },
  { id: 'mt-temp', key: 'body_temperature', label: 'Temperatura corporal', unit: '°C', category: 'single', defaultMin: 36, defaultMax: 37.5, icon: 'thermometer' },
];

@Injectable()
export class SeedService {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(MeasurementType)
    private typeRepository: Repository<MeasurementType>,
    @InjectRepository(Reading)
    private readingRepository: Repository<Reading>,
    @InjectRepository(TargetRange)
    private rangeRepository: Repository<TargetRange>,
    @InjectRepository(Provider)
    private providerRepository: Repository<Provider>,
    @InjectRepository(Appointment)
    private appointmentRepository: Repository<Appointment>,
    @InjectRepository(Alert)
    private alertRepository: Repository<Alert>,
  ) {}

  async seed() {
    await this.seedTypes();

    const count = await this.userRepository.count();
    if (count > 0) {
      this.logger.log(`Seed: ${count} usuarios ya existen, skip demo data`);
      return;
    }

    await this.seedDemoUser();
    this.logger.log('Seed: demo data creada');
  }

  private async seedTypes() {
    for (const t of MEASUREMENT_TYPES) {
      const existing = await this.typeRepository.findOne({ where: { id: t.id as string } });
      if (!existing) {
        await this.typeRepository.save(this.typeRepository.create(t as any));
      }
    }
    this.logger.log(`Seed: ${MEASUREMENT_TYPES.length} measurement types listos`);
  }

  private async seedDemoUser() {
    const passwordHash = await bcrypt.hash('vitalscope123', 10);
    const ana = (await this.userRepository.save(
      this.userRepository.create({
        username: 'ana',
        email: 'ana@correo.es',
        passwordHash,
        units: 'metric',
        theme: 'auto',
      } as any),
    )) as unknown as User;
    const marcos = (await this.userRepository.save(
      this.userRepository.create({
        username: 'marcos',
        email: 'marcos@correo.es',
        passwordHash,
        units: 'metric',
        theme: 'dark',
      } as any),
    )) as unknown as User;

    // Rango personalizado de ana: tensión sistólica 110-125 (más estricto que default).
    await this.rangeRepository.save(
      this.rangeRepository.create({
        userId: ana.id,
        typeId: 'mt-bp',
        min: 110,
        max: 125,
        updatedAt: new Date(),
      } as any),
    );

    // Lecturas demo de ana (últimos 14 días) para que dashboard/tendencias tengan datos reales.
    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;
    const readings: Array<Partial<Reading>> = [];

    const bpSeries: Array<[number, number, number]> = [
      [0, 128, 84], [1, 124, 82], [2, 132, 86], [3, 121, 79], [4, 126, 81],
      [5, 129, 83], [6, 122, 78], [7, 127, 80], [8, 135, 88], [9, 123, 80],
      [10, 120, 76], [11, 130, 85], [12, 118, 74], [13, 125, 79],
    ];
    for (const [d, sys, dia] of bpSeries) {
      readings.push({
        userId: ana.id, typeId: 'mt-bp', value: null, systolic: sys, diastolic: dia,
        unit: 'mmHg', recordedAt: new Date(now - d * day), notes: null, tags: d % 2 === 0 ? ['mañana'] : ['noche'],
      });
    }

    const hrSeries: Array<[number, number]> = [
      [0, 72], [1, 68], [2, 74], [3, 52], [4, 70], [5, 65], [6, 78],
      [7, 66], [8, 71], [9, 69], [10, 73], [11, 55], [12, 67], [13, 70],
    ];
    for (const [d, v] of hrSeries) {
      readings.push({
        userId: ana.id, typeId: 'mt-hr', value: v, systolic: null, diastolic: null,
        unit: 'bpm', recordedAt: new Date(now - d * day), notes: null, tags: ['en-reposo'],
      });
    }

    const weightSeries: Array<[number, number]> = [
      [0, 71.5], [2, 71.8], [4, 71.2], [6, 71.6], [8, 71.1], [10, 71.4], [12, 71.0], [13, 70.9],
    ];
    for (const [d, v] of weightSeries) {
      readings.push({
        userId: ana.id, typeId: 'mt-weight', value: v, systolic: null, diastolic: null,
        unit: 'kg', recordedAt: new Date(now - d * day), notes: null, tags: ['mañana', 'en-ayunas'],
      });
    }

    const glucoseSeries: Array<[number, number]> = [
      [0, 95], [2, 102], [4, 98], [6, 110], [8, 96], [10, 99], [12, 94],
    ];
    for (const [d, v] of glucoseSeries) {
      readings.push({
        userId: ana.id, typeId: 'mt-glucose', value: v, systolic: null, diastolic: null,
        unit: 'mg/dL', recordedAt: new Date(now - d * day), notes: null, tags: ['en-ayunas'],
      });
    }

    const spo2Series: Array<[number, number]> = [
      [0, 98], [1, 97], [2, 98], [3, 96], [4, 98], [5, 97], [6, 98], [7, 97],
      [8, 98], [9, 96], [10, 97], [11, 98], [12, 97], [13, 98],
    ];
    for (const [d, v] of spo2Series) {
      readings.push({
        userId: ana.id, typeId: 'mt-spo2', value: v, systolic: null, diastolic: null,
        unit: '%', recordedAt: new Date(now - d * day), notes: null, tags: [],
      });
    }

    const tempSeries: Array<[number, number]> = [
      [0, 36.6], [3, 36.4], [6, 36.7], [9, 36.5], [12, 36.6],
    ];
    for (const [d, v] of tempSeries) {
      readings.push({
        userId: ana.id, typeId: 'mt-temp', value: v, systolic: null, diastolic: null,
        unit: '°C', recordedAt: new Date(now - d * day), notes: null, tags: ['noche'],
      });
    }

    for (const r of readings) {
      await this.readingRepository.save(this.readingRepository.create(r as any));
    }

    // Alertas demo: 2 pendientes para ana (FC 52 baja, TA 135 alta) + 1 revisada.
    const hr52 = await this.readingRepository.findOne({
      where: { userId: ana.id, typeId: 'mt-hr', value: 52 },
      order: { recordedAt: 'DESC' },
    });
    const bp135 = await this.readingRepository.findOne({
      where: { userId: ana.id, typeId: 'mt-bp', systolic: 135 },
      order: { recordedAt: 'DESC' },
    });
    const bp132 = await this.readingRepository.findOne({
      where: { userId: ana.id, typeId: 'mt-bp', systolic: 132 },
      order: { recordedAt: 'DESC' },
    });

    if (hr52) {
      await this.alertRepository.save(this.alertRepository.create({
        userId: ana.id, readingId: hr52.id, typeId: 'mt-hr',
        severity: 'low', message: 'Frecuencia cardíaca 52 bpm por debajo de 60',
      } as any));
    }
    if (bp135) {
      await this.alertRepository.save(this.alertRepository.create({
        userId: ana.id, readingId: bp135.id, typeId: 'mt-bp',
        severity: 'high', message: 'Tensión arterial 135 mmHg por encima de 125',
      } as any));
    }
    if (bp132) {
      await this.alertRepository.save(this.alertRepository.create({
        userId: ana.id, readingId: bp132.id, typeId: 'mt-bp',
        severity: 'high', message: 'Tensión arterial 132 mmHg por encima de 125',
        acknowledgedAt: new Date(now - 2 * day),
      } as any));
    }

    // Profesionales + cita para ana.
    const gomez = (await this.providerRepository.save(this.providerRepository.create({
      userId: ana.id, name: 'Dra. Laura Gómez', specialty: 'Cardiología',
      phone: '91 555 0123', email: 'lgomez@clinic.es', address: 'C/ Mayor 12, Madrid',
      notes: 'Revisión semestral',
    } as any))) as unknown as Provider;
    const ruiz = (await this.providerRepository.save(this.providerRepository.create({
      userId: ana.id, name: 'Dr. Javier Ruiz', specialty: 'Endocrinología',
      phone: '91 555 0456', email: 'jruiz@clinic.es', address: 'Av. Diagonal 88, Madrid',
      notes: null,
    } as any))) as unknown as Provider;

    await this.appointmentRepository.save(this.appointmentRepository.create({
      userId: ana.id, providerId: gomez.id,
      scheduledAt: new Date(now + 3 * day), reason: 'Revisión anual',
      notes: 'Llevar registro de 30 días', followUp: 'Repetir analítica en 6 meses',
    } as any));
    await this.appointmentRepository.save(this.appointmentRepository.create({
      userId: ana.id, providerId: ruiz.id,
      scheduledAt: new Date(now - 7 * day), reason: 'Analítica',
      notes: null, followUp: null,
    } as any));

    // marcos: 3 lecturas mínimas para que tenga dashboard con datos.
    await this.readingRepository.save(this.readingRepository.create({
      userId: marcos.id, typeId: 'mt-bp', value: null, systolic: 126, diastolic: 80,
      unit: 'mmHg', recordedAt: new Date(now - day), notes: null, tags: [],
    } as any));
    await this.readingRepository.save(this.readingRepository.create({
      userId: marcos.id, typeId: 'mt-hr', value: 64, systolic: null, diastolic: null,
      unit: 'bpm', recordedAt: new Date(now - day), notes: null, tags: [],
    } as any));
    await this.readingRepository.save(this.readingRepository.create({
      userId: marcos.id, typeId: 'mt-weight', value: 82.4, systolic: null, diastolic: null,
      unit: 'kg', recordedAt: new Date(now - 2 * day), notes: null, tags: [],
    } as any));
  }
}
