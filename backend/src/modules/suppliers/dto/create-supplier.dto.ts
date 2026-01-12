import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSupplierDto {
  @ApiProperty({ example: 'Công ty TNHH ABC', description: 'Tên nhà cung cấp' })
  @IsString()
  supplierName!: string;

  @ApiPropertyOptional({ example: '0123456789', description: 'Số điện thoại' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({
    example: '123 Đường ABC, Quận 1, TP.HCM',
    description: 'Địa chỉ nhà cung cấp',
  })
  @IsString()
  @IsOptional()
  address?: string;
}
