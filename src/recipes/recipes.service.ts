import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRecipeDto } from './dto/create-recipe.dto';
import { ListRecipesQueryDto } from './dto/list-recipes-query.dto';
import { UpdateRecipeDto } from './dto/update-recipe.dto';

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

    return this.prisma.recipe.create({
      data: {
        ...createRecipeDto,
        slug,
        createdById
      },
      include: this.recipeInclude
    });
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

    return this.prisma.recipe.findMany({
      where,
      include: this.recipeInclude,
      orderBy: {
        createdAt: 'desc'
      }
    });
  }

  async findOne(id: number) {
    const recipe = await this.prisma.recipe.findUnique({
      where: { id },
      include: this.recipeInclude
    });

    if (!recipe) {
      throw new NotFoundException('Recipe not found.');
    }

    return recipe;
  }

  async update(id: number, updateRecipeDto: UpdateRecipeDto) {
    await this.findOne(id);

    if (updateRecipeDto.categoryId) {
      await this.ensureCategoryExists(updateRecipeDto.categoryId);
    }

    const data: Prisma.RecipeUpdateInput = {
      title: updateRecipeDto.title,
      description: updateRecipeDto.description,
      ingredients: updateRecipeDto.ingredients,
      instructions: updateRecipeDto.instructions,
      imageUrl: updateRecipeDto.imageUrl,
      prepTimeMinutes: updateRecipeDto.prepTimeMinutes,
      cookTimeMinutes: updateRecipeDto.cookTimeMinutes,
      servings: updateRecipeDto.servings
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
    });
  }

  async remove(id: number) {
    await this.findOne(id);

    await this.prisma.recipe.delete({
      where: { id }
    });

    return {
      message: 'Recipe deleted successfully.'
    };
  }

  private async ensureCategoryExists(categoryId: number) {
    const category = await this.prisma.category.findUnique({
      where: { id: categoryId },
      select: { id: true }
    });

    if (!category) {
      throw new NotFoundException('Category not found.');
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
}
