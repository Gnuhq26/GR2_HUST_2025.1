import { PrismaService } from '../common/prisma';

/**
 * Utility function để đảm bảo một product có bản ghi Inventory
 * Tạo mới nếu chưa tồn tại với Quantity = 0
 * Sử dụng upsert để tránh race condition khi 2 request đồng thời
 */
export async function ensureInventoryExists(
  prisma: PrismaService,
  storeId: number,
  productId: number,
): Promise<void> {
  await prisma.inventory.upsert({
    where: {
      StoreID_ProductID: {
        StoreID: storeId,
        ProductID: productId,
      },
    },
    update: {}, // Không cập nhật gì nếu đã tồn tại
    create: {
      StoreID: storeId,
      ProductID: productId,
      Quantity: 0,
    },
  });
}

/**
 * Utility function để cập nhật số lượng tồn kho
 * @param prisma PrismaService instance
 * @param storeId Store ID
 * @param productId Product ID
 * @param quantityChange Số lượng thay đổi (dương = nhập, âm = xuất)
 */
export async function updateInventoryQuantity(
  prisma: PrismaService,
  storeId: number,
  productId: number,
  quantityChange: number,
): Promise<void> {
  // Đảm bảo inventory tồn tại
  await ensureInventoryExists(prisma, storeId, productId);

  // Cập nhật số lượng
  await prisma.inventory.update({
    where: {
      StoreID_ProductID: {
        StoreID: storeId,
        ProductID: productId,
      },
    },
    data: {
      Quantity: {
        increment: quantityChange,
      },
    },
  });
}
