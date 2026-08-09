import { Column, Entity, PrimaryColumn } from 'typeorm';

/**
 * Catálogo de métricas. IDs estables tipo 'mt-bp' (varchar) para que el seed
 * sea determinista en SQLite y Neon.
 */
@Entity('measurement_types')
export class MeasurementType {
  @PrimaryColumn({ length: 40 })
  id: string;

  @Column({ unique: true, length: 40 })
  key: string;

  @Column({ length: 60 })
  label: string;

  @Column({ length: 20 })
  unit: string;

  @Column({ length: 20 })
  category: string;

  @Column({
    type: 'numeric',
    precision: 8,
    scale: 2,
    name: 'default_min',
    transformer: {
      to: (v: number) => v,
      from: (v: string | null) => (v === null || v === undefined ? null : parseFloat(v)),
    },
  })
  defaultMin: number;

  @Column({
    type: 'numeric',
    precision: 8,
    scale: 2,
    name: 'default_max',
    transformer: {
      to: (v: number) => v,
      from: (v: string | null) => (v === null || v === undefined ? null : parseFloat(v)),
    },
  })
  defaultMax: number;

  @Column({ default: 'heart', length: 40 })
  icon: string;
}
