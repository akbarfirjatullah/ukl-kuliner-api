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

@ApiTags('Reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get the logged-in user reviews' })
  @ApiOkResponse({ description: 'User reviews returned successfully.' })
  @ApiUnauthorizedResponse({ description: 'Authentication is required.' })
  findMyReviews(@CurrentUser('userId') userId: number) {
    return this.reviewsService.findMyReviews(userId);
  }

  @Public()
  @Get('recipe/:recipeId')
  @ApiOperation({ summary: 'Get all reviews for a recipe' })
  @ApiParam({ name: 'recipeId', type: Number, description: 'Recipe ID' })
  @ApiOkResponse({ description: 'Recipe reviews returned successfully.' })
  findByRecipe(@Param('recipeId', ParseIntPipe) recipeId: number) {
    return this.reviewsService.findByRecipe(recipeId);
  }

  @Post('recipe/:recipeId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a review for a recipe' })
  @ApiParam({ name: 'recipeId', type: Number, description: 'Recipe ID' })
  @ApiCreatedResponse({ description: 'Review created successfully.' })
  @ApiConflictResponse({ description: 'User has already reviewed this recipe.' })
  @ApiUnauthorizedResponse({ description: 'Authentication is required.' })
  create(
    @CurrentUser('userId') userId: number,
    @Param('recipeId', ParseIntPipe) recipeId: number,
    @Body() createReviewDto: CreateReviewDto
  ) {
    return this.reviewsService.create(userId, recipeId, createReviewDto);
  }

  @Patch('recipe/:recipeId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update the logged-in user review for a recipe' })
  @ApiParam({ name: 'recipeId', type: Number, description: 'Recipe ID' })
  @ApiOkResponse({ description: 'Review updated successfully.' })
  @ApiUnauthorizedResponse({ description: 'Authentication is required.' })
  update(
    @CurrentUser('userId') userId: number,
    @Param('recipeId', ParseIntPipe) recipeId: number,
    @Body() updateReviewDto: UpdateReviewDto
  ) {
    return this.reviewsService.update(userId, recipeId, updateReviewDto);
  }

  @Delete('recipe/:recipeId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete the logged-in user review for a recipe' })
  @ApiParam({ name: 'recipeId', type: Number, description: 'Recipe ID' })
  @ApiOkResponse({ description: 'Review deleted successfully.' })
  @ApiUnauthorizedResponse({ description: 'Authentication is required.' })
  remove(
    @CurrentUser('userId') userId: number,
    @Param('recipeId', ParseIntPipe) recipeId: number
  ) {
    return this.reviewsService.remove(userId, recipeId);
  }
}
