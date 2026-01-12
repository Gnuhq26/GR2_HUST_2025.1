import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsInt, IsString, IsDecimal, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateOrderItemDto {
  @ApiProperty({
    description: 'ID sản phẩm',
    example: 1,
  })
  @IsNotEmpty({ message: 'ProductID không được để trống' })
  @IsInt({ message: 'ProductID phải là số nguyên' })
  @Type(() => Number)
  ProductID!: number;

  @ApiProperty({
    description: 'Tên đơn vị bán (Pallet, Thùng, Viên...)',
    example: 'Thùng',
  })
  @IsNotEmpty({ message: 'UnitName không được để trống' })
  @IsString({ message: 'UnitName phải là chuỗi' })
  UnitName!: string;

  @ApiProperty({
    description: 'Số lượng bán theo đơn vị',
    example: 10,
  })
  @IsNotEmpty({ message: 'Quantity không được để trống' })
  @Type(() => Number)
  @Min(0.01, { message: 'Quantity phải lớn hơn 0' })
  Quantity!: number;
}
