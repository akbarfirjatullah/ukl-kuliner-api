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

@ApiTags('Favorites')
@ApiBearerAuth()
@Controller('favorites')
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Get()
  @ApiOperation({ summary: 'Get the logged-in user favorite recipes' })
  @ApiOkResponse({ description: 'Favorite recipes returned successfully.' })
  @ApiUnauthorizedResponse({ description: 'Authentication is required.' })
  findMyFavorites(@CurrentUser('userId') userId: number) {
    return this.favoritesService.findMyFavorites(userId);
  }

  @Post(':recipeId')
  @ApiOperation({ summary: 'Add a recipe to the logged-in user favorites' })
  @ApiParam({ name: 'recipeId', type: Number, description: 'Recipe ID' })
  @ApiCreatedResponse({ description: 'Recipe added to favorites successfully.' })
  @ApiConflictResponse({ description: 'Recipe is already in favorites.' })
  @ApiUnauthorizedResponse({ description: 'Authentication is required.' })
  addToFavorites(
    @CurrentUser('userId') userId: number,
    @Param('recipeId', ParseIntPipe) recipeId: number
  ) {
    return this.favoritesService.addToFavorites(userId, recipeId);
  }

  @Delete(':recipeId')
  @ApiOperation({ summary: 'Remove a recipe from the logged-in user favorites' })
  @ApiParam({ name: 'recipeId', type: Number, description: 'Recipe ID' })
  @ApiOkResponse({ description: 'Recipe removed from favorites successfully.' })
  @ApiUnauthorizedResponse({ description: 'Authentication is required.' })
  removeFromFavorites(
    @CurrentUser('userId') userId: number,
    @Param('recipeId', ParseIntPipe) recipeId: number
  ) {
    return this.favoritesService.removeFromFavorites(userId, recipeId);
  }
}
