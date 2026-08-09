import { IsNumber, Max, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateRangeDto {
  @ApiProperty({ example: 110 })
  @IsNumber()
  @Min(0)
  @Max(500)
  min: number;

  @ApiProperty({ example: 130 })
  @IsNumber()
  @Min(0)
  @Max(500)
  max: number;
}
