import {
  ConflictException,
  Injectable,
  NotFoundException
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';

@Injectable()
export class ReviewsService {
  private readonly reviewInclude = {
    user: {
      select: {
        id: true,
        name: true,
        email: true
      }
    }
  } as const;

  constructor(private readonly prisma: PrismaService) {}

  async findByRecipe(recipeId: number) {
    await this.ensureRecipeExists(recipeId);

    return this.prisma.review.findMany({
      where: { recipeId },
      include: this.reviewInclude,
      orderBy: {
        createdAt: 'desc'
      }
    });
  }

  async findMyReviews(userId: number) {
    return this.prisma.review.findMany({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        recipe: {
          select: {
            id: true,
            title: true,
            slug: true,
            averageRating: true,
            category: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }

  async create(userId: number, recipeId: number, createReviewDto: CreateReviewDto) {
    return this.prisma.$transaction(async (tx) => {
      const recipe = await tx.recipe.findUnique({
        where: { id: recipeId },
        select: { id: true }
      });

      if (!recipe) {
        throw new NotFoundException('Resep tidak ditemukan.');
      }

      const existingReview = await tx.review.findUnique({
        where: {
          userId_recipeId: {
            userId,
            recipeId
          }
        }
      });

      if (existingReview) {
        throw new ConflictException('Anda sudah memberikan ulasan untuk resep ini.');
      }

      const review = await tx.review.create({
        data: {
          userId,
          recipeId,
          rating: createReviewDto.rating,
          comment: createReviewDto.comment
        },
        include: this.reviewInclude
      });

      await this.updateRecipeRatingSummary(tx, recipeId);

      return review;
    });
  }

  async update(userId: number, recipeId: number, updateReviewDto: UpdateReviewDto) {
    return this.prisma.$transaction(async (tx) => {
      const existingReview = await tx.review.findUnique({
        where: {
          userId_recipeId: {
            userId,
            recipeId
          }
        }
      });

      if (!existingReview) {
        throw new NotFoundException('Ulasan untuk resep ini tidak ditemukan.');
      }

      const updatedReview = await tx.review.update({
        where: {
          userId_recipeId: {
            userId,
            recipeId
          }
        },
        data: {
          rating: updateReviewDto.rating,
          comment: updateReviewDto.comment
        },
        include: this.reviewInclude
      });

      await this.updateRecipeRatingSummary(tx, recipeId);

      return updatedReview;
    });
  }

  async remove(userId: number, recipeId: number) {
    return this.prisma.$transaction(async (tx) => {
      const existingReview = await tx.review.findUnique({
        where: {
          userId_recipeId: {
            userId,
            recipeId
          }
        }
      });

      if (!existingReview) {
        throw new NotFoundException('Ulasan untuk resep ini tidak ditemukan.');
      }

      await tx.review.delete({
        where: {
          userId_recipeId: {
            userId,
            recipeId
          }
        }
      });

      await this.updateRecipeRatingSummary(tx, recipeId);

      return {
        message: 'Ulasan berhasil dihapus.'
      };
    });
  }

  private async ensureRecipeExists(recipeId: number) {
    const recipe = await this.prisma.recipe.findUnique({
      where: { id: recipeId },
      select: { id: true }
    });

    if (!recipe) {
      throw new NotFoundException('Resep tidak ditemukan.');
    }
  }

  private async updateRecipeRatingSummary(tx: Prisma.TransactionClient, recipeId: number) {
    const aggregate = await tx.review.aggregate({
      where: { recipeId },
      _avg: {
        rating: true
      },
      _count: {
        _all: true
      }
    });

    const averageRating = Number((aggregate._avg.rating ?? 0).toFixed(2));

    await tx.recipe.update({
      where: { id: recipeId },
      data: {
        averageRating,
        ratingCount: aggregate._count._all
      }
    });
  }
}
