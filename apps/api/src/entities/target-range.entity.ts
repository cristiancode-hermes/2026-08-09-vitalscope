import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { User } from './user.entity';
import { MeasurementType } from './measurement-type.entity';

/**
 * Override del rango objetivo por usuario. PK compuesta (userId, typeId).
 * Para BP, min/max se refieren a la SISTÓLICA; la diastólica se deriva
 * (diastolicMax = max - 10) en el servicio.
 */
@Entity('target_ranges')
export class TargetRange {
  @PrimaryColumn({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @PrimaryColumn({ name: 'type_id', length: 40 })
  typeId: string;

  @ManyToOne(() => MeasurementType, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'type_id' })
  type: MeasurementType;

  @Column({
    type: 'numeric',
    precision: 8,
    scale: 2,
    transformer: {
      to: (v: number) => v,
      from: (v: string | null) => (v === null || v === undefined ? null : parseFloat(v)),
    },
  })
  min: number;

  @Column({
    type: 'numeric',
    precision: 8,
    scale: 2,
    transformer: {
      to: (v: number) => v,
      from: (v: string | null) => (v === null || v === undefined ? null : parseFloat(v)),
    },
  })
  max: number;

  @Column({ type: 'datetime', name: 'updated_at' })
  updatedAt: Date;
}
