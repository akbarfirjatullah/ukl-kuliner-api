import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  private readonly userSelect = {
    id: true,
    name: true,
    email: true,
    role: true,
    createdAt: true,
    updatedAt: true
  } as const;

  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.user.findMany({
      select: this.userSelect,
      orderBy: { createdAt: 'desc' }
    });
  }

  async findMe(userId: number) {
    return this.findOneById(userId);
  }

  async findOneById(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: this.userSelect
    });

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    return user;
  }
}
