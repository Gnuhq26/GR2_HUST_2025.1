import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { AddMemberDto, UpdateMemberRoleDto } from './dto';

const prisma = new PrismaClient();

@Injectable()
export class StoresService {
  /**
   * Get all members of a store with their roles
   */
  async getMembers(storeId: number) {
    const storeUsers = await prisma.storeUser.findMany({
      where: { StoreID: storeId },
      include: {
        user: {
          select: {
            UserID: true,
            Email: true,
            FullName: true,
            Phone: true,
            Address: true,
            CreatedAt: true,
          },
        },
        role: {
          select: {
            RoleID: true,
            RoleName: true,
            Description: true,
          },
        },
      },
      orderBy: { CreatedAt: 'desc' },
    });

    return storeUsers.map((su) => ({
      userId: su.UserID,
      storeId: su.StoreID,
      user: su.user,
      role: su.role,
      joinedAt: su.CreatedAt,
      updatedAt: su.UpdatedAt,
    }));
  }

  /**
   * Add a member to the store
   */
  async addMember(storeId: number, addMemberDto: AddMemberDto) {
    const { email, roleId, note } = addMemberDto;

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { Email: email },
    });

    if (!user) {
      throw new NotFoundException(
        `User with email "${email}" not found. User must register first.`,
      );
    }

    // Check if user is already a member of this store
    const existingMember = await prisma.storeUser.findUnique({
      where: {
        StoreID_UserID: {
          StoreID: storeId,
          UserID: user.UserID,
        },
      },
    });

    if (existingMember) {
      throw new ConflictException(
        `User "${email}" is already a member of this store`,
      );
    }

    // Verify role exists and belongs to this store
    const role = await prisma.role.findFirst({
      where: {
        RoleID: roleId,
        StoreID: storeId,
      },
    });

    if (!role) {
      throw new NotFoundException(
        `Role with ID ${roleId} not found in this store`,
      );
    }

    // Add user to store
    const storeUser = await prisma.storeUser.create({
      data: {
        StoreID: storeId,
        UserID: user.UserID,
        RoleID: roleId,
      },
      include: {
        user: {
          select: {
            UserID: true,
            Email: true,
            FullName: true,
            Phone: true,
          },
        },
        role: {
          select: {
            RoleID: true,
            RoleName: true,
            Description: true,
          },
        },
      },
    });

    return {
      message: `User "${user.Email}" added to store successfully`,
      member: {
        userId: storeUser.UserID,
        user: storeUser.user,
        role: storeUser.role,
        joinedAt: storeUser.CreatedAt,
      },
    };
  }

  /**
   * Update a member's role in the store
   */
  async updateMemberRole(
    storeId: number,
    userId: number,
    updateMemberRoleDto: UpdateMemberRoleDto,
  ) {
    const { roleId } = updateMemberRoleDto;

    // Verify member exists in store
    const storeUser = await prisma.storeUser.findUnique({
      where: {
        StoreID_UserID: {
          StoreID: storeId,
          UserID: userId,
        },
      },
      include: {
        user: true,
        role: true,
      },
    });

    if (!storeUser) {
      throw new NotFoundException('User is not a member of this store');
    }

    // Verify new role exists and belongs to this store
    const newRole = await prisma.role.findFirst({
      where: {
        RoleID: roleId,
        StoreID: storeId,
      },
    });

    if (!newRole) {
      throw new NotFoundException(
        `Role with ID ${roleId} not found in this store`,
      );
    }

    if (storeUser.RoleID === roleId) {
      throw new BadRequestException(
        `User already has role "${newRole.RoleName}"`,
      );
    }

    // Update role
    const updated = await prisma.storeUser.update({
      where: {
        StoreID_UserID: {
          StoreID: storeId,
          UserID: userId,
        },
      },
      data: {
        RoleID: roleId,
      },
      include: {
        user: {
          select: {
            UserID: true,
            Email: true,
            FullName: true,
          },
        },
        role: {
          select: {
            RoleID: true,
            RoleName: true,
            Description: true,
          },
        },
      },
    });

    return {
      message: `User role updated from "${storeUser.role.RoleName}" to "${newRole.RoleName}"`,
      member: {
        userId: updated.UserID,
        user: updated.user,
        role: updated.role,
        updatedAt: updated.UpdatedAt,
      },
    };
  }

  /**
   * Remove a member from the store
   */
  async removeMember(storeId: number, userId: number) {
    // Verify member exists
    const storeUser = await prisma.storeUser.findUnique({
      where: {
        StoreID_UserID: {
          StoreID: storeId,
          UserID: userId,
        },
      },
      include: {
        user: {
          select: {
            Email: true,
            FullName: true,
          },
        },
      },
    });

    if (!storeUser) {
      throw new NotFoundException('User is not a member of this store');
    }

    // Delete membership
    await prisma.storeUser.delete({
      where: {
        StoreID_UserID: {
          StoreID: storeId,
          UserID: userId,
        },
      },
    });

    return {
      message: `User "${storeUser.user.Email}" removed from store successfully`,
    };
  }

  /**
   * Get store details
   */
  async getStoreDetails(storeId: number) {
    const store = await prisma.store.findUnique({
      where: { StoreID: storeId },
      include: {
        _count: {
          select: {
            storeUsers: true,
            roles: true,
          },
        },
      },
    });

    if (!store) {
      throw new NotFoundException('Store not found');
    }

    return store;
  }
}
