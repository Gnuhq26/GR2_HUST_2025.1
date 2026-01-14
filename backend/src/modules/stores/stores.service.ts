import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma';
import { AddMemberDto, UpdateMemberRoleDto, CreateStoreDto } from './dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class StoresService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new store with default roles
   * Automatically assigns the creator as Admin
   * Users can create multiple stores (for business expansion or multiple locations)
   */
  async createStore(userId: number, createStoreDto: CreateStoreDto) {
    const { storeName, subdomain, phone, address } = createStoreDto;

    // Check if subdomain already exists
    const existingStore = await this.prisma.store.findUnique({
      where: { Subdomain: subdomain },
    });

    if (existingStore) {
      throw new ConflictException(`Subdomain "${subdomain}" is already taken`);
    }

    // Create store with default roles and assign creator as Admin
    const store = await this.prisma.$transaction(async (tx) => {
      // 1. Create Store
      const newStore = await tx.store.create({
        data: {
          StoreName: storeName,
          Subdomain: subdomain,
          Phone: phone,
          Address: address,
          Status: 'Active',
        },
      });

      // 2. Create default Roles
      const adminRole = await tx.role.create({
        data: {
          StoreID: newStore.StoreID,
          RoleName: 'Chủ cửa hàng',
          Description: 'Toàn quyền quản lý cửa hàng',
        },
      });

      await tx.role.createMany({
        data: [
          {
            StoreID: newStore.StoreID,
            RoleName: 'Quản lý',
            Description: 'Quản lý cửa hàng, xem báo cáo',
          },
          {
            StoreID: newStore.StoreID,
            RoleName: 'Nhân viên bán hàng',
            Description: 'Bán hàng, quản lý đơn hàng',
          },
          {
            StoreID: newStore.StoreID,
            RoleName: 'Thủ kho',
            Description: 'Quản lý kho hàng, nhập xuất',
          },
        ],
      });

      // 3. Assign "manage all" permission to Admin role (PermissionID = 1)
      await tx.rolePermission.create({
        data: {
          RoleID: adminRole.RoleID,
          PermissionID: 1, // manage:all - highest permission
        },
      });

      // 4. Assign creator as Admin
      await tx.storeUser.create({
        data: {
          StoreID: newStore.StoreID,
          UserID: userId,
          RoleID: adminRole.RoleID,
        },
      });

      return newStore;
    });

    return {
      message: 'Store created successfully',
      store: {
        storeId: store.StoreID,
        storeName: store.StoreName,
        subdomain: store.Subdomain,
        phone: store.Phone,
        address: store.Address,
        status: store.Status,
        createdAt: store.CreatedAt,
      },
    };
  }

  /**
   * Get all members of a store with their roles
   */
  async getMembers(storeId: number) {
    const storeUsers = await this.prisma.storeUser.findMany({
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
   * If user doesn't exist, create a new user with default password (123456)
   */
  async addMember(storeId: number, addMemberDto: AddMemberDto) {
    const { email, roleId, note } = addMemberDto;

    // Find or create user by email
    let user = await this.prisma.user.findUnique({
      where: { Email: email },
    });

    // If user doesn't exist, create new user with default password
    if (!user) {
      const defaultPassword = '123456';
      const hashedPassword = await bcrypt.hash(defaultPassword, 10);

      user = await this.prisma.user.create({
        data: {
          Email: email,
          PasswordHash: hashedPassword,
          FullName: email.split('@')[0], // Use email prefix as default name
        },
      });
    }

    // Check if user is already a member of this store
    const existingMember = await this.prisma.storeUser.findUnique({
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
    const role = await this.prisma.role.findFirst({
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
    const storeUser = await this.prisma.storeUser.create({
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
    const storeUser = await this.prisma.storeUser.findUnique({
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
    const newRole = await this.prisma.role.findFirst({
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
    const updated = await this.prisma.storeUser.update({
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
    const storeUser = await this.prisma.storeUser.findUnique({
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
    await this.prisma.storeUser.delete({
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
    const store = await this.prisma.store.findUnique({
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
