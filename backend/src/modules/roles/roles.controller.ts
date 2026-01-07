import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { RolesService } from './roles.service';
import { CreateRoleDto, UpdateRoleDto, AssignPermissionsDto } from './dto';
import { CurrentStore } from '../../common/decorators/current-store.decorator';
import { CheckPermission } from '../../common/decorators/check-permission.decorator';

@ApiTags('Roles Management')
@ApiBearerAuth('JWT-auth')
@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @CheckPermission('read', 'Role')
  @ApiOperation({ summary: 'Get all roles in current store' })
  @ApiResponse({
    status: 200,
    description: 'List of roles with their permissions',
    schema: {
      example: [
        {
          RoleID: 1,
          StoreID: 1,
          RoleName: 'Chủ cửa hàng',
          Description: 'Toàn quyền quản lý cửa hàng',
          CreatedAt: '2026-01-01T00:00:00.000Z',
          UpdatedAt: '2026-01-01T00:00:00.000Z',
          rolePermissions: [
            {
              permission: {
                PermissionID: 1,
                Action: 'manage',
                Subject: 'all',
              },
            },
          ],
          _count: {
            storeUsers: 2,
          },
        },
      ],
    },
  })
  async findAll(@CurrentStore() storeId: number) {
    return await this.rolesService.findAll(storeId);
  }

  @Get(':id')
  @CheckPermission('read', 'Role')
  @ApiOperation({ summary: 'Get a specific role by ID' })
  @ApiParam({ name: 'id', description: 'Role ID' })
  @ApiResponse({ status: 200, description: 'Role details with permissions and users' })
  @ApiResponse({ status: 404, description: 'Role not found' })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentStore() storeId: number,
  ) {
    return await this.rolesService.findOne(id, storeId);
  }

  @Post()
  @CheckPermission('create', 'Role')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new role in current store' })
  @ApiResponse({
    status: 201,
    description: 'Role created successfully',
    schema: {
      example: {
        RoleID: 3,
        StoreID: 1,
        RoleName: 'Kế toán kho',
        Description: 'Quản lý kho hàng và báo cáo tài chính',
        CreatedAt: '2026-01-07T10:00:00.000Z',
        UpdatedAt: '2026-01-07T10:00:00.000Z',
        rolePermissions: [],
      },
    },
  })
  @ApiResponse({ status: 409, description: 'Role name already exists in this store' })
  async create(
    @Body() createRoleDto: CreateRoleDto,
    @CurrentStore() storeId: number,
  ) {
    return await this.rolesService.create(storeId, createRoleDto);
  }

  @Put(':id')
  @CheckPermission('update', 'Role')
  @ApiOperation({ summary: 'Update an existing role' })
  @ApiParam({ name: 'id', description: 'Role ID' })
  @ApiResponse({ status: 200, description: 'Role updated successfully' })
  @ApiResponse({ status: 404, description: 'Role not found' })
  @ApiResponse({ status: 409, description: 'Role name already exists' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateRoleDto: UpdateRoleDto,
    @CurrentStore() storeId: number,
  ) {
    return await this.rolesService.update(id, storeId, updateRoleDto);
  }

  @Delete(':id')
  @CheckPermission('delete', 'Role')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a role (only if no users assigned)' })
  @ApiParam({ name: 'id', description: 'Role ID' })
  @ApiResponse({ status: 200, description: 'Role deleted successfully' })
  @ApiResponse({ status: 403, description: 'Cannot delete role with assigned users' })
  @ApiResponse({ status: 404, description: 'Role not found' })
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentStore() storeId: number,
  ) {
    return await this.rolesService.remove(id, storeId);
  }

  @Post(':id/permissions')
  @CheckPermission('update', 'Role')
  @ApiOperation({ summary: 'Assign permissions to a role' })
  @ApiParam({ name: 'id', description: 'Role ID' })
  @ApiResponse({
    status: 200,
    description: 'Permissions assigned successfully',
    schema: {
      example: {
        RoleID: 3,
        RoleName: 'Kế toán kho',
        rolePermissions: [
          {
            permission: {
              PermissionID: 2,
              Action: 'read',
              Subject: 'Product',
            },
          },
          {
            permission: {
              PermissionID: 3,
              Action: 'create',
              Subject: 'Product',
            },
          },
        ],
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Role or Permission not found' })
  async assignPermissions(
    @Param('id', ParseIntPipe) id: number,
    @Body() assignPermissionsDto: AssignPermissionsDto,
    @CurrentStore() storeId: number,
  ) {
    return await this.rolesService.assignPermissions(
      id,
      storeId,
      assignPermissionsDto,
    );
  }

  @Get(':id/permissions')
  @CheckPermission('read', 'Role')
  @ApiOperation({ summary: 'Get permissions assigned to a role' })
  @ApiParam({ name: 'id', description: 'Role ID' })
  @ApiResponse({ status: 200, description: 'List of permissions' })
  @ApiResponse({ status: 404, description: 'Role not found' })
  async getPermissions(
    @Param('id', ParseIntPipe) id: number,
    @CurrentStore() storeId: number,
  ) {
    return await this.rolesService.getPermissions(id, storeId);
  }
}
