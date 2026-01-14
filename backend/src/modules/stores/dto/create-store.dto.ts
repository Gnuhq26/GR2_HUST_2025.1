import { IsString, IsNotEmpty, IsOptional, Matches, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateStoreDto {
  @ApiProperty({
    example: 'Cửa hàng ABC',
    description: 'Store name',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  storeName!: string;

  @ApiProperty({
    example: 'abc-store',
    description: 'Subdomain for the store (lowercase, no spaces, alphanumeric and hyphens only)',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @Matches(/^[a-z0-9-]+$/, {
    message: 'Subdomain must be lowercase, alphanumeric and hyphens only',
  })
  subdomain!: string;

  @ApiPropertyOptional({
    example: '0123456789',
    description: 'Store phone number',
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @ApiPropertyOptional({
    example: '79 Cầu Giấy, Hà Nội',
    description: 'Store address',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  address?: string;
}
