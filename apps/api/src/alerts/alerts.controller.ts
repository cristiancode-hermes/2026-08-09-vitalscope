import { Controller, Delete, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AlertsService } from './alerts.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@ApiTags('alerts')
@Controller('alerts')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AlertsController {
  constructor(private readonly alertsService: AlertsService) {}

  @Get('count')
  count(@CurrentUser('id') userId: string) {
    return this.alertsService.pendingCount(userId);
  }

  @Get()
  findAll(
    @CurrentUser('id') userId: string,
    @Query('acknowledged') acknowledged?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.alertsService.findAll(userId, { acknowledged, page, limit });
  }

  @Get(':id')
  findOne(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.alertsService.findOne(userId, id);
  }

  @Patch(':id/ack')
  acknowledge(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.alertsService.acknowledge(userId, id);
  }

  @Delete(':id')
  remove(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.alertsService.remove(userId, id);
  }
}
