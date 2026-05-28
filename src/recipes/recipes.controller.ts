import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { CreateRecipeDto } from './dto/create-recipe.dto';
import { ListRecipesQueryDto } from './dto/list-recipes-query.dto';
import { UpdateRecipeDto } from './dto/update-recipe.dto';
import { RecipesService } from './recipes.service';

@ApiTags('Resep')
@Controller('recipes')
export class RecipesController {
  constructor(private readonly recipesService: RecipesService) {}

  @Post()
  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Membuat resep baru (khusus admin)' })
  @ApiCreatedResponse({ description: 'Resep berhasil dibuat.' })
  @ApiUnauthorizedResponse({ description: 'Autentikasi diperlukan.' })
  @ApiForbiddenResponse({ description: 'Endpoint ini hanya dapat diakses oleh admin.' })
  create(
    @CurrentUser('userId') userId: number,
    @Body() createRecipeDto: CreateRecipeDto
  ) {
    return this.recipesService.create(userId, createRecipeDto);
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'Mengambil semua resep' })
  @ApiQuery({ name: 'search', required: false, description: 'Cari berdasarkan judul, deskripsi, atau bahan' })
  @ApiQuery({ name: 'categoryId', required: false, type: Number, description: 'Filter berdasarkan ID kategori' })
  @ApiOkResponse({ description: 'Daftar resep berhasil diambil.' })
  findAll(@Query() query: ListRecipesQueryDto) {
    return this.recipesService.findAll(query);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Mengambil detail resep berdasarkan ID' })
  @ApiParam({ name: 'id', type: Number, description: 'ID resep' })
  @ApiOkResponse({ description: 'Detail resep berhasil diambil.' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.recipesService.findOne(id);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Mengubah resep (khusus admin)' })
  @ApiParam({ name: 'id', type: Number, description: 'ID resep' })
  @ApiOkResponse({ description: 'Resep berhasil diubah.' })
  @ApiUnauthorizedResponse({ description: 'Autentikasi diperlukan.' })
  @ApiForbiddenResponse({ description: 'Endpoint ini hanya dapat diakses oleh admin.' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateRecipeDto: UpdateRecipeDto
  ) {
    return this.recipesService.update(id, updateRecipeDto);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Menghapus resep (khusus admin)' })
  @ApiParam({ name: 'id', type: Number, description: 'ID resep' })
  @ApiOkResponse({ description: 'Resep berhasil dihapus.' })
  @ApiUnauthorizedResponse({ description: 'Autentikasi diperlukan.' })
  @ApiForbiddenResponse({ description: 'Endpoint ini hanya dapat diakses oleh admin.' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.recipesService.remove(id);
  }
}
