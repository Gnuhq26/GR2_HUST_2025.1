import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { PermissionsService } from './permissions.service';
import { CheckPermission } from '../../common/decorators/check-permission.decorator';

@ApiTags('Permissions')
@ApiBearerAuth('JWT-auth')
@Controller('permissions')
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Get()
  @CheckPermission('read', 'Permission')
  @ApiOperation({ summary: 'Get all available permissions in the system' })
  @ApiResponse({
    status: 200,
    description: 'List of all permissions',
    schema: {
      example: [
        {
          PermissionID: 1,
          Action: 'manage',
          Subject: 'all',
          CreatedAt: '2026-01-01T00:00:00.000Z',
          UpdatedAt: '2026-01-01T00:00:00.000Z',
        },
        {
          PermissionID: 2,
          Action: 'read',
          Subject: 'Product',
          CreatedAt: '2026-01-01T00:00:00.000Z',
          UpdatedAt: '2026-01-01T00:00:00.000Z',
        },
        {
          PermissionID: 3,
          Action: 'create',
          Subject: 'Product',
          CreatedAt: '2026-01-01T00:00:00.000Z',
          UpdatedAt: '2026-01-01T00:00:00.000Z',
        },
      ],
    },
  })
  async findAll() {
    return await this.permissionsService.findAll();
  }

  @Get('grouped')
  @CheckPermission('read', 'Permission')
  @ApiOperation({ summary: 'Get permissions grouped by subject' })
  @ApiResponse({
    status: 200,
    description: 'Permissions grouped by subject for easier UI rendering',
    schema: {
      example: {
        all: [
          {
            PermissionID: 1,
            Action: 'manage',
            Subject: 'all',
          },
        ],
        Product: [
          {
            PermissionID: 2,
            Action: 'read',
            Subject: 'Product',
          },
          {
            PermissionID: 3,
            Action: 'create',
            Subject: 'Product',
          },
        ],
        Order: [
          {
            PermissionID: 6,
            Action: 'read',
            Subject: 'Order',
          },
          {
            PermissionID: 7,
            Action: 'create',
            Subject: 'Order',
          },
        ],
      },
    },
  })
  async findGrouped() {
    return await this.permissionsService.findGrouped();
  }

  @Get(':id')
  @CheckPermission('read', 'Permission')
  @ApiOperation({ summary: 'Get a specific permission by ID' })
  @ApiParam({ name: 'id', description: 'Permission ID' })
  @ApiResponse({ status: 200, description: 'Permission details' })
  @ApiResponse({ status: 404, description: 'Permission not found' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.permissionsService.findOne(id);
  }
}
