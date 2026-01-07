import { IsNotEmpty, IsString, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateRoleDto {
  @ApiProperty({
    example: 'Kế toán kho',
    description: 'Role name within the store',
    maxLength: 100,
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  roleName!: string;

  @ApiPropertyOptional({
    example: 'Quản lý kho hàng và báo cáo tài chính',
    description: 'Description of the role responsibilities',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;
}
