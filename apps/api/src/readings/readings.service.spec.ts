import { BadRequestException } from '@nestjs/common';
import { ReadingsService, RangeEvaluator } from './readings.service';
import { MeasurementType } from '../entities/measurement-type.entity';
import { Reading } from '../entities/reading.entity';

const HR_TYPE: MeasurementType = {
  id: 'mt-hr',
  key: 'heart_rate',
  label: 'Frecuencia cardíaca',
  unit: 'bpm',
  category: 'single',
  defaultMin: 60,
  defaultMax: 100,
  icon: 'heart',
} as MeasurementType;

const BP_TYPE: MeasurementType = {
  id: 'mt-bp',
  key: 'blood_pressure',
  label: 'Tensión arterial',
  unit: 'mmHg',
  category: 'blood_pressure',
  defaultMin: 90,
  defaultMax: 130,
  icon: 'heart-pulse',
} as MeasurementType;

function makeReading(partial: Partial<Reading>): Reading {
  return {
    id: 'r-1',
    userId: 'u-1',
    typeId: 'mt-hr',
    value: null,
    systolic: null,
    diastolic: null,
    unit: 'bpm',
    recordedAt: new Date(),
    notes: null,
    tags: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...partial,
  } as Reading;
}

describe('RangeEvaluator', () => {
  describe('evaluate', () => {
    it('valor dentro de rango → sin alerta', () => {
      const result = RangeEvaluator.evaluate(makeReading({ value: 80 }), HR_TYPE);
      expect(result).toBeNull();
    });

    it('valor por debajo del mínimo → severidad low', () => {
      const result = RangeEvaluator.evaluate(makeReading({ value: 52 }), HR_TYPE);
      expect(result).toEqual(
        expect.objectContaining({ severity: 'low', message: expect.stringContaining('52') }),
      );
    });

    it('valor por encima del máximo con desviación ≤20% → severidad high', () => {
      const result = RangeEvaluator.evaluate(makeReading({ value: 118 }), HR_TYPE);
      expect(result?.severity).toBe('high');
    });

    it('valor por encima del máximo con desviación >20% → severidad critical', () => {
      const result = RangeEvaluator.evaluate(makeReading({ value: 125 }), HR_TYPE);
      expect(result?.severity).toBe('critical');
    });

    it('BP: sistólica sobre el límite → high', () => {
      const result = RangeEvaluator.evaluate(
        makeReading({ typeId: 'mt-bp', systolic: 138, diastolic: 84 }),
        BP_TYPE,
      );
      expect(result?.severity).toBe('high');
      expect(result?.message).toContain('138');
    });

    it('BP: diastólica sobre su límite derivado → high', () => {
      const result = RangeEvaluator.evaluate(
        makeReading({ typeId: 'mt-bp', systolic: 120, diastolic: 125 }),
        BP_TYPE,
      );
      expect(result?.severity).toBe('high');
      expect(result?.message).toContain('Diastólica');
    });

    it('usa el rango personalizado si existe', () => {
      const custom = { userId: 'u-1', typeId: 'mt-hr', min: 50, max: 55, updatedAt: new Date() } as any;
      const result = RangeEvaluator.evaluate(makeReading({ value: 60 }), HR_TYPE, custom);
      expect(result?.severity).toBe('high');
    });
  });

  describe('status', () => {
    it('mapea severidad a badge', () => {
      expect(RangeEvaluator.status(makeReading({ value: 80 }), HR_TYPE)).toBe('ok');
      expect(RangeEvaluator.status(makeReading({ value: 52 }), HR_TYPE)).toBe('low');
      expect(RangeEvaluator.status(makeReading({ value: 118 }), HR_TYPE)).toBe('high');
      expect(RangeEvaluator.status(makeReading({ value: 125 }), HR_TYPE)).toBe('critical');
    });
  });
});

describe('ReadingsService', () => {
  let service: ReadingsService;
  let readingRepo: any;
  let rangeRepo: any;
  let alertRepo: any;
  let typeRepo: any;
  let userRepo: any;
  let typesService: any;

  beforeEach(async () => {
    readingRepo = {
      create: jest.fn((d: any) => d),
      save: jest.fn(),
      findOne: jest.fn(),
      remove: jest.fn(),
      find: jest.fn(),
      createQueryBuilder: jest.fn(),
      count: jest.fn(),
    };
    rangeRepo = { findOne: jest.fn(), create: jest.fn((d: any) => d), save: jest.fn(), find: jest.fn() };
    alertRepo = { create: jest.fn((d: any) => d), save: jest.fn(), createQueryBuilder: jest.fn() };
    typeRepo = { findOne: jest.fn(), find: jest.fn() };
    userRepo = {};
    typesService = { findAll: jest.fn() };

    service = new ReadingsService(
      readingRepo as any,
      rangeRepo as any,
      alertRepo as any,
      typeRepo as any,
      userRepo as any,
      typesService as any,
    );
  });

  describe('create', () => {
    it('crea lectura single y NO genera alerta si está en rango', async () => {
      typeRepo.findOne.mockResolvedValue(HR_TYPE);
      rangeRepo.findOne.mockResolvedValue(null);
      readingRepo.save.mockResolvedValue(makeReading({ value: 80 }));
      alertRepo.save.mockResolvedValue(null);

      const result = await service.create('u-1', { typeId: 'mt-hr', value: 80 });

      expect(result.reading.value).toBe(80);
      expect(result.alert).toBeNull();
      expect(alertRepo.create).not.toHaveBeenCalled();
    });

    it('crea lectura y genera alerta low si está fuera de rango', async () => {
      typeRepo.findOne.mockResolvedValue(HR_TYPE);
      rangeRepo.findOne.mockResolvedValue(null);
      readingRepo.save.mockResolvedValue(makeReading({ value: 52 }));
      alertRepo.save.mockResolvedValue({ severity: 'low' } as any);

      const result = await service.create('u-1', { typeId: 'mt-hr', value: 52 });

      expect(result.alert).not.toBeNull();
      expect(result.alert.severity).toBe('low');
    });

    it('rechaza BP sin par sistólica/diastólica', async () => {
      typeRepo.findOne.mockResolvedValue(BP_TYPE);

      await expect(
        service.create('u-1', { typeId: 'mt-bp', systolic: 128 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rechaza single sin valor', async () => {
      typeRepo.findOne.mockResolvedValue(HR_TYPE);

      await expect(service.create('u-1', { typeId: 'mt-hr' })).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('update', () => {
    it('recálcula la alerta al editar el valor', async () => {
      const existing = makeReading({ value: 52, type: HR_TYPE });
      readingRepo.findOne.mockResolvedValue(existing);
      readingRepo.save.mockResolvedValue({ ...existing, value: 80 });
      alertRepo.createQueryBuilder.mockReturnValue({
        delete: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue({}),
      });
      rangeRepo.findOne.mockResolvedValue(null);
      alertRepo.save.mockResolvedValue(null);

      const result = await service.update('u-1', 'r-1', { value: 80 });

      expect(result.reading.value).toBe(80);
      expect(result.alert).toBeNull();
      expect(alertRepo.createQueryBuilder).toHaveBeenCalled();
    });
  });

  describe('exportCsv', () => {
    it('devuelve CSV con cabecera correcta', async () => {
      readingRepo.createQueryBuilder.mockReturnValue({
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([
          makeReading({ value: 80, type: HR_TYPE, recordedAt: new Date('2026-08-09T08:00:00Z') }),
        ]),
      });

      const csv = await service.exportCsv('u-1');

      const lines = csv.split('\n');
      expect(lines[0]).toBe('tipo,valor,sistolica,diastolica,unidad,fecha,nota,tags,estado');
      expect(lines[1]).toContain('Frecuencia cardíaca');
      expect(lines[1]).toContain('80');
      expect(lines[1]).toContain('ok');
    });
  });

  describe('pendingCount', () => {
    it('cuenta alertas sin ack', async () => {
      alertRepo.createQueryBuilder.mockReturnValue({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(2),
      });

      const count = await service.pendingCount('u-1');
      expect(count).toBe(2);
    });
  });
});
