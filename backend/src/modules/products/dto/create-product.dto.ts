import {
  IsString,
  IsOptional,
  IsBoolean,
  IsInt,
  IsArray,
  ValidateNested,
  IsNumber,
  IsDecimal,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// DTO cho đơn vị sản phẩm
export class ProductUnitDto {
  @ApiProperty({ example: 'Pallet', description: 'Tên đơn vị' })
  @IsString()
  unitName!: string;

  @ApiProperty({
    example: 500,
    description: 'Tỷ lệ quy đổi (1 Pallet = 500 Viên)',
  })
  @IsNumber()
  @Min(0)
  exchangeValue!: number;

  @ApiPropertyOptional({
    example: false,
    description: 'Có phải đơn vị mặc định không',
  })
  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;
}

// DTO cho bảng giá
export class PriceListDto {
  @ApiProperty({ example: 'Giá thợ', description: 'Tên bảng giá' })
  @IsString()
  priceName!: string;

  @ApiProperty({ example: 'Viên', description: 'Đơn vị tính cho giá này' })
  @IsString()
  unitName!: string;

  @ApiProperty({ example: 1000000, description: 'Đơn giá theo unitName' })
  @IsNumber()
  @Min(0)
  unitPrice!: number;

  @ApiPropertyOptional({ example: 0, description: 'Số lượng tối thiểu' })
  @IsInt()
  @Min(0)
  @IsOptional()
  minQuantity?: number;
}

export class CreateProductDto {
  @ApiProperty({ example: 'Gạch xây dựng', description: 'Tên sản phẩm' })
  @IsString()
  productName!: string;

  @ApiProperty({ example: 1, description: 'ID danh mục' })
  @IsInt()
  categoryId!: number;

  @ApiPropertyOptional({ example: 'GACH-001', description: 'Mã SKU' })
  @IsString()
  @IsOptional()
  sku?: string;

  @ApiProperty({ example: 'Viên', description: 'Đơn vị gốc' })
  @IsString()
  baseUnit!: string;

  @ApiPropertyOptional({
    example: 'Gạch chất lượng cao',
    description: 'Mô tả sản phẩm',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Trạng thái hoạt động',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({
    type: [ProductUnitDto],
    description: 'Danh sách các đơn vị quy đổi',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductUnitDto)
  @IsOptional()
  units?: ProductUnitDto[];

  @ApiPropertyOptional({
    type: [PriceListDto],
    description: 'Danh sách bảng giá',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PriceListDto)
  @IsOptional()
  prices?: PriceListDto[];
}
