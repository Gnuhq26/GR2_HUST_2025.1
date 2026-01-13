import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ReportQueryDto, TopProductsQueryDto } from './dto/report-query.dto';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Báo cáo Doanh thu theo khoảng thời gian
   * Revenue = Tổng TotalAmount của các đơn hàng trong khoảng thời gian
   */
  async getRevenueReport(storeId: number, query: ReportQueryDto) {
    const { startDate, endDate } = query;

    // Tính tổng doanh thu từ các đơn hàng
    const result = await this.prisma.order.aggregate({
      where: {
        StoreID: storeId,
        OrderDate: {
          gte: new Date(startDate),
          lte: new Date(endDate + 'T23:59:59.999Z'), // Bao gồm cả ngày endDate
        },
        Status: {
          not: 'Cancelled', // Không tính đơn đã hủy
        },
      },
      _sum: {
        TotalAmount: true,
      },
      _count: {
        _all: true,
      },
    });

    return {
      startDate,
      endDate,
      totalRevenue: result._sum.TotalAmount || 0,
      totalOrders: result._count._all,
    };
  }

  /**
   * Báo cáo Lợi nhuận theo khoảng thời gian
   * Profit = Σ (Quantity × (UnitPrice - CostPrice))
   */
  async getProfitReport(storeId: number, query: ReportQueryDto) {
    const { startDate, endDate } = query;

    // Lấy tất cả OrderDetails trong khoảng thời gian
    const orderDetails = await this.prisma.orderDetail.findMany({
      where: {
        order: {
          StoreID: storeId,
          OrderDate: {
            gte: new Date(startDate),
            lte: new Date(endDate + 'T23:59:59.999Z'),
          },
          Status: {
            not: 'Cancelled',
          },
        },
      },
      select: {
        Quantity: true,
        UnitPrice: true,
        CostPrice: true,
      },
    });

    // Tính tổng lợi nhuận
    let totalProfit = 0;
    let totalRevenue = 0;
    let totalCost = 0;

    for (const detail of orderDetails) {
      const quantity = Number(detail.Quantity);
      const unitPrice = Number(detail.UnitPrice);
      const costPrice = Number(detail.CostPrice);

      const revenue = quantity * unitPrice;
      const cost = quantity * costPrice;
      const profit = quantity * (unitPrice - costPrice);

      totalRevenue += revenue;
      totalCost += cost;
      totalProfit += profit;
    }

    return {
      startDate,
      endDate,
      totalRevenue,
      totalCost,
      totalProfit,
      profitMargin: totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0,
    };
  }

  /**
   * Top sản phẩm bán chạy nhất
   * Có thể sắp xếp theo doanh thu hoặc số lượng bán
   */
  async getTopProducts(storeId: number, query: TopProductsQueryDto) {
    const { startDate, endDate, sortBy = 'revenue', limit = 10 } = query;

    // Lấy dữ liệu OrderDetail với thông tin sản phẩm
    const orderDetails = await this.prisma.orderDetail.findMany({
      where: {
        order: {
          StoreID: storeId,
          OrderDate: {
            gte: new Date(startDate),
            lte: new Date(endDate + 'T23:59:59.999Z'),
          },
          Status: {
            not: 'Cancelled',
          },
        },
      },
      select: {
        ProductID: true,
        Quantity: true,
        UnitPrice: true,
        product: {
          select: {
            ProductName: true,
            SKU: true,
            BaseUnit: true,
          },
        },
      },
    });

    // Gom nhóm theo ProductID
    const productMap = new Map<
      number,
      {
        productId: number;
        productName: string;
        sku: string | null;
        baseUnit: string;
        totalQuantity: number;
        totalRevenue: number;
      }
    >();

    for (const detail of orderDetails) {
      const productId = detail.ProductID;
      const quantity = Number(detail.Quantity);
      const unitPrice = Number(detail.UnitPrice);
      const revenue = quantity * unitPrice;

      if (productMap.has(productId)) {
        const existing = productMap.get(productId)!;
        existing.totalQuantity += quantity;
        existing.totalRevenue += revenue;
      } else {
        productMap.set(productId, {
          productId,
          productName: detail.product.ProductName,
          sku: detail.product.SKU,
          baseUnit: detail.product.BaseUnit,
          totalQuantity: quantity,
          totalRevenue: revenue,
        });
      }
    }

    // Chuyển Map thành Array và sắp xếp
    let products = Array.from(productMap.values());

    if (sortBy === 'revenue') {
      products.sort((a, b) => b.totalRevenue - a.totalRevenue);
    } else {
      products.sort((a, b) => b.totalQuantity - a.totalQuantity);
    }

    // Giới hạn số lượng
    products = products.slice(0, Number(limit));

    return {
      startDate,
      endDate,
      sortBy,
      products,
    };
  }
}
