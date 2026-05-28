import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { UsersService } from './users.service';

@ApiTags('Pengguna')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Mengambil profil pengguna yang sedang login' })
  @ApiOkResponse({ description: 'Profil pengguna berhasil diambil.' })
  @ApiUnauthorizedResponse({ description: 'Autentikasi diperlukan.' })
  findMe(@CurrentUser('userId') userId: number) {
    return this.usersService.findMe(userId);
  }

  @Get()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Mengambil semua pengguna (khusus admin)' })
  @ApiOkResponse({ description: 'Daftar pengguna berhasil diambil.' })
  @ApiUnauthorizedResponse({ description: 'Autentikasi diperlukan.' })
  @ApiForbiddenResponse({ description: 'Endpoint ini hanya dapat diakses oleh admin.' })
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Mengambil detail pengguna berdasarkan ID (khusus admin)' })
  @ApiParam({ name: 'id', type: Number, description: 'ID pengguna' })
  @ApiOkResponse({ description: 'Detail pengguna berhasil diambil.' })
  @ApiUnauthorizedResponse({ description: 'Autentikasi diperlukan.' })
  @ApiForbiddenResponse({ description: 'Endpoint ini hanya dapat diakses oleh admin.' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findOneById(id);
  }
}
