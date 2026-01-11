import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma';
import { CreateRoleDto, UpdateRoleDto, AssignPermissionsDto } from './dto';

@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) {}
  /**
   * Get all roles in a specific store
   */
  async findAll(storeId: number) {
    return await this.prisma.role.findMany({
      where: { StoreID: storeId },
      include: {
        rolePermissions: {
          include: {
            permission: {
              select: {
                PermissionID: true,
                Action: true,
                Subject: true,
              },
            },
          },
        },
        _count: {
          select: {
            storeUsers: true, // Count how many users have this role
          },
        },
      },
      orderBy: { CreatedAt: 'desc' },
    });
  }

  /**
   * Get a single role by ID
   */
  async findOne(roleId: number, storeId: number) {
    const role = await this.prisma.role.findFirst({
      where: {
        RoleID: roleId,
        StoreID: storeId,
      },
      include: {
        rolePermissions: {
          include: {
            permission: {
              select: {
                PermissionID: true,
                Action: true,
                Subject: true,
              },
            },
          },
        },
        storeUsers: {
          include: {
            user: {
              select: {
                UserID: true,
                Email: true,
                FullName: true,
              },
            },
          },
        },
      },
    });

    if (!role) {
      throw new NotFoundException('Role not found in this store');
    }

    return role;
  }

  /**
   * Create a new role in the store
   */
  async create(storeId: number, createRoleDto: CreateRoleDto) {
    const { roleName, description } = createRoleDto;

    // Check if role name already exists in this store
    const existingRole = await this.prisma.role.findUnique({
      where: {
        StoreID_RoleName: {
          StoreID: storeId,
          RoleName: roleName,
        },
      },
    });

    if (existingRole) {
      throw new ConflictException(
        `Role with name "${roleName}" already exists in this store`,
      );
    }

    return await this.prisma.role.create({
      data: {
        StoreID: storeId,
        RoleName: roleName,
        Description: description,
      },
      include: {
        rolePermissions: {
          include: {
            permission: true,
          },
        },
      },
    });
  }

  /**
   * Update an existing role
   */
  async update(roleId: number, storeId: number, updateRoleDto: UpdateRoleDto) {
    // Verify role belongs to the store
    const role = await this.findOne(roleId, storeId);

    const { roleName, description } = updateRoleDto;

    // If changing role name, check for conflicts
    if (roleName && roleName !== role.RoleName) {
      const existingRole = await this.prisma.role.findUnique({
        where: {
          StoreID_RoleName: {
            StoreID: storeId,
            RoleName: roleName,
          },
        },
      });

      if (existingRole) {
        throw new ConflictException(
          `Role with name "${roleName}" already exists in this store`,
        );
      }
    }

    return await this.prisma.role.update({
      where: { RoleID: roleId },
      data: {
        ...(roleName && { RoleName: roleName }),
        ...(description !== undefined && { Description: description }),
      },
      include: {
        rolePermissions: {
          include: {
            permission: true,
          },
        },
      },
    });
  }

  /**
   * Delete a role (only if no users are assigned to it)
   */
  async remove(roleId: number, storeId: number) {
    // Verify role belongs to the store
    const role = await this.findOne(roleId, storeId);

    // Check if any users have this role
    if (role.storeUsers.length > 0) {
      throw new ForbiddenException(
        `Cannot delete role "${role.RoleName}" because ${role.storeUsers.length} user(s) are assigned to it`,
      );
    }

    await this.prisma.role.delete({
      where: { RoleID: roleId },
    });

    return { message: `Role "${role.RoleName}" deleted successfully` };
  }

  /**
   * Assign permissions to a role
   */
  async assignPermissions(
    roleId: number,
    storeId: number,
    assignPermissionsDto: AssignPermissionsDto,
  ) {
    // Verify role belongs to the store
    await this.findOne(roleId, storeId);

    const { permissionIds } = assignPermissionsDto;

    // Verify all permission IDs exist
    const permissions = await this.prisma.permission.findMany({
      where: {
        PermissionID: { in: permissionIds },
      },
    });

    if (permissions.length !== permissionIds.length) {
      throw new NotFoundException('One or more permission IDs are invalid');
    }

    // Delete existing permissions for this role
    await this.prisma.rolePermission.deleteMany({
      where: { RoleID: roleId },
    });

    // Create new permissions
    const rolePermissions = await this.prisma.rolePermission.createMany({
      data: permissionIds.map((permissionId) => ({
        RoleID: roleId,
        PermissionID: permissionId,
      })),
    });

    // Return updated role with permissions
    return await this.findOne(roleId, storeId);
  }

  /**
   * Get permissions assigned to a role
   */
  async getPermissions(roleId: number, storeId: number) {
    // Verify role belongs to the store
    await this.findOne(roleId, storeId);

    const rolePermissions = await this.prisma.rolePermission.findMany({
      where: { RoleID: roleId },
      include: {
        permission: true,
      },
    });

    return rolePermissions.map((rp) => rp.permission);
  }
}
