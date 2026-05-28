import { Controller, Delete, Get, Param, ParseIntPipe, Post } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse
} from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { FavoritesService } from './favorites.service';

@ApiTags('Favorit')
@ApiBearerAuth()
@Controller('favorites')
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Get()
  @ApiOperation({ summary: 'Mengambil daftar resep favorit pengguna yang sedang login' })
  @ApiOkResponse({ description: 'Daftar resep favorit berhasil diambil.' })
  @ApiUnauthorizedResponse({ description: 'Autentikasi diperlukan.' })
  findMyFavorites(@CurrentUser('userId') userId: number) {
    return this.favoritesService.findMyFavorites(userId);
  }

  @Post(':recipeId')
  @ApiOperation({ summary: 'Menambahkan resep ke favorit pengguna yang sedang login' })
  @ApiParam({ name: 'recipeId', type: Number, description: 'ID resep' })
  @ApiCreatedResponse({ description: 'Resep berhasil ditambahkan ke favorit.' })
  @ApiConflictResponse({ description: 'Resep sudah ada di favorit.' })
  @ApiUnauthorizedResponse({ description: 'Autentikasi diperlukan.' })
  addToFavorites(
    @CurrentUser('userId') userId: number,
    @Param('recipeId', ParseIntPipe) recipeId: number
  ) {
    return this.favoritesService.addToFavorites(userId, recipeId);
  }

  @Delete(':recipeId')
  @ApiOperation({ summary: 'Menghapus resep dari favorit pengguna yang sedang login' })
  @ApiParam({ name: 'recipeId', type: Number, description: 'ID resep' })
  @ApiOkResponse({ description: 'Resep berhasil dihapus dari favorit.' })
  @ApiUnauthorizedResponse({ description: 'Autentikasi diperlukan.' })
  removeFromFavorites(
    @CurrentUser('userId') userId: number,
    @Param('recipeId', ParseIntPipe) recipeId: number
  ) {
    return this.favoritesService.removeFromFavorites(userId, recipeId);
  }
}
