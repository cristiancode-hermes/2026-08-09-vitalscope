import { IsIn, IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'ana' })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  username?: string;

  @ApiPropertyOptional({ example: 'ana@correo.es' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: 'metric', enum: ['metric', 'imperial'] })
  @IsOptional()
  @IsIn(['metric', 'imperial'])
  units?: string;

  @ApiPropertyOptional({ example: 'auto', enum: ['light', 'dark', 'auto'] })
  @IsOptional()
  @IsIn(['light', 'dark', 'auto'])
  theme?: string;
}
