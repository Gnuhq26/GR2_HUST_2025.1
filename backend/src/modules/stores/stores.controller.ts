import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe, HttpCode, HttpStatus, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { StoresService } from './stores.service';
import { AddMemberDto, UpdateMemberRoleDto, CreateStoreDto } from './dto';
import { CurrentStore } from '../../common/decorators/current-store.decorator';
import { CheckPermission } from '../../common/decorators/check-permission.decorator';

@ApiTags('Store Members Management')
@ApiBearerAuth('JWT-auth')
@Controller('stores')
export class StoresController {
  constructor(private readonly storesService: StoresService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new store (users can create multiple stores for expansion)' })
  @ApiResponse({
    status: 201,
    description: 'Store created successfully with default roles. Creator is assigned as Admin. Users can create multiple stores.',
    schema: {
      example: {
        message: 'Store created successfully',
        store: {
          storeId: 1,
          storeName: 'Cửa hàng ABC',
          subdomain: 'abc-store',
          phone: '0123456789',
          address: '79 Cầu Giấy, Hà Nội',
          status: 'Active',
          createdAt: '2026-01-15T00:00:00.000Z',
        },
      },
    },
  })
  @ApiResponse({ status: 409, description: 'Subdomain already exists' })
  async createStore(
    @Body() createStoreDto: CreateStoreDto,
    @Req() req: any,
  ) {
    return await this.storesService.createStore(req.user.UserID, createStoreDto);
  }

  @Get('details')
  @CheckPermission('read', 'Store')
  @ApiOperation({ summary: 'Get current store details' })
  @ApiResponse({
    status: 200,
    description: 'Store details with member and role counts',
    schema: {
      example: {
        StoreID: 1,
        StoreName: 'Cửa hàng A',
        Subdomain: 'test',
        Phone: '0123456789',
        Address: '79 Cầu Giấy, Hà Nội',
        Status: 'Active',
        CreatedAt: '2026-01-01T00:00:00.000Z',
        _count: {
          storeUsers: 5,
          roles: 3,
        },
      },
    },
  })
  async getStoreDetails(@CurrentStore() storeId: number) {
    return await this.storesService.getStoreDetails(storeId);
  }

  @Get('members')
  @CheckPermission('read', 'User')
  @ApiOperation({ summary: 'Get all members of the current store' })
  @ApiResponse({
    status: 200,
    description: 'List of store members with their roles',
    schema: {
      example: [
        {
          userId: 1,
          storeId: 1,
          user: {
            UserID: 1,
            Email: 'admin@app.com',
            FullName: 'Admin User',
            Phone: null,
            Address: null,
            CreatedAt: '2026-01-01T00:00:00.000Z',
          },
          role: {
            RoleID: 1,
            RoleName: 'Chủ cửa hàng',
            Description: 'Toàn quyền quản lý cửa hàng',
          },
          joinedAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
      ],
    },
  })
  async getMembers(@CurrentStore() storeId: number) {
    return await this.storesService.getMembers(storeId);
  }

  @Post('members')
  @CheckPermission('create', 'User')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add a member to the store (auto-creates user if email not found)' })
  @ApiResponse({
    status: 201,
    description: 'Member added successfully. If user email did not exist, a new user was created with default password (123456).',
    schema: {
      example: {
        message: 'User "staff@example.com" added to store successfully',
        member: {
          userId: 2,
          user: {
            UserID: 2,
            Email: 'staff@example.com',
            FullName: 'Staff User',
            Phone: '0987654321',
          },
          role: {
            RoleID: 2,
            RoleName: 'Nhân viên',
            Description: 'Vai trò nhân viên bán hàng/kho',
          },
          joinedAt: '2026-01-07T10:00:00.000Z',
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'User or Role not found' })
  @ApiResponse({ status: 409, description: 'User is already a member' })
  async addMember(
    @Body() addMemberDto: AddMemberDto,
    @CurrentStore() storeId: number,
  ) {
    return await this.storesService.addMember(storeId, addMemberDto);
  }

  @Put('members/:userId/role')
  @CheckPermission('update', 'User')
  @ApiOperation({ summary: "Update a member's role" })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({
    status: 200,
    description: 'Member role updated successfully',
    schema: {
      example: {
        message: 'User role updated from "Nhân viên" to "Kế toán kho"',
        member: {
          userId: 2,
          user: {
            UserID: 2,
            Email: 'staff@example.com',
            FullName: 'Staff User',
          },
          role: {
            RoleID: 3,
            RoleName: 'Kế toán kho',
            Description: 'Quản lý kho hàng và báo cáo tài chính',
          },
          updatedAt: '2026-01-07T11:00:00.000Z',
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'User or Role not found' })
  @ApiResponse({ status: 400, description: 'User already has this role' })
  async updateMemberRole(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() updateMemberRoleDto: UpdateMemberRoleDto,
    @CurrentStore() storeId: number,
  ) {
    return await this.storesService.updateMemberRole(
      storeId,
      userId,
      updateMemberRoleDto,
    );
  }

  @Delete('members/:userId')
  @CheckPermission('delete', 'User')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove a member from the store' })
  @ApiParam({ name: 'userId', description: 'User ID to remove' })
  @ApiResponse({
    status: 200,
    description: 'Member removed successfully',
    schema: {
      example: {
        message: 'User "staff@example.com" removed from store successfully',
      },
    },
  })
  @ApiResponse({ status: 404, description: 'User is not a member of this store' })
  async removeMember(
    @Param('userId', ParseIntPipe) userId: number,
    @CurrentStore() storeId: number,
  ) {
    return await this.storesService.removeMember(storeId, userId);
  }
}
