import {
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Body } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ProvidersService } from './providers.service';
import { CreateProviderDto, UpdateProviderDto } from './dto/providers.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@ApiTags('providers')
@Controller('providers')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ProvidersController {
  constructor(private readonly providersService: ProvidersService) {}

  @Get()
  findAll(@CurrentUser('id') userId: string) {
    return this.providersService.findAll(userId);
  }

  @Post()
  create(@CurrentUser('id') userId: string, @Body() dto: CreateProviderDto) {
    return this.providersService.create(userId, dto);
  }

  @Get(':id')
  findOne(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.providersService.findOne(userId, id);
  }

  @Patch(':id')
  update(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateProviderDto,
  ) {
    return this.providersService.update(userId, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.providersService.remove(userId, id);
  }
}
