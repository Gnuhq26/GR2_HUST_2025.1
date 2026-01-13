import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNumber, IsPositive, IsEnum, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class RecordPaymentDto {
  @ApiProperty({
    example: 'customer',
    enum: ['customer', 'supplier'],
    description: 'Loại thanh toán: customer (thu tiền từ khách) hoặc supplier (trả tiền cho NCC)',
  })
  @IsEnum(['customer', 'supplier'])
  type!: 'customer' | 'supplier';

  @ApiProperty({
    example: 1,
    description: 'ID của Order (nếu type=customer) hoặc StockReceipt (nếu type=supplier)',
  })
  @IsInt()
  @Type(() => Number)
  referenceId!: number;

  @ApiProperty({
    example: 1000000,
    description: 'Số tiền thanh toán',
  })
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  amount!: number;

  @ApiProperty({
    example: 'Thanh toán đợt 1',
    required: false,
    description: 'Ghi chú',
  })
  @IsOptional()
  @IsString()
  note?: string;
}
