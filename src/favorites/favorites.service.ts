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
        throw new NotFoundException('Resep tidak ditemukan.');
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
        throw new ConflictException('Resep sudah ada di daftar favorit Anda.');
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
        throw new NotFoundException('Resep favorit tidak ditemukan di daftar Anda.');
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
        message: 'Resep berhasil dihapus dari favorit.'
      };
    });
  }
}
