import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  Min
} from 'class-validator';

export class CreateRecipeDto {
  @ApiProperty({ example: 'Nasi Goreng Kampung' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  title: string;

  @ApiProperty({
    example: 'Traditional Indonesian fried rice with egg, chicken, and vegetables.'
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    example:
      '- 2 plates rice\n- 2 eggs\n- 100g chicken\n- 2 cloves garlic\n- 1 tbsp sweet soy sauce'
  })
  @IsString()
  @IsNotEmpty()
  ingredients: string;

  @ApiProperty({
    example:
      '1. Heat oil in a pan.\n2. Saute garlic.\n3. Add chicken and eggs.\n4. Add rice and sauces.\n5. Serve hot.'
  })
  @IsString()
  @IsNotEmpty()
  instructions: string;

  @ApiPropertyOptional({ example: 'https://example.com/images/nasi-goreng.jpg' })
  @IsOptional()
  @IsUrl()
  imageUrl?: string;

  @ApiPropertyOptional({ example: 15 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  prepTimeMinutes?: number;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  cookTimeMinutes?: number;

  @ApiPropertyOptional({ example: 2 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  servings?: number;

  @ApiProperty({ example: 1, description: 'Category ID' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  categoryId: number;
}
