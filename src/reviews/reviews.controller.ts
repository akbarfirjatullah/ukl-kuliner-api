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
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse
} from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { ReviewsService } from './reviews.service';

@ApiTags('Ulasan')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mengambil ulasan pengguna yang sedang login' })
  @ApiOkResponse({ description: 'Daftar ulasan pengguna berhasil diambil.' })
  @ApiUnauthorizedResponse({ description: 'Autentikasi diperlukan.' })
  findMyReviews(@CurrentUser('userId') userId: number) {
    return this.reviewsService.findMyReviews(userId);
  }

  @Public()
  @Get('recipe/:recipeId')
  @ApiOperation({ summary: 'Mengambil semua ulasan untuk sebuah resep' })
  @ApiParam({ name: 'recipeId', type: Number, description: 'ID resep' })
  @ApiOkResponse({ description: 'Daftar ulasan resep berhasil diambil.' })
  findByRecipe(@Param('recipeId', ParseIntPipe) recipeId: number) {
    return this.reviewsService.findByRecipe(recipeId);
  }

  @Post('recipe/:recipeId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Membuat ulasan untuk sebuah resep' })
  @ApiParam({ name: 'recipeId', type: Number, description: 'ID resep' })
  @ApiCreatedResponse({ description: 'Ulasan berhasil dibuat.' })
  @ApiConflictResponse({ description: 'Pengguna sudah memberikan ulasan untuk resep ini.' })
  @ApiUnauthorizedResponse({ description: 'Autentikasi diperlukan.' })
  create(
    @CurrentUser('userId') userId: number,
    @Param('recipeId', ParseIntPipe) recipeId: number,
    @Body() createReviewDto: CreateReviewDto
  ) {
    return this.reviewsService.create(userId, recipeId, createReviewDto);
  }

  @Patch('recipe/:recipeId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mengubah ulasan pengguna yang sedang login untuk sebuah resep' })
  @ApiParam({ name: 'recipeId', type: Number, description: 'ID resep' })
  @ApiOkResponse({ description: 'Ulasan berhasil diubah.' })
  @ApiUnauthorizedResponse({ description: 'Autentikasi diperlukan.' })
  update(
    @CurrentUser('userId') userId: number,
    @Param('recipeId', ParseIntPipe) recipeId: number,
    @Body() updateReviewDto: UpdateReviewDto
  ) {
    return this.reviewsService.update(userId, recipeId, updateReviewDto);
  }

  @Delete('recipe/:recipeId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Menghapus ulasan pengguna yang sedang login untuk sebuah resep' })
  @ApiParam({ name: 'recipeId', type: Number, description: 'ID resep' })
  @ApiOkResponse({ description: 'Ulasan berhasil dihapus.' })
  @ApiUnauthorizedResponse({ description: 'Autentikasi diperlukan.' })
  remove(
    @CurrentUser('userId') userId: number,
    @Param('recipeId', ParseIntPipe) recipeId: number
  ) {
    return this.reviewsService.remove(userId, recipeId);
  }
}
