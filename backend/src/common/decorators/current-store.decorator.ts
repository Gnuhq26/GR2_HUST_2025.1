import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

export interface StoreInfo {
  storeId: number;
  storeName: string;
  subdomain: string;
  roleId: number;
  roleName: string;
}

interface AuthenticatedUser {
  stores?: StoreInfo[];
}

/**
 * Decorator to extract current store information from request
 * Store can be identified by:
 * 1. x-store-id header (priority)
 * 2. subdomain from x-subdomain header
 * 
 * @example
 * @Get('products')
 * async getProducts(@CurrentStore() storeId: number) {
 *   return this.productService.findAll(storeId);
 * }
 * 
 * @example with full store info
 * @Get('dashboard')
 * async getDashboard(@CurrentStore('full') store: StoreInfo) {
 *   // store contains: { storeId, storeName, subdomain, roleId, roleName }
 * }
 */
export const CurrentStore = createParamDecorator(
  (data: 'id' | 'full' | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const user = (request as Request & { user?: AuthenticatedUser }).user;

    // Get store identifier from headers
    const storeIdHeader = request.headers['x-store-id'] as string | undefined;
    const subdomainHeader = request.headers['x-subdomain'] as string | undefined;

    if (!user?.stores || user.stores.length === 0) {
      return null;
    }

    let currentStore: StoreInfo | undefined = undefined;

    // Priority 1: Find by store ID from header
    if (storeIdHeader) {
      const storeId = parseInt(storeIdHeader, 10);
      currentStore = user.stores.find(
        (s: StoreInfo) => s.storeId === storeId,
      );
    }

    // Priority 2: Find by subdomain from header
    if (!currentStore && subdomainHeader) {
      currentStore = user.stores.find(
        (s: StoreInfo) => s.subdomain === subdomainHeader,
      );
    }

    // Không tự động fallback sang store đầu tiên - yêu cầu chỉ định rõ ràng
    if (!currentStore) {
      return null;
    }

    // Return based on requested data
    if (data === 'id') {
      return currentStore.storeId;
    }

    if (data === 'full') {
      return currentStore;
    }

    // Default: return store ID
    return currentStore.storeId;
  },
);
