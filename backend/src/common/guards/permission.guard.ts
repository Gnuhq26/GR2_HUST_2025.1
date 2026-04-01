import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { PrismaService } from '../prisma';
import {
  CHECK_PERMISSION_KEY,
  PermissionCheck,
} from '../decorators/check-permission.decorator';
import { StoreInfo } from '../decorators/current-store.decorator';

interface AuthenticatedUser {
  stores?: StoreInfo[];
}

/**
 * Permission Guard for Role-Based Access Control (RBAC)
 *
 * This guard checks if the current user has the required permission
 * in the current store based on their role.
 *
 * NOTE: user.stores is populated fresh from DB on every request via
 * JwtStrategy.validate() which queries the StoreUser table — so roleId
 * is always up-to-date; no stale JWT data issue.
 *
 * Usage: Add @CheckPermission(action, subject) decorator to routes.
 * Requires: User must be authenticated and have a valid store context.
 */
@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

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

    // Passport types request.user as Express.User; cast to our augmented type
    // to access stores (populated fresh from DB by JwtStrategy.validate)
    const request = context.switchToHttp().getRequest<Request>();
    const user = (request as Request & { user?: AuthenticatedUser }).user;

    // Ensure user is authenticated
    if (!user) {
      throw new UnauthorizedException('User not authenticated');
    }

    // Get current store from headers
    const storeIdHeader = request.headers['x-store-id'] as string | undefined;
    const subdomainHeader = request.headers['x-subdomain'] as string | undefined;

    if (!storeIdHeader && !subdomainHeader) {
      throw new ForbiddenException(
        'Store context required. Please provide x-store-id or x-subdomain header',
      );
    }

    // Find the store from user.stores (loaded fresh from DB by JwtStrategy)
    const stores: StoreInfo[] = user.stores ?? [];
    let currentStore: StoreInfo | undefined;

    if (storeIdHeader) {
      const storeId = parseInt(storeIdHeader, 10);
      currentStore = stores.find((s) => s.storeId === storeId);
    } else if (subdomainHeader) {
      currentStore = stores.find((s) => s.subdomain === subdomainHeader);
    }

    if (!currentStore) {
      throw new ForbiddenException(
        'You do not have access to this store or store not found',
      );
    }

    // Check if user has the required permission using current roleId from DB
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

    // Attach resolved store to request for use by @CurrentStore() decorator
    (request as Request & { currentStore?: StoreInfo }).currentStore = currentStore;

    return true;
  }

  /**
   * Check if role has specific permission.
   * Also checks for 'manage all' super admin permission.
   */
  private async checkPermission(
    roleId: number,
    action: string,
    subject: string,
  ): Promise<boolean> {
    // Check for super admin permission (manage all)
    const superAdminPermission = await this.prisma.rolePermission.findFirst({
      where: {
        RoleID: roleId,
        permission: {
          Action: 'manage',
          Subject: 'all',
        },
      },
    });

    if (superAdminPermission) {
      return true;
    }

    // Check for specific permission
    const specificPermission = await this.prisma.rolePermission.findFirst({
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
