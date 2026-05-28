import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Response } from 'express';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaClientExceptionFilter implements ExceptionFilter {
  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    const status = this.mapStatusCode(exception.code);
    const message = this.mapMessage(exception.code);

    response.status(status).json({
      statusCode: status,
      error: HttpStatus[status],
      message,
      timestamp: new Date().toISOString()
    });
  }

  private mapStatusCode(code: string): number {
    switch (code) {
      case 'P2002':
        return HttpStatus.CONFLICT;
      case 'P2003':
        return HttpStatus.BAD_REQUEST;
      case 'P2025':
        return HttpStatus.NOT_FOUND;
      default:
        return HttpStatus.INTERNAL_SERVER_ERROR;
    }
  }

  private mapMessage(code: string): string {
    switch (code) {
      case 'P2002':
        return 'Data dengan nilai unik tersebut sudah ada.';
      case 'P2003':
        return 'Data relasi tidak ditemukan atau tidak dapat digunakan.';
      case 'P2025':
        return 'Data yang diminta tidak ditemukan.';
      default:
        return 'Terjadi kesalahan pada database.';
    }
  }
}
