import { IsEmail, IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AddMemberDto {
  @ApiProperty({
    example: 'staff@example.com',
    description: 'Email of the user to add to the store',
  })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({
    example: 2,
    description: 'Role ID to assign to the user in this store',
  })
  @IsInt()
  @IsNotEmpty()
  roleId!: number;

  @ApiPropertyOptional({
    example: 'Nhân viên mới - Phụ trách kho',
    description: 'Optional note about this member',
  })
  @IsOptional()
  @IsString()
  note?: string;
}
