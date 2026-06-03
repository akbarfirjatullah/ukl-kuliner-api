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
import { CheckoutSubscriptionDto } from './dto/checkout-subscription.dto';
import { SubscriptionsService } from './subscriptions.service';

@ApiTags('Langganan')
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Public()
  @Get('plans')
  @ApiOperation({ summary: 'Mengambil daftar paket langganan yang tersedia' })
  @ApiOkResponse({ description: 'Daftar paket langganan berhasil diambil.' })
  findPlans() {
    return this.subscriptionsService.getPlans();
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mengambil status langganan pengguna yang sedang login' })
  @ApiOkResponse({ description: 'Status langganan berhasil diambil.' })
  @ApiUnauthorizedResponse({ description: 'Autentikasi diperlukan.' })
  findMySubscription(@CurrentUser('userId') userId: number) {
    return this.subscriptionsService.findMySubscription(userId);
  }

  @Post('checkout')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Membuat checkout langganan baru' })
  @ApiCreatedResponse({ description: 'Checkout subscription berhasil dibuat.' })
  @ApiUnauthorizedResponse({ description: 'Autentikasi diperlukan.' })
  checkout(
    @CurrentUser('userId') userId: number,
    @Body() checkoutSubscriptionDto: CheckoutSubscriptionDto
  ) {
    return this.subscriptionsService.checkout(userId, checkoutSubscriptionDto);
  }
}
