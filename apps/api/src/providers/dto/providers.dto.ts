import {
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProviderDto {
  @ApiProperty({ example: 'Dra. Laura Gómez' })
  @IsString()
  @MaxLength(120)
  name: string;

  @ApiPropertyOptional({ example: 'Cardiología' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  specialty?: string;

  @ApiPropertyOptional({ example: '91 555 0123' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @ApiPropertyOptional({ example: 'lgomez@clinic.es' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: 'C/ Mayor 12, Madrid' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  address?: string;

  @ApiPropertyOptional({ example: 'Revisión semestral' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateProviderDto {
  @ApiPropertyOptional({ example: 'Dra. Laura Gómez' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @ApiPropertyOptional({ example: 'Cardiología' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  specialty?: string;

  @ApiPropertyOptional({ example: '91 555 0123' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @ApiPropertyOptional({ example: 'lgomez@clinic.es' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: 'C/ Mayor 12, Madrid' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  address?: string;

  @ApiPropertyOptional({ example: 'Revisión semestral' })
  @IsOptional()
  @IsString()
  notes?: string;
}
