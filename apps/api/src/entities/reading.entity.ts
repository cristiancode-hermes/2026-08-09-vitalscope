import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { MeasurementType } from './measurement-type.entity';

@Entity('readings')
export class Reading {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => MeasurementType, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'type_id' })
  type: MeasurementType;

  @Column({ name: 'type_id', length: 40 })
  typeId: string;

  @Column({
    type: 'numeric',
    precision: 8,
    scale: 2,
    nullable: true,
    transformer: {
      to: (v: number | null) => v,
      from: (v: string | null) => (v === null || v === undefined ? null : parseFloat(v)),
    },
  })
  value: number | null;

  @Column({
    type: 'numeric',
    precision: 8,
    scale: 2,
    nullable: true,
    transformer: {
      to: (v: number | null) => v,
      from: (v: string | null) => (v === null || v === undefined ? null : parseFloat(v)),
    },
  })
  systolic: number | null;

  @Column({
    type: 'numeric',
    precision: 8,
    scale: 2,
    nullable: true,
    transformer: {
      to: (v: number | null) => v,
      from: (v: string | null) => (v === null || v === undefined ? null : parseFloat(v)),
    },
  })
  diastolic: number | null;

  @Column({ length: 20 })
  unit: string;

  @Column({ type: 'datetime', name: 'recorded_at' })
  recordedAt: Date;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ type: 'simple-json', default: () => "'[]'" })
  tags: string[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
