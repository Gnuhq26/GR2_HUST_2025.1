import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaClient } from '@prisma/client';
import {
  CHECK_PERMISSION_KEY,
  PermissionCheck,
} from '../decorators/check-permission.decorator';
import { StoreInfo } from '../decorators/current-store.decorator';

const prisma = new PrismaClient();

/**
 * Permission Guard for Role-Based Access Control (RBAC)
 * 
 * This guard checks if the current user has the required permission
 * in the current store based on their role
 * 
 * Usage: Add @CheckPermission(action, subject) decorator to routes
 * Requires: User must be authenticated and have a valid store context
 */
@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Get required permission from decorator
    const requiredPermission = this.reflector.getAllAndOverride<PermissionCheck>(
      CHECK_PERMISSION_KEY,
      [context.getHandler(), context.getClass()],
    );

    // If no permission is required, allow access
    if (!requiredPermission) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Ensure user is authenticated
    if (!user) {
      throw new UnauthorizedException('User not authenticated');
    }

    // Get current store from headers
    const storeIdHeader = request.headers['x-store-id'];
    const subdomainHeader = request.headers['x-subdomain'];

    if (!storeIdHeader && !subdomainHeader) {
      throw new ForbiddenException(
        'Store context required. Please provide x-store-id or x-subdomain header',
      );
    }

    // Find the store from user's stores
    let currentStore: StoreInfo | undefined = undefined;

    if (storeIdHeader) {
      const storeId = parseInt(storeIdHeader as string, 10);
      currentStore = user.stores?.find(
        (s: StoreInfo) => s.storeId === storeId,
      );
    } else if (subdomainHeader) {
      currentStore = user.stores?.find(
        (s: StoreInfo) => s.subdomain === subdomainHeader,
      );
    }

    if (!currentStore) {
      throw new ForbiddenException(
        'You do not have access to this store or store not found',
      );
    }

    // Check if user has the required permission
    const hasPermission = await this.checkPermission(
      currentStore.roleId,
      requiredPermission.action,
      requiredPermission.subject,
    );

    if (!hasPermission) {
      throw new ForbiddenException(
        `You do not have permission to ${requiredPermission.action} ${requiredPermission.subject}`,
      );
    }

    // Store the current store in request for later use
    request.currentStore = currentStore;

    return true;
  }

  /**
   * Check if role has specific permission
   * Also checks for 'manage all' super admin permission
   */
  private async checkPermission(
    roleId: number,
    action: string,
    subject: string,
  ): Promise<boolean> {
    // Check for super admin permission (manage all)
    const superAdminPermission = await prisma.rolePermission.findFirst({
      where: {
        RoleID: roleId,
        permission: {
          Action: 'manage',
          Subject: 'all',
        },
      },
    });

    if (superAdminPermission) {
      return true; // Super admin has all permissions
    }

    // Check for specific permission
    const specificPermission = await prisma.rolePermission.findFirst({
      where: {
        RoleID: roleId,
        permission: {
          Action: action,
          Subject: subject,
        },
      },
    });

    return !!specificPermission;
  }
}
