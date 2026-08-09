import type { Reading, ReadingStatus } from '../models/models';

/** Evaluación de estado en cliente: usa los límites por defecto del tipo. */
export class RangeEvaluatorClient {
  static status(r: Reading): ReadingStatus {
    const type = r.type;
    if (!type) return 'ok';
    const v = type.category === 'blood_pressure' ? r.systolic : r.value;
    if (v === null || v === undefined) return 'ok';
    if (v < type.defaultMin) return 'low';
    if (v > type.defaultMax) {
      const deviation = (v - type.defaultMax) / type.defaultMax;
      return deviation > 0.2 ? 'critical' : 'high';
    }
    if (type.category === 'blood_pressure' && r.diastolic !== null) {
      const dMax = type.defaultMax - 10;
      if (r.diastolic > dMax) return 'high';
    }
    return 'ok';
  }
}
