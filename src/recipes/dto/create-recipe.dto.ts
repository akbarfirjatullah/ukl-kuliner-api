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
    example: 'Nasi goreng tradisional Indonesia dengan telur, ayam, dan sayuran.'
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    example:
      '- 2 piring nasi\n- 2 butir telur\n- 100 gram ayam\n- 2 siung bawang putih\n- 1 sdm kecap manis'
  })
  @IsString()
  @IsNotEmpty()
  ingredients: string;

  @ApiProperty({
    example:
      '1. Panaskan minyak.\n2. Tumis bawang putih.\n3. Masukkan ayam dan telur.\n4. Tambahkan nasi dan bumbu.\n5. Sajikan selagi hangat.'
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

  @ApiPropertyOptional({
    example: 10,
    description: 'Alias untuk cookTimeMinutes yang dipakai frontend baru.'
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  cookingTime?: number;

  @ApiPropertyOptional({ example: 'Mudah' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  difficulty?: string;

  @ApiPropertyOptional({ example: 2 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  servings?: number;

  @ApiProperty({ example: 1, description: 'ID kategori' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  categoryId: number;
}
