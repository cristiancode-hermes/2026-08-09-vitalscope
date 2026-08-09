import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Reading } from './reading.entity';
import { MeasurementType } from './measurement-type.entity';

@Entity('alerts')
export class Alert {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => Reading, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'reading_id' })
  reading: Reading;

  @Column({ name: 'reading_id' })
  readingId: string;

  @ManyToOne(() => MeasurementType, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'type_id' })
  type: MeasurementType;

  @Column({ name: 'type_id', length: 40 })
  typeId: string;

  @Column({ length: 10 })
  severity: 'high' | 'low' | 'critical';

  @Column({ length: 255 })
  message: string;

  @Column({ type: 'datetime', name: 'acknowledged_at', nullable: true })
  acknowledgedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;
}
