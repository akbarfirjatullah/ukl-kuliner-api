import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { PrismaClientExceptionFilter } from './common/filters/prisma-client-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  app.enableCors();
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true
      }
    })
  );
  app.useGlobalFilters(new PrismaClientExceptionFilter());

  const swaggerConfig = new DocumentBuilder()
    .setTitle('API Resep Kuliner UKL')
    .setDescription(
      'Backend API untuk aplikasi kuliner / resep yang dibuat dengan NestJS, Prisma, dan MySQL.'
    )
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true
    }
  });

  const port = Number(configService.get<string>('PORT') ?? 3000);
  await app.listen(port);
  console.log(`Server berjalan di http://localhost:${port}/api`);
  console.log(`Dokumentasi Swagger tersedia di http://localhost:${port}/api/docs`);
}

bootstrap();
