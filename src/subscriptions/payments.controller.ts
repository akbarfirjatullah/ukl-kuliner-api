import { Body, Controller, Get, Post } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse
} from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { PaymentNotificationDto } from './dto/payment-notification.dto';
import { SubscriptionsService } from './subscriptions.service';

@ApiTags('Pembayaran')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Public()
  @Post('notification')
  @ApiOperation({ summary: 'Menyimulasikan notifikasi pembayaran (Midtrans-like webhook)' })
  @ApiCreatedResponse({ description: 'Status pembayaran berhasil diproses.' })
  handlePaymentNotification(@Body() paymentNotificationDto: PaymentNotificationDto) {
    return this.subscriptionsService.handlePaymentNotification(paymentNotificationDto);
  }

  @Public()
  @Post()
  @ApiOperation({ summary: 'Menyimulasikan notifikasi pembayaran (alias)' })
  @ApiCreatedResponse({ description: 'Status pembayaran berhasil diproses.' })
  handlePaymentNotificationLegacy(@Body() paymentNotificationDto: PaymentNotificationDto) {
    return this.subscriptionsService.handlePaymentNotification(paymentNotificationDto);
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mengambil riwayat pembayaran milik pengguna yang sedang login' })
  @ApiOkResponse({ description: 'Riwayat pembayaran berhasil diambil.' })
  @ApiUnauthorizedResponse({ description: 'Autentikasi diperlukan.' })
  findMyPayments(@CurrentUser('userId') userId: number) {
    return this.subscriptionsService.findMyPayments(userId);
  }
}
