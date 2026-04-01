import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma';
import { CreateStockReceiptDto } from './dto';
import { DirectShipDto } from './dto/direct-ship.dto';

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
          Status: dto.status ?? 'Received',
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

        // Phân nhánh theo status
        const isPending = (dto.status ?? 'Received') === 'Pending';
        const oldPhysical = inventory ? Number(inventory.Quantity) : 0;
        const oldInTransit = inventory ? Number(inventory.InTransitQty) : 0;

        // Phân nhánh theo status
        const isPending = (dto.status ?? 'Received') === 'Pending';
        if (!inventory) {
          // Tạo mới nếu chưa có
          await tx.inventory.create({
            data: {
              StoreID: storeId,
              ProductID: validated.item.productId,
              Quantity: isPending ? 0 : validated.quantityInBaseUnit,
              InTransitQty: isPending ? validated.quantityInBaseUnit : 0,
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
            data: isPending
              ? { InTransitQty: { increment: validated.quantityInBaseUnit } }
              : { Quantity:     { increment: validated.quantityInBaseUnit } },
          });
        }

        // Ghi InventoryLog
        const logOldQty = isPending ? oldInTransit : oldPhysical;
        await tx.inventoryLog.create({
          data: {
            StoreID: storeId,
            ProductID: validated.item.productId,
            ChangeType: 'IN',
            QuantityType: isPending ? 'InTransit' : 'Physical',
            ReferenceType: 'StockReceipt',
            ReferenceID: receipt.ReceiptID,
            OldQuantity: logOldQty,
            ChangeQuantity: validated.quantityInBaseUnit,
            NewQuantity: logOldQty + validated.quantityInBaseUnit,
          },
        });

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

    const mappedInventories = inventories.map((inv) => {
      const physical   = Number(inv.Quantity);
      const reserved   = Number(inv.ReservedQty);
      const inTransit  = Number(inv.InTransitQty);
      const available  = physical + inTransit - reserved;

      return {
        InventoryID: inv.InventoryID,
        ProductID: inv.ProductID,
        ProductName: inv.product.ProductName,
        SKU: inv.product.SKU,
        BaseUnit: inv.product.BaseUnit,
        Quantity: physical,
        ReservedQty: reserved,
        InTransitQty: inTransit,
        AvailableQty: available,
        LastUpdated: inv.LastUpdated,
        IsActive: inv.product.IsActive,
        Category: inv.product.category,
        IsLowStock: lowStockThreshold ? available <= lowStockThreshold : false,
      };
    });

    if (lowStockThreshold === undefined) {
      return mappedInventories;
    }

    return mappedInventories.filter(
      (item) => item.AvailableQty <= lowStockThreshold,
    );
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

  async directShipTransaction(storeId: number, userId: number, dto: DirectShipDto) {
    return await this.prisma.$transaction(async (tx) => {
      if (dto.totalQty <= 0 || dto.deliverQty < 0) {
        throw new BadRequestException('Số lượng không hợp lệ');
      }

      if (dto.deliverQty > dto.totalQty) {
        throw new BadRequestException('deliverQty không được lớn hơn totalQty');
      }

      // 1. Tìm ExchangeValue
      const product = await tx.product.findFirst({
        where: { ProductID: dto.productId, StoreID: storeId },
      });
      if (!product) throw new NotFoundException('Product not found');

      let exchangeValue = 1;
      if (dto.unitName !== product.BaseUnit) {
        const productUnit = await tx.productUnit.findFirst({
          where: { ProductID: dto.productId, UnitName: dto.unitName },
        });
        if (!productUnit) throw new BadRequestException('Unit not found');
        exchangeValue = Number(productUnit.ExchangeValue);
      }

      const totalInBase   = dto.totalQty   * exchangeValue;
      const deliverInBase = dto.deliverQty * exchangeValue;
      const stockInBase   = totalInBase - deliverInBase; // phần thực vào kho

      // 2. Tạo StockReceipt (toàn bộ hàng, status Received)
      const receipt = await tx.stockReceipt.create({
        data: {
          StoreID: storeId,
          SupplierID: dto.supplierId,
          Status: 'Received',
          TotalAmount: dto.totalQty * dto.importUnitPrice,
          PaidAmount: 0,
          Note: dto.note,
          details: {
            create: {
              ProductID: dto.productId,
              UnitName: dto.unitName,
              Quantity: dto.totalQty,
              UnitPrice: dto.importUnitPrice,
            },
          },
        },
      });

      // 3. Tạo Order (phần giao thẳng)
      const order = await tx.order.create({
        data: {
          StoreID: storeId,
          UserID: userId,
          CustomerID: dto.customerId ?? null,
          DeliveryMethod: 'DirectShip',
          LinkedReceiptID: receipt.ReceiptID,
          TotalAmount: dto.deliverQty * dto.saleUnitPrice,
          PaidAmount: 0,
          Status: 'Completed',
          Note: dto.note,
          details: {
            create: {
              ProductID: dto.productId,
              UnitName: dto.unitName,
              Quantity: dto.deliverQty,
              UnitPrice: dto.saleUnitPrice,
              CostPrice: dto.importUnitPrice,
            },
          },
        },
      });

      // 4. Chỉ cộng phần dư vào kho (stockInBase, không phải totalInBase)
      const inventory = await tx.inventory.findUnique({
        where: { StoreID_ProductID: { StoreID: storeId, ProductID: dto.productId } },
      });

      const updated = await tx.inventory.upsert({
        where: { StoreID_ProductID: { StoreID: storeId, ProductID: dto.productId } },
        create: { StoreID: storeId, ProductID: dto.productId, Quantity: stockInBase },
        update: { Quantity: { increment: stockInBase } },
      });

      // 5. Ghi InventoryLog
      await tx.inventoryLog.create({
        data: {
          StoreID: storeId,
          ProductID: dto.productId,
          QuantityType: 'Physical',
          ChangeType: 'IN',
          ReferenceType: 'DirectShip',
          ReferenceID: receipt.ReceiptID,
          OldQuantity: inventory?.Quantity ?? 0,
          ChangeQuantity: stockInBase,
          NewQuantity: updated.Quantity,
          Note: `Giao thẳng ${dto.deliverQty} ${dto.unitName} cho khách, nhập kho ${dto.totalQty - dto.deliverQty} ${dto.unitName}`,
          CreatedBy: userId,
        },
      });

      return { receipt, order, stockAdded: stockInBase };
    });
  }

  /**
   * Xác nhận nhập kho: chuyển StockReceipt từ Pending → Received
   * Logic:
   * 1. Kiểm tra phiếu thuộc store, đang Pending
   * 2. Với từng item: giảm InTransitQty, tăng Quantity (trong một update)
   * 3. Ghi InventoryLog x2 cho mỗi item (InTransit ↓ và Physical ↑)
   * 4. Cập nhật Status = Received
   */
  async fulfillReceipt(storeId: number, receiptId: number, userId: number) {
    return await this.prisma.$transaction(async (tx) => {
      // 1. Tìm phiếu nhập, kiểm tra thuộc store và đang Pending
      const receipt = await tx.stockReceipt.findFirst({
        where: { ReceiptID: receiptId, StoreID: storeId },
        include: { details: true, supplier: true },
      });

      if (!receipt) {
        throw new NotFoundException('Phiếu nhập không tồn tại trong cửa hàng này');
      }

      if (receipt.Status !== 'Pending') {
        throw new BadRequestException(
          `Phiếu nhập đang ở trạng thái "${receipt.Status}", chỉ có thể xác nhận phiếu Pending`,
        );
      }

      // 2. Xử lý từng item: chuyển InTransit → Physical
      for (const detail of receipt.details) {
        const product = await tx.product.findUnique({
          where: { ProductID: detail.ProductID },
          select: {
            BaseUnit: true,
            units: { select: { UnitName: true, ExchangeValue: true } },
          },
        });

        let exchangeValue = 1;
        if (product && detail.UnitName !== product.BaseUnit) {
          const unit = product.units.find((u) => u.UnitName === detail.UnitName);
          if (unit) exchangeValue = Number(unit.ExchangeValue);
        }

        const quantityInBase = Number(detail.Quantity) * exchangeValue;

        const inventory = await tx.inventory.findUnique({
          where: { StoreID_ProductID: { StoreID: storeId, ProductID: detail.ProductID } },
        });

        if (!inventory) continue;

        const oldInTransit = Number(inventory.InTransitQty);
        const oldPhysical = Number(inventory.Quantity);

        await tx.inventory.update({
          where: { StoreID_ProductID: { StoreID: storeId, ProductID: detail.ProductID } },
          data: {
            InTransitQty: { decrement: quantityInBase },
            Quantity: { increment: quantityInBase },
          },
        });

        // Ghi log x2: giảm InTransit và tăng Physical
        await tx.inventoryLog.createMany({
          data: [
            {
              StoreID: storeId,
              ProductID: detail.ProductID,
              ChangeType: 'IN',
              QuantityType: 'InTransit',
              ReferenceType: 'StockReceipt',
              ReferenceID: receiptId,
              OldQuantity: oldInTransit,
              ChangeQuantity: -quantityInBase,
              NewQuantity: oldInTransit - quantityInBase,
              CreatedBy: userId,
            },
            {
              StoreID: storeId,
              ProductID: detail.ProductID,
              ChangeType: 'IN',
              QuantityType: 'Physical',
              ReferenceType: 'StockReceipt',
              ReferenceID: receiptId,
              OldQuantity: oldPhysical,
              ChangeQuantity: quantityInBase,
              NewQuantity: oldPhysical + quantityInBase,
              CreatedBy: userId,
            },
          ],
        });
      }

      // 3. Cập nhật trạng thái phiếu nhập
      return await tx.stockReceipt.update({
        where: { ReceiptID: receiptId },
        data: { Status: 'Received' },
        include: {
          supplier: { select: { SupplierID: true, SupplierName: true } },
          details: true,
        },
      });
    });
  }
}
