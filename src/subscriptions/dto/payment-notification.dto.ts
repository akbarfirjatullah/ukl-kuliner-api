import { ApiProperty } from '@nestjs/swagger';
import { PaymentStatus } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';

export class PaymentNotificationDto {
  @ApiProperty({
    example: 'SUB-1-BASIC-1717392000000-1A2B3C',
    description: 'Order ID dari proses checkout'
  })
  @IsString()
  @IsNotEmpty()
  orderId: string;

  @ApiProperty({
    enum: PaymentStatus,
    example: PaymentStatus.PAID,
    description: 'Status pembayaran yang diterima dari notifikasi'
  })
  @IsEnum(PaymentStatus)
  status: PaymentStatus;
}
