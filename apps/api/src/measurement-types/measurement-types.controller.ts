import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { MeasurementTypesService } from './measurement-types.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('measurement-types')
@Controller('measurement-types')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MeasurementTypesController {
  constructor(private readonly typesService: MeasurementTypesService) {}

  @Get()
  findAll() {
    return this.typesService.findAll();
  }
}
