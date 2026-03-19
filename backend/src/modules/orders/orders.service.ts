import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma';
import { CreateOrderDto } from './dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Tạo đơn hàng mới với transaction
   * Quy trình:
   * 1. Kiểm tra tồn kho
   * 2. Xác định đơn giá từ PriceList
   * 3. Tạo Order + OrderDetail
   * 4. Trừ tồn kho
   */
  async createOrder(
    storeId: number,
    userId: number,
    createOrderDto: CreateOrderDto,
  ) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Kiểm tra Customer nếu có
      if (createOrderDto.CustomerID) {
        const customer = await tx.customer.findFirst({
          where: {
            CustomerID: createOrderDto.CustomerID,
            StoreID: storeId,
          },
        });

        if (!customer) {
          throw new NotFoundException(
            `Khách hàng với ID ${createOrderDto.CustomerID} không tồn tại`,
          );
        }
      }

      // 2. Xử lý từng item trong đơn hàng
      const orderDetails: Array<{
        ProductID: number;
        UnitName: string;
        Quantity: Prisma.Decimal;
        UnitPrice: Prisma.Decimal;
      }> = [];

      let totalAmount = new Prisma.Decimal(0);

      for (const item of createOrderDto.items) {
        // 2.1. Lấy thông tin sản phẩm
        const product = await tx.product.findFirst({
          where: {
            ProductID: item.ProductID,
            StoreID: storeId,
            IsActive: true,
          },
          include: {
            units: true,
            prices: {
              orderBy: {
                MinQuantity: 'desc', // Ưu tiên giá có MinQuantity cao nhất
              },
            },
          },
        });

        if (!product) {
          throw new NotFoundException(
            `Sản phẩm với ID ${item.ProductID} không tồn tại hoặc không hoạt động`,
          );
        }

        // 2.2. Tìm ExchangeValue của đơn vị bán
        let exchangeValue = new Prisma.Decimal(1); // Mặc định nếu bán theo BaseUnit

        if (item.UnitName !== product.BaseUnit) {
          const unit = product.units.find((u) => u.UnitName === item.UnitName);
          if (!unit) {
            throw new BadRequestException(
              `Đơn vị "${item.UnitName}" không tồn tại cho sản phẩm ${product.ProductName}`,
            );
          }
          exchangeValue = unit.ExchangeValue;
        }

        // 2.3. Tính số lượng cần trừ trong kho (quy về BaseUnit)
        const quantityInBaseUnit = new Prisma.Decimal(item.Quantity).mul(
          exchangeValue,
        );

        // 2.4. Kiểm tra tồn kho
        const inventory = await tx.inventory.findFirst({
          where: {
            StoreID: storeId,
            ProductID: item.ProductID,
          },
        });

        if (!inventory) {
          throw new BadRequestException(
            `Sản phẩm ${product.ProductName} chưa có trong kho`,
          );
        }

        const availableQty = inventory.Quantity
          .add(inventory.InTransitQty)
          .sub(inventory.ReservedQty);

        if (availableQty.lt(quantityInBaseUnit)) {
          throw new BadRequestException(
            `Sản phẩm ${product.ProductName} không đủ tồn kho. ` +
            `Khả dụng: ${availableQty.toString()} ${product.BaseUnit}, ` +
            `cần: ${quantityInBaseUnit.toString()} ${product.BaseUnit}`,
          );
        }

        // 2.5. Xác định đơn giá từ PriceList
        // Tìm giá phù hợp dựa trên UnitName và số lượng mua
        let unitPrice = new Prisma.Decimal(0);
        
        // Lọc giá theo đúng đơn vị bán
        const matchingPrices = product.prices.filter(
          (p) => p.UnitName === item.UnitName,
        );

        if (matchingPrices.length === 0) {
          throw new BadRequestException(
            `Sản phẩm ${product.ProductName} chưa có giá bán cho đơn vị ${item.UnitName}`,
          );
        }

        // Sắp xếp theo MinQuantity giảm dần
        const sortedPrices = matchingPrices.sort(
          (a, b) => b.MinQuantity - a.MinQuantity,
        );

        // Tìm giá phù hợp với số lượng
        for (const price of sortedPrices) {
          if (item.Quantity >= price.MinQuantity) {
            unitPrice = price.UnitPrice;
            break;
          }
        }

        // Nếu không tìm thấy giá phù hợp, lấy giá có MinQuantity thấp nhất
        if (unitPrice.isZero()) {
          unitPrice = sortedPrices[sortedPrices.length - 1].UnitPrice;
        }

        // 2.6. Tính thành tiền
        const itemTotal = new Prisma.Decimal(item.Quantity).mul(unitPrice);
        totalAmount = totalAmount.add(itemTotal);

        // 2.7. Thêm vào danh sách OrderDetail
        orderDetails.push({
          ProductID: item.ProductID,
          UnitName: item.UnitName,
          Quantity: new Prisma.Decimal(item.Quantity),
          UnitPrice: unitPrice,
        });

        // 2.8. Trừ tồn kho
        const deliveryMethod = createOrderDto.DeliveryMethod ?? 'Immediate';

if (deliveryMethod === 'Reserved') {
  // Khách gửi kho: tăng ReservedQty, chưa trừ Quantity
  await tx.inventory.update({
    where: { InventoryID: inventory.InventoryID },
            data: { ReservedQty: { increment: quantityInBaseUnit } },
          });
        } else {
          // Immediate hoặc DirectShip: trừ thẳng Quantity
          await tx.inventory.update({
            where: { InventoryID: inventory.InventoryID },
            data: { Quantity: { decrement: quantityInBaseUnit } },
          });
        }
      }

      // 3. Tạo Order
      const order = await tx.order.create({
        data: {
          store: {
            connect: { StoreID: storeId },
          },
          customer: createOrderDto.CustomerID
            ? { connect: { CustomerID: createOrderDto.CustomerID } }
            : undefined,
          user: {
            connect: { UserID: userId },
          },
          TotalAmount: totalAmount,
          DeliveryMethod: createOrderDto.DeliveryMethod ?? 'Immediate',
          Note: createOrderDto.Note || null,
          details: {
            create: orderDetails,
          },
        },
        include: {
          details: {
            include: {
              product: {
                select: {
                  ProductName: true,
                  SKU: true,
                  BaseUnit: true,
                },
              },
            },
          },
          customer: {
            select: {
              CustomerName: true,
              Phone: true,
            },
          },
          user: {
            select: {
              FullName: true,
              Email: true,
            },
          },
        },
      });

      return order;
    });
  }

  /**
   * Lấy danh sách đơn hàng
   */
  async findAll(storeId: number) {
    return this.prisma.order.findMany({
      where: { StoreID: storeId },
      include: {
        customer: {
          select: {
            CustomerName: true,
            Phone: true,
          },
        },
        user: {
          select: {
            FullName: true,
            Email: true,
          },
        },
        _count: {
          select: {
            details: true,
          },
        },
      },
      orderBy: { OrderDate: 'desc' },
    });
  }

  /**
   * Lấy chi tiết đơn hàng
   */
  async findOne(storeId: number, id: number) {
    const order = await this.prisma.order.findFirst({
      where: {
        OrderID: id,
        StoreID: storeId,
      },
      include: {
        details: {
          include: {
            product: {
              select: {
                ProductName: true,
                SKU: true,
                BaseUnit: true,
              },
            },
          },
        },
        customer: {
          select: {
            CustomerName: true,
            Phone: true,
            Address: true,
          },
        },
        user: {
          select: {
            FullName: true,
            Email: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException(`Đơn hàng với ID ${id} không tồn tại`);
    }

    return order;
  }
}
