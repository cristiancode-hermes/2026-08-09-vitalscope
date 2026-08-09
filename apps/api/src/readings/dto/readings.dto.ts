import {
  IsArray,
  IsDateString,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateReadingDto {
  @ApiProperty({ example: 'mt-hr', description: 'MeasurementType id (mt-bp, mt-hr, mt-weight, mt-glucose, mt-spo2, mt-temp)' })
  @IsString()
  typeId: string;

  @ApiPropertyOptional({ example: 72, description: 'Valor para métricas single. Null para BP.' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  value?: number;

  @ApiPropertyOptional({ example: 128, description: 'Sistólica, solo para BP.' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  systolic?: number;

  @ApiPropertyOptional({ example: 84, description: 'Diastólica, solo para BP.' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  diastolic?: number;

  @ApiPropertyOptional({ example: 'bpm', description: 'Unidad. Si falta, se usa la del tipo.' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  unit?: string;

  @ApiPropertyOptional({ example: '2026-08-09T08:12:00.000Z' })
  @IsOptional()
  @IsDateString()
  recordedAt?: string;

  @ApiPropertyOptional({ example: 'antes de cenar' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;

  @ApiPropertyOptional({ example: ['noche'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

export class UpdateReadingDto {
  @ApiPropertyOptional({ example: 75 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  value?: number;

  @ApiPropertyOptional({ example: 130 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  systolic?: number;

  @ApiPropertyOptional({ example: 82 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  diastolic?: number;

  @ApiPropertyOptional({ example: 'mañana en ayunas' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;

  @ApiPropertyOptional({ example: ['en-ayunas'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ example: '2026-08-09T08:12:00.000Z' })
  @IsOptional()
  @IsDateString()
  recordedAt?: string;
}

export class ListReadingsQuery {
  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;

  @IsOptional()
  @IsString()
  tag?: string;

  @IsOptional()
  @IsIn(['true', 'false'])
  acknowledged?: string;

  @IsOptional()
  page?: string;

  @IsOptional()
  limit?: string;
}
