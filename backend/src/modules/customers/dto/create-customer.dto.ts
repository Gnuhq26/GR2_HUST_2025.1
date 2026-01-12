import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, MaxLength } from 'class-validator';

export class CreateCustomerDto {
  @ApiProperty({
    description: 'Tên khách hàng',
    example: 'Nguyễn Văn A',
  })
  @IsNotEmpty({ message: 'Tên khách hàng không được để trống' })
  @IsString({ message: 'Tên khách hàng phải là chuỗi' })
  @MaxLength(100, { message: 'Tên khách hàng không được quá 100 ký tự' })
  CustomerName!: string;

  @ApiProperty({
    description: 'Số điện thoại khách hàng',
    example: '0912345678',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Số điện thoại phải là chuỗi' })
  @MaxLength(20, { message: 'Số điện thoại không được quá 20 ký tự' })
  Phone?: string;

  @ApiProperty({
    description: 'Địa chỉ khách hàng',
    example: '123 Đường ABC, Quận 1, TP.HCM',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Địa chỉ phải là chuỗi' })
  @MaxLength(255, { message: 'Địa chỉ không được quá 255 ký tự' })
  Address?: string;
}
