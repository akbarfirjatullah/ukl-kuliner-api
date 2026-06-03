import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, SubscriptionPlan, SubscriptionStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  private readonly userSelect = {
    id: true,
    name: true,
    email: true,
    role: true,
    subscriptionPlan: true,
    subscriptionExpiry: true,
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
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: this.userSelect
      });

      if (!user) {
        throw new NotFoundException('Pengguna tidak ditemukan.');
      }

      await this.syncUserSubscriptionState(tx, userId);

      const refreshedUser = await tx.user.findUnique({
        where: { id: userId },
        select: this.userSelect
      });

      return refreshedUser ?? user;
    });
  }

  async findOneById(userId: number) {
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: this.userSelect
      });

      if (!user) {
        throw new NotFoundException('Pengguna tidak ditemukan.');
      }

      await this.syncUserSubscriptionState(tx, userId);

      const refreshedUser = await tx.user.findUnique({
        where: { id: userId },
        select: this.userSelect
      });

      return refreshedUser ?? user;
    });
  }

  private async syncUserSubscriptionState(
    tx: Prisma.TransactionClient,
    userId: number
  ) {
    const now = new Date();

    await tx.subscription.updateMany({
      where: {
        userId,
        status: SubscriptionStatus.ACTIVE,
        expiresAt: {
          lte: now
        }
      },
      data: {
        status: SubscriptionStatus.EXPIRED
      }
    });

    const activeSubscription = await tx.subscription.findFirst({
      where: {
        userId,
        status: SubscriptionStatus.ACTIVE,
        expiresAt: {
          gt: now
        }
      },
      orderBy: {
        expiresAt: 'desc'
      }
    });

    await tx.user.update({
      where: {
        id: userId
      },
      data: {
        subscriptionPlan: activeSubscription?.plan ?? SubscriptionPlan.FREE,
        subscriptionExpiry: activeSubscription?.expiresAt ?? null
      }
    });
  }
}
