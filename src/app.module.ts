import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from './auth/auth.module';
import { CategoriesModule } from './categories/categories.module';
import { FavoritesModule } from './favorites/favorites.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { PrismaModule } from './prisma/prisma.module';
import { RecipesModule } from './recipes/recipes.module';
import { ReviewsModule } from './reviews/reviews.module';
import { UsersModule } from './users/users.module';

const REQUIRED_ENV_KEYS = ['DATABASE_URL', 'JWT_SECRET', 'PORT'] as const;

function validateEnv(config: Record<string, unknown>) {
  for (const key of REQUIRED_ENV_KEYS) {
    const value = config[key];

    if (typeof value !== 'string' || value.trim() === '') {
      throw new Error(`${key} is required.`);
    }
  }

  const port = config.PORT;
  if (typeof port !== 'string' || Number.isNaN(Number(port))) {
    throw new Error('PORT must be a valid number.');
  }

  return config;
}

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    CategoriesModule,
    RecipesModule,
    FavoritesModule,
    ReviewsModule
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard
    }
  ]
})
export class AppModule {}
