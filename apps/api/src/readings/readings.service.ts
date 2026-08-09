import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { Reading } from '../entities/reading.entity';
import { MeasurementType } from '../entities/measurement-type.entity';
import { TargetRange } from '../entities/target-range.entity';
import { Alert } from '../entities/alert.entity';
import { User } from '../entities/user.entity';
import { CreateReadingDto, UpdateReadingDto } from './dto/readings.dto';
import { MeasurementTypesService } from '../measurement-types/measurement-types.service';

export type ReadingStatus = 'ok' | 'high' | 'low' | 'critical';

export interface RangeResolution {
  min: number;
  max: number;
  diastolicMax: number;
}

export interface EvaluatedAlert {
  severity: 'high' | 'low' | 'critical';
  message: string;
}

/**
 * Lógica de evaluación de rango y generación de alertas.
 * Compartida entre ReadingsService y las specs.
 */
export class RangeEvaluator {
  /** Resuelve el rango efectivo: TargetRange del usuario si existe, si no default del tipo. */
  static resolveRange(
    type: MeasurementType,
    custom?: TargetRange | null,
  ): RangeResolution {
    const min = custom ? custom.min : type.defaultMin;
    const max = custom ? custom.max : type.defaultMax;
    // Para BP la diastólica deriva del límite sistólico (spec: max - 10).
    const diastolicMax = max - 10;
    return { min, max, diastolicMax };
  }

  /** Evalúa una lectura contra el rango. Devuelve null si está dentro. */
  static evaluate(
    reading: Pick<Reading, 'value' | 'systolic' | 'diastolic'>,
    type: MeasurementType,
    custom?: TargetRange | null,
    typeLabel?: string,
  ): EvaluatedAlert | null {
    const range = this.resolveRange(type, custom);
    const isBp = type.category === 'blood_pressure';

    const value = isBp ? reading.systolic : reading.value;
    if (value === null || value === undefined) return null;

    const label = typeLabel || type.label;
    const unit = type.unit;

    if (value < range.min) {
      const deviation = (range.min - value) / range.max;
      const severity = deviation > 0.2 ? 'critical' : 'low';
      return {
        severity,
        message: `${label} ${value} ${unit} por debajo de ${range.min}`,
      };
    }
    if (value > range.max) {
      const deviation = (value - range.max) / range.max;
      const severity = deviation > 0.2 ? 'critical' : 'high';
      return {
        severity,
        message: `${label} ${value} ${unit} por encima de ${range.max}`,
      };
    }

    // BP: evaluar también la diastólica contra su límite derivado.
    if (isBp && reading.diastolic !== null && reading.diastolic !== undefined) {
      const dMax = range.diastolicMax;
      const dMin = range.min - 10;
      if (reading.diastolic > dMax) {
        const deviation = (reading.diastolic - dMax) / dMax;
        const severity = deviation > 0.2 ? 'critical' : 'high';
        return {
          severity,
          message: `Diastólica ${reading.diastolic} ${unit} por encima de ${dMax}`,
        };
      }
      if (reading.diastolic < dMin) {
        const deviation = (dMin - reading.diastolic) / dMax;
        const severity = deviation > 0.2 ? 'critical' : 'low';
        return {
          severity,
          message: `Diastólica ${reading.diastolic} ${unit} por debajo de ${dMin}`,
        };
      }
    }

    return null;
  }

  /** Badge de estado de una lectura (ok/high/low/critical). */
  static status(
    reading: Pick<Reading, 'value' | 'systolic' | 'diastolic'>,
    type: MeasurementType,
    custom?: TargetRange | null,
  ): ReadingStatus {
    const result = this.evaluate(reading, type, custom);
    return result ? (result.severity === 'low' ? 'low' : result.severity === 'high' ? 'high' : 'critical') : 'ok';
  }
}

@Injectable()
export class ReadingsService {
  constructor(
    @InjectRepository(Reading)
    private readingRepository: Repository<Reading>,
    @InjectRepository(TargetRange)
    private rangeRepository: Repository<TargetRange>,
    @InjectRepository(Alert)
    private alertRepository: Repository<Alert>,
    @InjectRepository(MeasurementType)
    private typeRepository: Repository<MeasurementType>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private typesService: MeasurementTypesService,
  ) {}

  /** Crea una lectura y genera alerta si queda fuera de rango. */
  async create(userId: string, dto: CreateReadingDto) {
    const type = await this.requireType(dto.typeId);
    this.assertShape(type, dto);

    const unit = dto.unit || type.unit;
    const recordedAt = dto.recordedAt ? new Date(dto.recordedAt) : new Date();

    const reading = this.readingRepository.create({
      userId,
      typeId: type.id,
      value: dto.value ?? null,
      systolic: dto.systolic ?? null,
      diastolic: dto.diastolic ?? null,
      unit,
      recordedAt,
      notes: dto.notes ?? null,
      tags: dto.tags ?? [],
    } as any);
    const saved = (await this.readingRepository.save(reading)) as unknown as Reading;

    const alert = await this.evaluateAndAlert(userId, saved);
    return { reading: saved, alert };
  }

  /** Listado paginado con filtros tipo/fechas/tag. */
  async findAll(
    userId: string,
    query: {
      type?: string;
      from?: string;
      to?: string;
      tag?: string;
      page?: string;
      limit?: string;
    },
  ) {
    const page = Math.max(1, parseInt(query.page || '1', 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit || '20', 10) || 20));

    const qb = this.readingRepository
      .createQueryBuilder('r')
      .leftJoinAndSelect('r.type', 'type')
      .where('r.user_id = :userId', { userId });

    if (query.type) {
      qb.andWhere('r.type_id = :typeId', { typeId: query.type });
    }
    if (query.from) {
      qb.andWhere('r.recorded_at >= :from', { from: new Date(query.from) });
    }
    if (query.to) {
      qb.andWhere('r.recorded_at <= :to', { to: new Date(query.to) });
    }
    if (query.tag) {
      qb.andWhere('r.tags LIKE :tag', { tag: `%"${query.tag}"%` });
    }

    const [items, total] = await qb
      .orderBy('r.recorded_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { items, total, page, limit };
  }

  /** Dashboard: última lectura por tipo + alertas pendientes + recientes. */
  async dashboard(userId: string) {
    const types = await this.typesService.findAll();

    const latestRaw = await this.readingRepository
      .createQueryBuilder('r')
      .leftJoinAndSelect('r.type', 'type')
      .where('r.user_id = :userId', { userId })
      .orderBy('r.recorded_at', 'DESC')
      .getMany();

    const latest = [];
    for (const type of types) {
      const readings = latestRaw.filter((r) => r.typeId === type.id);
      const last = readings[0] ?? null;
      const custom = await this.rangeRepository.findOne({
        where: { userId, typeId: type.id },
      });
      const spark = readings
        .slice(0, 7)
        .map((r) => (type.category === 'blood_pressure' ? r.systolic : r.value))
        .filter((v): v is number => v !== null && v !== undefined)
        .reverse();
      latest.push({
        type,
        reading: last,
        status: last ? RangeEvaluator.status(last, type, custom) : null,
        rangeMin: custom ? custom.min : type.defaultMin,
        rangeMax: custom ? custom.max : type.defaultMax,
        sparkline: spark,
      });
    }

    const pendingAlerts = await this.alertRepository.count({
      where: { userId, acknowledgedAt: IsNull() },
    });

    const recent = await this.readingRepository
      .createQueryBuilder('r')
      .leftJoinAndSelect('r.type', 'type')
      .where('r.user_id = :userId', { userId })
      .orderBy('r.recorded_at', 'DESC')
      .take(5)
      .getMany();

    return { latest, pendingAlerts, recent };
  }

  /** Tendencias agregadas por día para 7/30/90 días. */
  async trends(
    userId: string,
    typeId: string,
    days: number,
  ) {
    const type = await this.requireType(typeId);
    const custom = await this.rangeRepository.findOne({
      where: { userId, typeId: type.id },
    });
    const range = RangeEvaluator.resolveRange(type, custom);

    const since = new Date();
    since.setDate(since.getDate() - days);
    since.setHours(0, 0, 0, 0);

    const rows = await this.readingRepository
      .createQueryBuilder('r')
      .select("date(r.recorded_at) AS day")
      .addSelect('AVG(r.value)', 'avg_value')
      .addSelect('AVG(r.systolic)', 'avg_systolic')
      .addSelect('AVG(r.diastolic)', 'avg_diastolic')
      .where('r.user_id = :userId', { userId })
      .andWhere('r.type_id = :typeId', { typeId: type.id })
      .andWhere('r.recorded_at >= :since', { since })
      .groupBy('day')
      .orderBy('day', 'ASC')
      .getRawMany<{
        day: string;
        avg_value: string | null;
        avg_systolic: string | null;
        avg_diastolic: string | null;
      }>();

    // Rellenar días vacíos (gap-fill) para que la línea sea continua.
    const seriesMap = new Map<string, { value: number | null; systolic: number | null; diastolic: number | null }>();
    for (const row of rows) {
      seriesMap.set(row.day, {
        value: row.avg_value === null ? null : parseFloat(row.avg_value),
        systolic: row.avg_systolic === null ? null : parseFloat(row.avg_systolic),
        diastolic: row.avg_diastolic === null ? null : parseFloat(row.avg_diastolic),
      });
    }

    const series: {
      day: string;
      value: number | null;
      systolic: number | null;
      diastolic: number | null;
    }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const existing = seriesMap.get(key);
      series.push({
        day: key,
        value: existing ? existing.value : null,
        systolic: existing ? existing.systolic : null,
        diastolic: existing ? existing.diastolic : null,
      });
    }

    // Media 7d para el chip.
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const avg7dRaw = await this.readingRepository
      .createQueryBuilder('r')
      .select('COALESCE(AVG(r.value), 0)', 'avg_value')
      .addSelect('COALESCE(AVG(r.systolic), 0)', 'avg_systolic')
      .addSelect('COALESCE(AVG(r.diastolic), 0)', 'avg_diastolic')
      .addSelect('COUNT(*)', 'total')
      .where('r.user_id = :userId', { userId })
      .andWhere('r.type_id = :typeId', { typeId: type.id })
      .andWhere('r.recorded_at >= :weekAgo', { weekAgo })
      .getRawOne<{ avg_value: string; avg_systolic: string; avg_diastolic: string; total: string }>();

    return {
      type: { id: type.id, key: type.key, label: type.label, unit: type.unit, category: type.category },
      series,
      avg7d: {
        value: avg7dRaw ? parseFloat(avg7dRaw.avg_value) : 0,
        systolic: avg7dRaw ? parseFloat(avg7dRaw.avg_systolic) : 0,
        diastolic: avg7dRaw ? parseFloat(avg7dRaw.avg_diastolic) : 0,
        total: avg7dRaw ? parseInt(avg7dRaw.total, 10) : 0,
      },
      range,
    };
  }

  /** Export CSV de todas las lecturas del usuario. */
  async exportCsv(userId: string): Promise<string> {
    const rows = await this.readingRepository
      .createQueryBuilder('r')
      .leftJoinAndSelect('r.type', 'type')
      .where('r.user_id = :userId', { userId })
      .orderBy('r.recorded_at', 'DESC')
      .getMany();

    const header = 'tipo,valor,sistolica,diastolica,unidad,fecha,nota,tags,estado';
    const lines = rows.map((r) => {
      const custom = null; // estado con rango default en el export
      const status = RangeEvaluator.status(r, r.type, custom);
      const fecha = r.recordedAt.toISOString();
      const nota = (r.notes || '').replace(/[",\n]/g, ' ');
      const tags = JSON.stringify(r.tags || []).replace(/"/g, "'");
      const value =
        r.type.category === 'blood_pressure'
          ? ''
          : r.value === null || r.value === undefined ? '' : r.value;
      const sistolica = r.systolic ?? '';
      const diastolica = r.diastolic ?? '';
      return `${r.type.label},${value},${sistolica},${diastolica},${r.unit},${fecha},${nota},${tags},${status}`;
    });

    return [header, ...lines].join('\n');
  }

  async findOne(userId: string, id: string) {
    const reading = await this.readingRepository.findOne({
      where: { id, userId },
      relations: { type: true },
    });
    if (!reading) {
      throw new NotFoundException('Lectura no encontrada');
    }
    return reading;
  }

  /** Actualiza una lectura, borra la alerta anterior y regenera. */
  async update(userId: string, id: string, dto: UpdateReadingDto) {
    const reading = await this.findOne(userId, id);

    if (dto.value !== undefined) reading.value = dto.value;
    if (dto.systolic !== undefined) reading.systolic = dto.systolic;
    if (dto.diastolic !== undefined) reading.diastolic = dto.diastolic;
    if (dto.notes !== undefined) reading.notes = dto.notes;
    if (dto.tags !== undefined) reading.tags = dto.tags;
    if (dto.recordedAt !== undefined) reading.recordedAt = new Date(dto.recordedAt);

    this.assertShape(reading.type, reading);
    const saved = await this.readingRepository.save(reading);

    // Recalcular alerta: borrar la anterior y regenerar.
    await this.alertRepository
      .createQueryBuilder()
      .delete()
      .where('reading_id = :id', { id: saved.id })
      .execute();

    const alert = await this.evaluateAndAlert(userId, saved);
    return { reading: saved, alert };
  }

  /** Borra lectura (las alertas asociadas caen por CASCADE). */
  async remove(userId: string, id: string) {
    const reading = await this.findOne(userId, id);
    await this.readingRepository.remove(reading);
    return { deleted: true };
  }

  /** Pending count (para badge del sidebar). */
  async pendingCount(userId: string): Promise<number> {
    const count = await this.alertRepository
      .createQueryBuilder('a')
      .where('a.user_id = :userId', { userId })
      .andWhere('a.acknowledged_at IS NULL')
      .getCount();
    return count;
  }

  /** Núcleo: evalúa la lectura contra el rango (custom ?? default) y crea la alerta. */
  private async evaluateAndAlert(
    userId: string,
    reading: Reading,
  ): Promise<Alert | null> {
    const type = reading.type ?? (await this.requireType(reading.typeId));
    const custom = await this.rangeRepository.findOne({
      where: { userId, typeId: type.id },
    });
    const result = RangeEvaluator.evaluate(reading, type, custom);
    if (!result) return null;

    const alert = this.alertRepository.create({
      userId,
      readingId: reading.id,
      typeId: type.id,
      severity: result.severity,
      message: result.message,
    } as any);
    const savedAlert = (await this.alertRepository.save(alert)) as unknown as Alert;
    return savedAlert;
  }

  private async requireType(typeId: string): Promise<MeasurementType> {
    const type = await this.typeRepository.findOne({ where: { id: typeId } });
    if (!type) {
      throw new BadRequestException('Tipo de medición desconocido');
    }
    return type;
  }

  /** Regla de integridad: BP → par sistólica/diastólica; single → value. */
  private assertShape(
    type: MeasurementType,
    dto: { value?: number | null; systolic?: number | null; diastolic?: number | null },
  ) {
    const isBp = type.category === 'blood_pressure';
    if (isBp) {
      if (dto.systolic === null || dto.systolic === undefined || dto.diastolic === null || dto.diastolic === undefined) {
        throw new BadRequestException('La tensión arterial requiere sistólica y diastólica');
      }
      if (dto.systolic < 40 || dto.systolic > 300 || dto.diastolic < 20 || dto.diastolic > 200) {
        throw new BadRequestException('Valores de tensión arterial fuera de rango plausible');
      }
    } else {
      if (dto.value === null || dto.value === undefined) {
        throw new BadRequestException('El valor es obligatorio para esta métrica');
      }
    }
  }
}
