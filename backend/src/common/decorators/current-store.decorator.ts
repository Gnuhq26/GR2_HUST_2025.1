import { createParamDecorator, ExecutionContext } from '@nestjs/common';

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
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    // Get store identifier from headers
    const storeIdHeader = request.headers['x-store-id'];
    const subdomainHeader = request.headers['x-subdomain'];

    if (!user?.stores || user.stores.length === 0) {
      return null;
    }

    let currentStore: StoreInfo | undefined = undefined;

    // Priority 1: Find by store ID from header
    if (storeIdHeader) {
      const storeId = parseInt(storeIdHeader as string, 10);
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

    // Priority 3: Use first store if no header specified
    if (!currentStore) {
      currentStore = user.stores[0];
    }

    // Return based on requested data
    if (data === 'id') {
      return currentStore?.storeId || null;
    }

    if (data === 'full') {
      return currentStore || null;
    }

    // Default: return store ID
    return currentStore?.storeId || null;
  },
);

export interface StoreInfo {
  storeId: number;
  storeName: string;
  subdomain: string;
  roleId: number;
  roleName: string;
}
