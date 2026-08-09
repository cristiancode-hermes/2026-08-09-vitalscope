import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'ana' })
  @IsString()
  @MinLength(3)
  @MaxLength(40)
  username: string;

  @ApiProperty({ example: 'ana@correo.es' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password: string;
}
