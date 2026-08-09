import { Controller, Delete, Get, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Body, Param } from '@nestjs/common';
import { RangesService } from './ranges.service';
import { UpdateRangeDto } from './dto/update-range.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@ApiTags('ranges')
@Controller('ranges')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class RangesController {
  constructor(private readonly rangesService: RangesService) {}

  @Get()
  findAll(@CurrentUser('id') userId: string) {
    return this.rangesService.findAll(userId);
  }

  @Put(':typeId')
  upsert(
    @CurrentUser('id') userId: string,
    @Param('typeId') typeId: string,
    @Body() dto: UpdateRangeDto,
  ) {
    return this.rangesService.upsert(userId, typeId, dto);
  }

  @Delete(':typeId')
  remove(@CurrentUser('id') userId: string, @Param('typeId') typeId: string) {
    return this.rangesService.remove(userId, typeId);
  }
}
