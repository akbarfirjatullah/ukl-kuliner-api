import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException
} from '@nestjs/common';
import { PaymentStatus, Prisma, SubscriptionPlan, SubscriptionStatus } from '@prisma/client';
import { randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { CheckoutSubscriptionDto } from './dto/checkout-subscription.dto';
import { PaymentNotificationDto } from './dto/payment-notification.dto';
import {
  SUBSCRIPTION_PLAN_LIST,
  getSubscriptionPlanConfig
} from './subscription.constants';

@Injectable()
export class SubscriptionsService {
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

  private readonly paymentInclude = {
    subscription: {
      select: {
        id: true,
        plan: true,
        status: true,
        amount: true,
        currency: true,
        periodDays: true,
        startsAt: true,
        expiresAt: true,
        createdAt: true,
        updatedAt: true
      }
    }
  } as const;

  constructor(private readonly prisma: PrismaService) {}

  getPlans() {
    return SUBSCRIPTION_PLAN_LIST;
  }

  async findMySubscription(userId: number) {
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: this.userSelect
      });

      if (!user) {
        throw new NotFoundException('Pengguna tidak ditemukan.');
      }

      const activeSubscription = await this.syncUserSubscriptionState(tx, userId);
      const latestSubscription = await tx.subscription.findFirst({
        where: { userId },
        include: {
          paymentTransaction: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
      const refreshedUser = await tx.user.findUnique({
        where: { id: userId },
        select: this.userSelect
      });

      return {
        user: refreshedUser ?? user,
        activeSubscription,
        latestSubscription
      };
    });
  }

  async findMyPayments(userId: number) {
    return this.prisma.paymentTransaction.findMany({
      where: { userId },
      include: this.paymentInclude,
      orderBy: {
        createdAt: 'desc'
      }
    });
  }

  async checkout(userId: number, checkoutSubscriptionDto: CheckoutSubscriptionDto) {
    const planConfig = getSubscriptionPlanConfig(checkoutSubscriptionDto.plan);

    if (checkoutSubscriptionDto.plan === SubscriptionPlan.FREE) {
      throw new BadRequestException('Paket Gratis adalah paket default dan tidak perlu checkout.');
    }

    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: this.userSelect
      });

      if (!user) {
        throw new NotFoundException('Pengguna tidak ditemukan.');
      }

      const activeSamePlan = await tx.subscription.findFirst({
        where: {
          userId,
          plan: checkoutSubscriptionDto.plan,
          status: SubscriptionStatus.ACTIVE,
          expiresAt: {
            gt: new Date()
          }
        },
        select: {
          id: true
        }
      });

      if (activeSamePlan) {
        throw new ConflictException('Paket ini masih aktif pada akun Anda.');
      }

      const pendingSubscription = await tx.subscription.findFirst({
        where: {
          userId,
          plan: checkoutSubscriptionDto.plan,
          status: SubscriptionStatus.PENDING
        },
        select: {
          id: true
        }
      });

      if (pendingSubscription) {
        throw new ConflictException('Anda sudah memiliki checkout yang masih pending untuk paket ini.');
      }

      const now = new Date();
      const orderId = this.buildOrderId(userId, checkoutSubscriptionDto.plan);
      const paymentToken = this.buildPaymentToken(orderId);
      const expiresAt = this.calculateExpiryDate(planConfig.periodDays, now);

      const subscription = await tx.subscription.create({
        data: {
          userId,
          plan: checkoutSubscriptionDto.plan,
          status: SubscriptionStatus.PENDING,
          amount: planConfig.price,
          periodDays: planConfig.periodDays,
          currency: 'IDR',
          startsAt: null,
          expiresAt
        }
      });

      const paymentTransaction = await tx.paymentTransaction.create({
        data: {
          orderId,
          subscriptionId: subscription.id,
          userId,
          provider: 'SIMULATED_MIDTRANS',
          status: PaymentStatus.PENDING,
          paymentToken,
          paymentUrl: this.buildPaymentUrl(paymentToken),
          grossAmount: planConfig.price
        }
      });

      const createdSubscription = await tx.subscription.findUnique({
        where: {
          id: subscription.id
        },
        include: {
          paymentTransaction: true
        }
      });

      return {
        message: 'Checkout subscription berhasil dibuat.',
        plan: planConfig,
        user,
        subscription: createdSubscription,
        payment: paymentTransaction
      };
    });
  }

  async handlePaymentNotification(paymentNotificationDto: PaymentNotificationDto) {
    return this.prisma.$transaction(async (tx) => {
      const payment = await tx.paymentTransaction.findUnique({
        where: {
          orderId: paymentNotificationDto.orderId
        },
        include: {
          subscription: true
        }
      });

      if (!payment) {
        throw new NotFoundException('Transaksi pembayaran tidak ditemukan.');
      }

      if (payment.status === paymentNotificationDto.status) {
        await this.syncUserSubscriptionState(tx, payment.userId);

        const refreshedPayment = await tx.paymentTransaction.findUnique({
          where: {
            id: payment.id
          },
          include: this.paymentInclude
        });

        const refreshedSubscription = await tx.subscription.findUnique({
          where: {
            id: payment.subscriptionId
          },
          include: {
            paymentTransaction: true
          }
        });

        return {
          message: this.getPaymentStatusMessage(paymentNotificationDto.status),
          payment: refreshedPayment,
          subscription: refreshedSubscription
        };
      }

      const nextSubscriptionStatus = this.mapPaymentStatusToSubscriptionStatus(
        paymentNotificationDto.status
      );

      const shouldStampPaidAt = paymentNotificationDto.status === PaymentStatus.PAID;
      const now = new Date();
      const finalExpiresAt = shouldStampPaidAt
        ? this.calculateExpiryDate(payment.subscription.periodDays, now)
        : payment.subscription.expiresAt;

      const updatedPayment = await tx.paymentTransaction.update({
        where: {
          id: payment.id
        },
        data: {
          status: paymentNotificationDto.status,
          paidAt: shouldStampPaidAt ? now : payment.paidAt
        },
        include: this.paymentInclude
      });

      if (paymentNotificationDto.status === PaymentStatus.PAID) {
        await tx.subscription.updateMany({
          where: {
            userId: payment.userId,
            status: SubscriptionStatus.ACTIVE,
            NOT: {
              id: payment.subscriptionId
            }
          },
          data: {
            status: SubscriptionStatus.EXPIRED
          }
        });

        await tx.subscription.update({
          where: {
            id: payment.subscriptionId
          },
          data: {
            status: SubscriptionStatus.ACTIVE,
            startsAt: now,
            expiresAt: finalExpiresAt
          }
        });
      } else {
        await tx.subscription.update({
          where: {
            id: payment.subscriptionId
          },
          data: {
            status: nextSubscriptionStatus,
            expiresAt: finalExpiresAt
          }
        });
      }

      await this.syncUserSubscriptionState(tx, payment.userId);

      const refreshedPayment = await tx.paymentTransaction.findUnique({
        where: {
          id: payment.id
        },
        include: this.paymentInclude
      });

      const refreshedSubscription = await tx.subscription.findUnique({
        where: {
          id: payment.subscriptionId
        },
        include: {
          paymentTransaction: true
        }
      });

      return {
        message: this.getPaymentStatusMessage(paymentNotificationDto.status),
        payment: refreshedPayment,
        subscription: refreshedSubscription
      };
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

    return activeSubscription;
  }

  private buildOrderId(userId: number, plan: SubscriptionPlan) {
    const suffix = randomBytes(3).toString('hex').toUpperCase();
    return `SUB-${userId}-${plan}-${Date.now()}-${suffix}`;
  }

  private buildPaymentToken(orderId: string) {
    return `PAY-${randomBytes(12).toString('hex').toUpperCase()}-${orderId.slice(-6)}`;
  }

  private calculateExpiryDate(periodDays: number, startsAt: Date) {
    if (periodDays <= 0) {
      return null;
    }

    return new Date(startsAt.getTime() + periodDays * 24 * 60 * 60 * 1000);
  }

  private buildPaymentUrl(paymentToken: string) {
    return `https://simulated-payments.local/checkout/${paymentToken}`;
  }

  private mapPaymentStatusToSubscriptionStatus(status: PaymentStatus) {
    switch (status) {
      case PaymentStatus.PAID:
        return SubscriptionStatus.ACTIVE;
      case PaymentStatus.CANCELLED:
        return SubscriptionStatus.CANCELLED;
      case PaymentStatus.EXPIRED:
        return SubscriptionStatus.EXPIRED;
      case PaymentStatus.FAILED:
        return SubscriptionStatus.FAILED;
      case PaymentStatus.PENDING:
      default:
        return SubscriptionStatus.PENDING;
    }
  }

  private getPaymentStatusMessage(status: PaymentStatus) {
    switch (status) {
      case PaymentStatus.PAID:
        return 'Pembayaran berhasil dikonfirmasi.';
      case PaymentStatus.CANCELLED:
        return 'Pembayaran dibatalkan.';
      case PaymentStatus.EXPIRED:
        return 'Pembayaran kedaluwarsa.';
      case PaymentStatus.FAILED:
        return 'Pembayaran gagal.';
      case PaymentStatus.PENDING:
      default:
        return 'Status pembayaran masih pending.';
    }
  }
}
