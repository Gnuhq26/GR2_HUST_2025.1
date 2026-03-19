import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsInt, IsString, IsArray, ValidateNested, ArrayMinSize, IsIn } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateOrderItemDto } from './create-order-item.dto';

export class CreateOrderDto {
  @ApiProperty({
    description: 'ID khách hàng (null nếu khách vãng lai)',
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsInt({ message: 'CustomerID phải là số nguyên' })
  @Type(() => Number)
  CustomerID?: number;

  @ApiProperty({
    description: 'Ghi chú đơn hàng',
    example: 'Giao hàng trước 5h chiều',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Note phải là chuỗi' })
  Note?: string;

  @ApiProperty({
    description: 'Phương thức giao hàng',
    example: 'Immediate',
    required: false,
    enum: ['Immediate', 'Reserved', 'DirectShip'],
  })
  @IsOptional()
  @IsString({ message: 'DeliveryMethod phải là chuỗi' })
  @IsIn(['Immediate', 'Reserved', 'DirectShip'], {
    message: 'DeliveryMethod chỉ được là Immediate, Reserved hoặc DirectShip',
  })
  DeliveryMethod?: 'Immediate' | 'Reserved' | 'DirectShip';

  @ApiProperty({
    description: 'Danh sách sản phẩm trong đơn hàng',
    type: [CreateOrderItemDto],
    example: [
      { ProductID: 1, UnitName: 'Thùng', Quantity: 10 },
      { ProductID: 2, UnitName: 'Pallet', Quantity: 2 },
    ],
  })
  @IsArray({ message: 'Items phải là mảng' })
  @ArrayMinSize(1, { message: 'Đơn hàng phải có ít nhất 1 sản phẩm' })
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items!: CreateOrderItemDto[];
}
