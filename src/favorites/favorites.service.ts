import {
  ConflictException,
  Injectable,
  NotFoundException
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FavoritesService {
  private readonly favoriteInclude = {
    recipe: {
      include: {
        category: true,
        _count: {
          select: {
            favorites: true,
            reviews: true
          }
        }
      }
    }
  } as const;

  constructor(private readonly prisma: PrismaService) {}

  async findMyFavorites(userId: number) {
    return this.prisma.favorite.findMany({
      where: { userId },
      include: this.favoriteInclude,
      orderBy: {
        createdAt: 'desc'
      }
    });
  }

  async addToFavorites(userId: number, recipeId: number) {
    return this.prisma.$transaction(async (tx) => {
      const recipe = await tx.recipe.findUnique({
        where: { id: recipeId },
        select: { id: true }
      });

      if (!recipe) {
        throw new NotFoundException('Recipe not found.');
      }

      const existingFavorite = await tx.favorite.findUnique({
        where: {
          userId_recipeId: {
            userId,
            recipeId
          }
        }
      });

      if (existingFavorite) {
        throw new ConflictException('Recipe is already in your favorites.');
      }

      return tx.favorite.create({
        data: {
          userId,
          recipeId
        },
        include: this.favoriteInclude
      });
    });
  }

  async removeFromFavorites(userId: number, recipeId: number) {
    return this.prisma.$transaction(async (tx) => {
      const favorite = await tx.favorite.findUnique({
        where: {
          userId_recipeId: {
            userId,
            recipeId
          }
        }
      });

      if (!favorite) {
        throw new NotFoundException('Favorite recipe not found in your list.');
      }

      await tx.favorite.delete({
        where: {
          userId_recipeId: {
            userId,
            recipeId
          }
        }
      });

      return {
        message: 'Recipe removed from favorites successfully.'
      };
    });
  }
}
