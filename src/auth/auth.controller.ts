import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards
} from '@nestjs/common';
import {
  ApiConflictResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
  ApiCreatedResponse
} from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { AuthRateLimitGuard } from '../common/guards/auth-rate-limit.guard';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { AuthService } from './auth.service';

@ApiTags('Autentikasi')
@UseGuards(AuthRateLimitGuard)
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Mendaftarkan akun pengguna baru' })
  @ApiCreatedResponse({ description: 'Pengguna berhasil didaftarkan.' })
  @ApiConflictResponse({ description: 'Email sudah terdaftar.' })
  @ApiTooManyRequestsResponse({
    description: 'Terlalu banyak percobaan registrasi dalam waktu singkat.'
  })
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login menggunakan email dan password' })
  @ApiOkResponse({ description: 'Login berhasil.' })
  @ApiUnauthorizedResponse({ description: 'Email atau password salah.' })
  @ApiTooManyRequestsResponse({
    description: 'Terlalu banyak percobaan login dalam waktu singkat.'
  })
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }
}
