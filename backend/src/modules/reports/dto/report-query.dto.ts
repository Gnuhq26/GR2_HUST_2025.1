import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsEnum, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class ReportQueryDto {
  @ApiProperty({
    example: '2026-01-01',
    description: 'Ngày bắt đầu (YYYY-MM-DD)',
  })
  @IsDateString()
  startDate!: string;

  @ApiProperty({
    example: '2026-01-31',
    description: 'Ngày kết thúc (YYYY-MM-DD)',
  })
  @IsDateString()
  endDate!: string;
}

export class TopProductsQueryDto extends ReportQueryDto {
  @ApiPropertyOptional({
    example: 'revenue',
    enum: ['revenue', 'quantity'],
    description: 'Sắp xếp theo doanh thu hoặc số lượng bán',
    default: 'revenue',
  })
  @IsOptional()
  @IsEnum(['revenue', 'quantity'])
  sortBy?: 'revenue' | 'quantity';

  @ApiPropertyOptional({
    example: 10,
    description: 'Số lượng sản phẩm top (default: 10)',
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;
}
