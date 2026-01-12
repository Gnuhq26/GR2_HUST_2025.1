import { IsString, IsOptional, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCategoryDto {
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  @ApiProperty({
    example: 'Vật liệu xây dựng',
    description: 'Tên danh mục',
  })
  categoryName!: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    example: 'Các loại vật liệu dùng trong xây dựng như gạch, xi măng, cát...',
    description: 'Mô tả danh mục',
    required: false,
  })
  description?: string;
}
