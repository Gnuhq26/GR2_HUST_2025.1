import { IsString, IsNumber, IsBoolean, IsOptional, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AddProductUnitDto {
  @ApiProperty({ example: 'Thùng', description: 'Tên đơn vị quy đổi' })
  @IsString()
  unitName!: string;

  @ApiProperty({
    example: 50,
    description: 'Tỷ lệ quy đổi (ví dụ: 1 Thùng = 50 Viên)',
  })
  @IsNumber()
  @Min(0.01)
  exchangeValue!: number;

  @ApiPropertyOptional({
    example: false,
    description: 'Có phải đơn vị mặc định không',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;
}

export class UpdateProductUnitDto {
  @ApiPropertyOptional({ example: 'Thùng lớn', description: 'Tên đơn vị quy đổi' })
  @IsString()
  @IsOptional()
  unitName?: string;

  @ApiPropertyOptional({
    example: 60,
    description: 'Tỷ lệ quy đổi mới',
  })
  @IsNumber()
  @Min(0.01)
  @IsOptional()
  exchangeValue?: number;

  @ApiPropertyOptional({
    example: true,
    description: 'Có phải đơn vị mặc định không',
  })
  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;
}
