import { ApiProperty } from '@nestjs/swagger';
import { SubscriptionPlan } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class CheckoutSubscriptionDto {
  @ApiProperty({
    enum: SubscriptionPlan,
    example: SubscriptionPlan.BASIC,
    description: 'Paket langganan yang ingin dibayar'
  })
  @IsEnum(SubscriptionPlan)
  plan: SubscriptionPlan;
}
