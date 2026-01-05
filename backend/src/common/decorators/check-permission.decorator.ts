import { SetMetadata } from '@nestjs/common';

/**
 * Decorator to check if user has specific permission in current store
 * Works with PermissionGuard to enforce RBAC
 * 
 * @param action - The action to check (e.g., 'read', 'create', 'update', 'delete', 'manage')
 * @param subject - The subject/resource (e.g., 'Product', 'Order', 'User', 'all')
 * 
 * @example
 * @CheckPermission('create', 'Product')
 * @Post('products')
 * async createProduct() { ... }
 * 
 * @example Super Admin check
 * @CheckPermission('manage', 'all')
 * @Delete('stores/:id')
 * async deleteStore() { ... }
 */
export const CHECK_PERMISSION_KEY = 'checkPermission';

export interface PermissionCheck {
  action: string;
  subject: string;
}

export const CheckPermission = (action: string, subject: string) => {
  const permission: PermissionCheck = { action, subject };
  return SetMetadata(CHECK_PERMISSION_KEY, permission);
};
