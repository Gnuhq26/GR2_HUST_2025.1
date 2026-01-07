import { IsInt, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateMemberRoleDto {
  @ApiProperty({
    example: 3,
    description: 'New Role ID to assign to the user',
  })
  @IsInt()
  @IsNotEmpty()
  roleId!: number;
}
