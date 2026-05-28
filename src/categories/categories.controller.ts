import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@ApiTags('Kategori')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Membuat kategori baru (khusus admin)' })
  @ApiCreatedResponse({ description: 'Kategori berhasil dibuat.' })
  @ApiUnauthorizedResponse({ description: 'Autentikasi diperlukan.' })
  @ApiForbiddenResponse({ description: 'Endpoint ini hanya dapat diakses oleh admin.' })
  create(@Body() createCategoryDto: CreateCategoryDto) {
    return this.categoriesService.create(createCategoryDto);
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'Mengambil semua kategori' })
  @ApiOkResponse({ description: 'Daftar kategori berhasil diambil.' })
  findAll() {
    return this.categoriesService.findAll();
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Mengambil detail kategori berdasarkan ID' })
  @ApiParam({ name: 'id', type: Number, description: 'ID kategori' })
  @ApiOkResponse({ description: 'Detail kategori berhasil diambil.' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.categoriesService.findOne(id);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Mengubah kategori (khusus admin)' })
  @ApiParam({ name: 'id', type: Number, description: 'ID kategori' })
  @ApiOkResponse({ description: 'Kategori berhasil diubah.' })
  @ApiUnauthorizedResponse({ description: 'Autentikasi diperlukan.' })
  @ApiForbiddenResponse({ description: 'Endpoint ini hanya dapat diakses oleh admin.' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCategoryDto: UpdateCategoryDto
  ) {
    return this.categoriesService.update(id, updateCategoryDto);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Menghapus kategori (khusus admin)' })
  @ApiParam({ name: 'id', type: Number, description: 'ID kategori' })
  @ApiOkResponse({ description: 'Kategori berhasil dihapus.' })
  @ApiUnauthorizedResponse({ description: 'Autentikasi diperlukan.' })
  @ApiForbiddenResponse({ description: 'Endpoint ini hanya dapat diakses oleh admin.' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.categoriesService.remove(id);
  }
}
