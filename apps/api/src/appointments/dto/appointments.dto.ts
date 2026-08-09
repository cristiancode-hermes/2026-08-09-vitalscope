import {
  IsDateString,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAppointmentDto {
  @ApiProperty({ example: 'uuid-del-provider' })
  @IsUUID()
  providerId: string;

  @ApiProperty({ example: '2026-08-12T10:30:00.000Z' })
  @IsDateString()
  scheduledAt: string;

  @ApiPropertyOptional({ example: 'Revisión anual' })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  reason?: string;

  @ApiPropertyOptional({ example: 'Llevar registro de 30 días' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ example: 'Repetir analítica en 6 meses' })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  followUp?: string;
}

export class UpdateAppointmentDto {
  @ApiPropertyOptional({ example: '2026-08-12T10:30:00.000Z' })
  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @ApiPropertyOptional({ example: 'Revisión anual' })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  reason?: string;

  @ApiPropertyOptional({ example: 'Llevar registro de 30 días' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ example: 'Repetir analítica en 6 meses' })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  followUp?: string;
}
