import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma';
import { CreateStockReceiptDto } from './dto';

// Type definitions for transaction processing
interface ValidatedItem {
  product: {
    ProductID: number;
    StoreID: number;
    CategoryID: number;
    ProductName: string;
    SKU: string | null;
    BaseUnit: string;
    Description: string | null;
    IsActive: boolean;
    CreatedAt: Date;
    UpdatedAt: Date;
  };
  item: {
    productId: number;
    unitName: string;
    quantity: number;
    unitPrice: number;
  };
  exchangeValue: number;
  quantityInBaseUnit: number;
}

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

  /**
   * Task 22: API Nhập kho với Transaction
   * Logic:
   * 1. Tạo StockReceipt và StockReceiptDetail
   * 2. Với mỗi item, tìm ExchangeValue từ ProductUnit
   * 3. Quy đổi số lượng về BaseUnit
   * 4. Cập nhật Inventory (increment)
   * 5. Nếu bất kỳ bước nào lỗi, rollback toàn bộ
   */
  async createStockReceipt(storeId: number, dto: CreateStockReceiptDto) {
    return await this.prisma.$transaction(async (tx) => {
      // 1. Kiểm tra Supplier có tồn tại và thuộc store này không
      const supplier = await tx.supplier.findFirst({
        where: {
          SupplierID: dto.supplierId,
          StoreID: storeId,
        },
      });

      if (!supplier) {
        throw new NotFoundException('Supplier not found in this store');
      }

      // 2. Tính tổng tiền và validate tất cả items trước
      let totalAmount = 0;
      const validatedItems: ValidatedItem[] = [];

      for (const item of dto.items) {
        // Kiểm tra Product có tồn tại và thuộc store này không
        const product = await tx.product.findFirst({
          where: {
            ProductID: item.productId,
            StoreID: storeId,
          },
        });

        if (!product) {
          throw new NotFoundException(
            `Product ID ${item.productId} not found in this store`,
          );
        }

        // Tìm tỷ lệ quy đổi của UnitName
        let exchangeValue = 1; // Mặc định là 1 nếu nhập theo BaseUnit

        if (item.unitName !== product.BaseUnit) {
          // Nhập theo đơn vị khác BaseUnit, cần tìm tỷ lệ quy đổi
          const productUnit = await tx.productUnit.findFirst({
            where: {
              ProductID: item.productId,
              UnitName: item.unitName,
            },
          });

          if (!productUnit) {
            throw new BadRequestException(
              `Unit "${item.unitName}" not found for product "${product.ProductName}". Available units: ${product.BaseUnit}`,
            );
          }

          exchangeValue = Number(productUnit.ExchangeValue);
        }

        // Tính số lượng theo đơn vị gốc (BaseUnit)
        const quantityInBaseUnit = item.quantity * exchangeValue;

        // Tính tiền của item này
        const itemTotal = item.quantity * item.unitPrice;
        totalAmount += itemTotal;

        validatedItems.push({
          product,
          item,
          exchangeValue,
          quantityInBaseUnit,
        });
      }

      // 3. Tạo StockReceipt
      const receipt = await tx.stockReceipt.create({
        data: {
          StoreID: storeId,
          SupplierID: dto.supplierId,
          TotalAmount: totalAmount,
          Note: dto.note,
        },
      });

      // 4. Tạo StockReceiptDetail và cập nhật Inventory
      const details: any[] = [];

      for (const validated of validatedItems) {
        // Tạo chi tiết phiếu nhập
        const detail = await tx.stockReceiptDetail.create({
          data: {
            ReceiptID: receipt.ReceiptID,
            ProductID: validated.item.productId,
            UnitName: validated.item.unitName,
            Quantity: validated.item.quantity,
            UnitPrice: validated.item.unitPrice,
          },
          include: {
            product: {
              select: {
                ProductID: true,
                ProductName: true,
                SKU: true,
                BaseUnit: true,
              },
            },
          },
        });

        // Đảm bảo Inventory tồn tại
        const inventory = await tx.inventory.findUnique({
          where: {
            StoreID_ProductID: {
              StoreID: storeId,
              ProductID: validated.item.productId,
            },
          },
        });

        if (!inventory) {
          // Tạo mới nếu chưa có
          await tx.inventory.create({
            data: {
              StoreID: storeId,
              ProductID: validated.item.productId,
              Quantity: validated.quantityInBaseUnit,
            },
          });
        } else {
          // Cập nhật số lượng (increment)
          await tx.inventory.update({
            where: {
              StoreID_ProductID: {
                StoreID: storeId,
                ProductID: validated.item.productId,
              },
            },
            data: {
              Quantity: {
                increment: validated.quantityInBaseUnit,
              },
            },
          });
        }

        details.push({
          ...detail,
          quantityInBaseUnit: validated.quantityInBaseUnit,
          exchangeValue: validated.exchangeValue,
        });
      }

      // 5. Trả về kết quả
      return {
        receipt: {
          ReceiptID: receipt.ReceiptID,
          SupplierID: receipt.SupplierID,
          ImportDate: receipt.ImportDate,
          TotalAmount: receipt.TotalAmount,
          Note: receipt.Note,
          supplier: {
            SupplierID: supplier.SupplierID,
            SupplierName: supplier.SupplierName,
          },
        },
        details,
        message: `Stock receipt created successfully. ${details.length} product(s) added to inventory.`,
      };
    });
  }

  /**
   * Task 23: Lấy danh sách tồn kho với filtering
   */
  async getInventory(
    storeId: number,
    search?: string,
    lowStockThreshold?: number,
  ) {
    const inventories = await this.prisma.inventory.findMany({
      where: {
        StoreID: storeId,
        ...(search && {
          product: {
            OR: [
              { ProductName: { contains: search } },
              { SKU: { contains: search } },
            ],
          },
        }),
        ...(lowStockThreshold !== undefined && {
          Quantity: { lte: lowStockThreshold },
        }),
      },
      include: {
        product: {
          select: {
            ProductID: true,
            ProductName: true,
            SKU: true,
            BaseUnit: true,
            IsActive: true,
            category: {
              select: {
                CategoryID: true,
                CategoryName: true,
              },
            },
          },
        },
      },
      orderBy: {
        LastUpdated: 'desc',
      },
    });

    return inventories.map((inv) => ({
      InventoryID: inv.InventoryID,
      ProductID: inv.ProductID,
      ProductName: inv.product.ProductName,
      SKU: inv.product.SKU,
      BaseUnit: inv.product.BaseUnit,
      Quantity: inv.Quantity,
      LastUpdated: inv.LastUpdated,
      IsActive: inv.product.IsActive,
      Category: inv.product.category,
      IsLowStock: lowStockThreshold
        ? Number(inv.Quantity) <= lowStockThreshold
        : false,
    }));
  }

  /**
   * Task 23: Lấy lịch sử nhập hàng của một sản phẩm
   */
  async getProductStockHistory(storeId: number, productId: number) {
    // Kiểm tra product có thuộc store này không
    const product = await this.prisma.product.findFirst({
      where: {
        ProductID: productId,
        StoreID: storeId,
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found in this store');
    }

    const history = await this.prisma.stockReceiptDetail.findMany({
      where: {
        ProductID: productId,
        receipt: {
          StoreID: storeId,
        },
      },
      include: {
        receipt: {
          select: {
            ReceiptID: true,
            ImportDate: true,
            TotalAmount: true,
            Note: true,
            supplier: {
              select: {
                SupplierID: true,
                SupplierName: true,
              },
            },
          },
        },
      },
      orderBy: {
        receipt: {
          ImportDate: 'desc',
        },
      },
    });

    return {
      product: {
        ProductID: product.ProductID,
        ProductName: product.ProductName,
        SKU: product.SKU,
        BaseUnit: product.BaseUnit,
      },
      history: history.map((item) => ({
        DetailID: item.DetailID,
        ReceiptID: item.ReceiptID,
        ImportDate: item.receipt.ImportDate,
        Supplier: item.receipt.supplier,
        UnitName: item.UnitName,
        Quantity: item.Quantity,
        UnitPrice: item.UnitPrice,
        TotalPrice: Number(item.Quantity) * Number(item.UnitPrice),
        Note: item.receipt.Note,
      })),
    };
  }

  /**
   * Task 23: Lấy danh sách phiếu nhập kho
   */
  async getStockReceipts(storeId: number, supplierId?: number) {
    return await this.prisma.stockReceipt.findMany({
      where: {
        StoreID: storeId,
        ...(supplierId && { SupplierID: supplierId }),
      },
      include: {
        supplier: {
          select: {
            SupplierID: true,
            SupplierName: true,
          },
        },
        _count: {
          select: {
            details: true,
          },
        },
      },
      orderBy: {
        ImportDate: 'desc',
      },
    });
  }

  /**
   * Task 23: Lấy chi tiết phiếu nhập kho
   */
  async getStockReceiptDetail(storeId: number, receiptId: number) {
    const receipt = await this.prisma.stockReceipt.findFirst({
      where: {
        ReceiptID: receiptId,
        StoreID: storeId,
      },
      include: {
        supplier: true,
        details: {
          include: {
            product: {
              select: {
                ProductID: true,
                ProductName: true,
                SKU: true,
                BaseUnit: true,
              },
            },
          },
        },
      },
    });

    if (!receipt) {
      throw new NotFoundException('Stock receipt not found in this store');
    }

    return receipt;
  }
}
