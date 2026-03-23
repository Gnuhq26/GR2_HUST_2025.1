import { IsInt, IsNumber, IsString, IsOptional, IsArray, ValidateNested, Min, IsIn } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// DTO cho chi tiết sản phẩm nhập kho
export class StockReceiptItemDto {
  @ApiProperty({ example: 1, description: 'ID sản phẩm' })
  @IsInt()
  productId!: number;

  @ApiProperty({ example: 'Pallet', description: 'Đơn vị tính khi nhập (Pallet, Thùng, Viên...)' })
  @IsString()
  unitName!: string;

  @ApiProperty({ example: 10, description: 'Số lượng nhập' })
  @IsNumber()
  @Min(0.01)
  quantity!: number;

  @ApiProperty({ example: 500000, description: 'Giá nhập của đơn vị này' })
  @IsNumber()
  @Min(0)
  unitPrice!: number;
}

// DTO tạo phiếu nhập kho
export class CreateStockReceiptDto {
  @ApiProperty({ example: 1, description: 'ID nhà cung cấp' })
  @IsInt()
  supplierId!: number;

  @ApiPropertyOptional({
    example: 'Nhập hàng tháng 1/2026',
    description: 'Ghi chú phiếu nhập',
  })
  @IsString()
  @IsOptional()
  note?: string;

  @ApiPropertyOptional({
    example: 'Received',
    description: 'Trạng thái phiếu nhập (Pending: hàng đang về, Received: đã nhập kho)',
    enum: ['Pending', 'Received'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['Pending', 'Received'])
  status?: 'Pending' | 'Received';

  @ApiProperty({
    type: [StockReceiptItemDto],
    description: 'Danh sách sản phẩm nhập kho',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StockReceiptItemDto)
  items!: StockReceiptItemDto[];
}
