import {
  BadRequestException,
  Injectable,
  NotFoundException
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createCategoryDto: CreateCategoryDto) {
    return this.prisma.category.create({
      data: createCategoryDto
    });
  }

  async findAll() {
    return this.prisma.category.findMany({
      include: {
        _count: {
          select: {
            recipes: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });
  }

  async findOne(id: number) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            recipes: true
          }
        }
      }
    });

    if (!category) {
      throw new NotFoundException('Kategori tidak ditemukan.');
    }

    return category;
  }

  async update(id: number, updateCategoryDto: UpdateCategoryDto) {
    await this.findOne(id);

    return this.prisma.category.update({
      where: { id },
      data: updateCategoryDto,
      include: {
        _count: {
          select: {
            recipes: true
          }
        }
      }
    });
  }

  async remove(id: number) {
    const category = await this.findOne(id);

    if (category._count.recipes > 0) {
      throw new BadRequestException(
        'Kategori tidak dapat dihapus karena masih memiliki resep. Pindahkan atau hapus resep terlebih dahulu.'
      );
    }

    await this.prisma.category.delete({
      where: { id }
    });

    return {
      message: 'Kategori berhasil dihapus.'
    };
  }
}
