import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRecipeDto } from './dto/create-recipe.dto';
import { ListRecipesQueryDto } from './dto/list-recipes-query.dto';
import { UpdateRecipeDto } from './dto/update-recipe.dto';

type RecipePayload = {
  title?: string;
  description?: string;
  ingredients?: string;
  instructions?: string;
  imageUrl?: string;
  prepTimeMinutes?: number;
  cookTimeMinutes?: number;
  cookingTime?: number;
  difficulty?: string;
  servings?: number;
};

@Injectable()
export class RecipesService {
  private readonly recipeInclude = {
    category: true,
    createdBy: {
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      }
    },
    _count: {
      select: {
        favorites: true,
        reviews: true
      }
    }
  } as const;

  constructor(private readonly prisma: PrismaService) {}

  async create(createdById: number, createRecipeDto: CreateRecipeDto) {
    await this.ensureCategoryExists(createRecipeDto.categoryId);
    const slug = await this.generateUniqueSlug(createRecipeDto.title);
    const recipeData = this.buildCreateRecipeData(createRecipeDto);

    return this.prisma.recipe.create({
      data: {
        ...recipeData,
        slug,
        createdById,
        categoryId: createRecipeDto.categoryId
      },
      include: this.recipeInclude
    }).then((recipe) => this.withCookingTime(recipe));
  }

  async findAll(query: ListRecipesQueryDto) {
    const where: Prisma.RecipeWhereInput = {};

    if (query.search) {
      where.OR = [
        { title: { contains: query.search } },
        { description: { contains: query.search } },
        { ingredients: { contains: query.search } }
      ];
    }

    if (query.categoryId) {
      where.categoryId = query.categoryId;
    }

    const recipes = await this.prisma.recipe.findMany({
      where,
      include: this.recipeInclude,
      orderBy: {
        createdAt: 'desc'
      }
    });

    return recipes.map((recipe) => this.withCookingTime(recipe));
  }

  async findOne(id: number) {
    const recipe = await this.prisma.recipe.findUnique({
      where: { id },
      include: this.recipeInclude
    });

    if (!recipe) {
      throw new NotFoundException('Resep tidak ditemukan.');
    }

    return this.withCookingTime(recipe);
  }

  async update(id: number, updateRecipeDto: UpdateRecipeDto) {
    await this.findOne(id);

    if (updateRecipeDto.categoryId) {
      await this.ensureCategoryExists(updateRecipeDto.categoryId);
    }

    const recipeData = this.buildUpdateRecipeData(updateRecipeDto);
    const data: Prisma.RecipeUpdateInput = {
      title: recipeData.title,
      description: recipeData.description,
      ingredients: recipeData.ingredients,
      instructions: recipeData.instructions,
      imageUrl: recipeData.imageUrl,
      prepTimeMinutes: recipeData.prepTimeMinutes,
      cookTimeMinutes: recipeData.cookTimeMinutes,
      difficulty: recipeData.difficulty,
      servings: recipeData.servings
    };

    if (updateRecipeDto.title) {
      data.slug = await this.generateUniqueSlug(updateRecipeDto.title, id);
    }

    if (updateRecipeDto.categoryId) {
      data.category = {
        connect: {
          id: updateRecipeDto.categoryId
        }
      };
    }

    return this.prisma.recipe.update({
      where: { id },
      data,
      include: this.recipeInclude
    }).then((recipe) => this.withCookingTime(recipe));
  }

  async remove(id: number) {
    await this.findOne(id);

    await this.prisma.recipe.delete({
      where: { id }
    });

    return {
      message: 'Resep berhasil dihapus.'
    };
  }

  private async ensureCategoryExists(categoryId: number) {
    const category = await this.prisma.category.findUnique({
      where: { id: categoryId },
      select: { id: true }
    });

    if (!category) {
      throw new NotFoundException('Kategori tidak ditemukan.');
    }
  }

  private async generateUniqueSlug(title: string, excludeRecipeId?: number) {
    const baseSlug = this.slugify(title);
    let slug = baseSlug;
    let counter = 1;

    while (true) {
      const existingRecipe = await this.prisma.recipe.findFirst({
        where: {
          slug,
          ...(excludeRecipeId ? { NOT: { id: excludeRecipeId } } : {})
        },
        select: {
          id: true
        }
      });

      if (!existingRecipe) {
        return slug;
      }

      slug = `${baseSlug}-${counter}`;
      counter += 1;
    }
  }

  private slugify(value: string) {
    const slug = value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');

    return slug || 'recipe';
  }

  private buildCreateRecipeData(recipeDto: RecipePayload) {
    const cookTimeMinutes = recipeDto.cookTimeMinutes ?? recipeDto.cookingTime;

    return {
      title: recipeDto.title as string,
      description: recipeDto.description as string,
      ingredients: recipeDto.ingredients as string,
      instructions: recipeDto.instructions as string,
      imageUrl: recipeDto.imageUrl,
      prepTimeMinutes: recipeDto.prepTimeMinutes,
      cookTimeMinutes,
      difficulty: recipeDto.difficulty,
      servings: recipeDto.servings
    };
  }

  private buildUpdateRecipeData(recipeDto: RecipePayload) {
    const cookTimeMinutes = recipeDto.cookTimeMinutes ?? recipeDto.cookingTime;

    return {
      title: recipeDto.title,
      description: recipeDto.description,
      ingredients: recipeDto.ingredients,
      instructions: recipeDto.instructions,
      imageUrl: recipeDto.imageUrl,
      prepTimeMinutes: recipeDto.prepTimeMinutes,
      cookTimeMinutes,
      difficulty: recipeDto.difficulty,
      servings: recipeDto.servings
    };
  }

  private withCookingTime<T extends { cookTimeMinutes: number | null }>(recipe: T) {
    return {
      ...recipe,
      cookingTime: recipe.cookTimeMinutes
    };
  }
}
