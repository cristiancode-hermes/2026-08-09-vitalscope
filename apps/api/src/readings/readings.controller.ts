import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { ReadingsService } from './readings.service';
import { CreateReadingDto, ListReadingsQuery, UpdateReadingDto } from './dto/readings.dto';
import { Body } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@ApiTags('readings')
@Controller('readings')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ReadingsController {
  constructor(private readonly readingsService: ReadingsService) {}

  /** ⚠️ Orden: rutas fijas ANTES de :id */

  @Get('dashboard')
  dashboard(@CurrentUser('id') userId: string) {
    return this.readingsService.dashboard(userId);
  }

  @Get('trends')
  trends(
    @CurrentUser('id') userId: string,
    @Query('typeId') typeId: string,
    @Query('days') days?: string,
  ) {
    const parsedDays = Math.min(90, Math.max(1, parseInt(days || '7', 10) || 7));
    if (!typeId) {
      throw new BadRequestException('typeId es obligatorio');
    }
    return this.readingsService.trends(userId, typeId, parsedDays);
  }

  @Get('export')
  async exportCsv(@CurrentUser('id') userId: string, @Res() res: Response) {
    const csv = await this.readingsService.exportCsv(userId);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="vitalscope-lecturas-${new Date().toISOString().slice(0, 10)}.csv"`,
    );
    res.send(csv);
  }

  @Get()
  findAll(@CurrentUser('id') userId: string, @Query() query: ListReadingsQuery) {
    return this.readingsService.findAll(userId, query);
  }

  @Get(':id')
  findOne(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.readingsService.findOne(userId, id);
  }

  @Post()
  create(@CurrentUser('id') userId: string, @Body() dto: CreateReadingDto) {
    return this.readingsService.create(userId, dto);
  }

  @Patch(':id')
  update(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateReadingDto,
  ) {
    return this.readingsService.update(userId, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.readingsService.remove(userId, id);
  }
}
