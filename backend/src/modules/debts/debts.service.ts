import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { RecordPaymentDto } from './dto/payment.dto';

@Injectable()
export class DebtsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Lấy danh sách công nợ khách hàng
   * Debt = TotalAmount - PaidAmount
   */
  async getCustomerDebts(storeId: number) {
    // Lấy tất cả đơn hàng của khách hàng còn nợ (PaidAmount < TotalAmount)
    const orders = await this.prisma.order.findMany({
      where: {
        StoreID: storeId,
        Status: {
          not: 'Cancelled',
        },
        // Chỉ lấy đơn chưa thanh toán đủ
        PaidAmount: {
          lt: this.prisma.order.fields.TotalAmount,
        },
      },
      select: {
        OrderID: true,
        CustomerID: true,
        TotalAmount: true,
        PaidAmount: true,
        OrderDate: true,
        customer: {
          select: {
            CustomerName: true,
            Phone: true,
          },
        },
      },
      orderBy: {
        OrderDate: 'desc',
      },
    });

    // Gom nhóm theo khách hàng
    const customerMap = new Map<
      number | null,
      {
        customerId: number | null;
        customerName: string;
        phone: string | null;
        totalDebt: number;
        orders: Array<{
          orderId: number;
          orderDate: Date;
          totalAmount: number;
          paidAmount: number;
          remainingAmount: number;
        }>;
      }
    >();

    for (const order of orders) {
      const customerId = order.CustomerID;
      const totalAmount = Number(order.TotalAmount);
      const paidAmount = Number(order.PaidAmount);
      const remainingAmount = totalAmount - paidAmount;

      if (remainingAmount <= 0) continue; // Bỏ qua nếu đã trả đủ

      const customerName = order.customer?.CustomerName || 'Khách vãng lai';
      const phone = order.customer?.Phone || null;

      if (customerMap.has(customerId)) {
        const existing = customerMap.get(customerId)!;
        existing.totalDebt += remainingAmount;
        existing.orders.push({
          orderId: order.OrderID,
          orderDate: order.OrderDate,
          totalAmount,
          paidAmount,
          remainingAmount,
        });
      } else {
        customerMap.set(customerId, {
          customerId,
          customerName,
          phone,
          totalDebt: remainingAmount,
          orders: [
            {
              orderId: order.OrderID,
              orderDate: order.OrderDate,
              totalAmount,
              paidAmount,
              remainingAmount,
            },
          ],
        });
      }
    }

    // Chuyển Map thành Array và sắp xếp theo tổng nợ giảm dần
    const customers = Array.from(customerMap.values()).sort(
      (a, b) => b.totalDebt - a.totalDebt,
    );

    return {
      totalCustomersInDebt: customers.length,
      totalDebtAmount: customers.reduce((sum, c) => sum + c.totalDebt, 0),
      customers,
    };
  }

  /**
   * Lấy danh sách công nợ nhà cung cấp
   * Debt = TotalAmount - PaidAmount
   */
  async getSupplierDebts(storeId: number) {
    // Lấy tất cả phiếu nhập hàng còn nợ
    const receipts = await this.prisma.stockReceipt.findMany({
      where: {
        StoreID: storeId,
        // Chỉ lấy phiếu chưa thanh toán đủ
        PaidAmount: {
          lt: this.prisma.stockReceipt.fields.TotalAmount,
        },
      },
      select: {
        ReceiptID: true,
        SupplierID: true,
        TotalAmount: true,
        PaidAmount: true,
        ImportDate: true,
        supplier: {
          select: {
            SupplierName: true,
            Phone: true,
          },
        },
      },
      orderBy: {
        ImportDate: 'desc',
      },
    });

    // Gom nhóm theo nhà cung cấp
    const supplierMap = new Map<
      number,
      {
        supplierId: number;
        supplierName: string;
        phone: string | null;
        totalDebt: number;
        receipts: Array<{
          receiptId: number;
          importDate: Date;
          totalAmount: number;
          paidAmount: number;
          remainingAmount: number;
        }>;
      }
    >();

    for (const receipt of receipts) {
      const supplierId = receipt.SupplierID;
      const totalAmount = Number(receipt.TotalAmount);
      const paidAmount = Number(receipt.PaidAmount);
      const remainingAmount = totalAmount - paidAmount;

      if (remainingAmount <= 0) continue; // Bỏ qua nếu đã trả đủ

      if (supplierMap.has(supplierId)) {
        const existing = supplierMap.get(supplierId)!;
        existing.totalDebt += remainingAmount;
        existing.receipts.push({
          receiptId: receipt.ReceiptID,
          importDate: receipt.ImportDate,
          totalAmount,
          paidAmount,
          remainingAmount,
        });
      } else {
        supplierMap.set(supplierId, {
          supplierId,
          supplierName: receipt.supplier.SupplierName,
          phone: receipt.supplier.Phone,
          totalDebt: remainingAmount,
          receipts: [
            {
              receiptId: receipt.ReceiptID,
              importDate: receipt.ImportDate,
              totalAmount,
              paidAmount,
              remainingAmount,
            },
          ],
        });
      }
    }

    // Chuyển Map thành Array và sắp xếp theo tổng nợ giảm dần
    const suppliers = Array.from(supplierMap.values()).sort(
      (a, b) => b.totalDebt - a.totalDebt,
    );

    return {
      totalSuppliersInDebt: suppliers.length,
      totalDebtAmount: suppliers.reduce((sum, s) => sum + s.totalDebt, 0),
      suppliers,
    };
  }

  /**
   * Ghi nhận thanh toán (customer hoặc supplier)
   */
  async recordPayment(storeId: number, dto: RecordPaymentDto) {
    const { type, referenceId, amount, note } = dto;

    if (type === 'customer') {
      // Thanh toán từ khách hàng (thu tiền)
      const order = await this.prisma.order.findFirst({
        where: {
          OrderID: referenceId,
          StoreID: storeId,
        },
      });

      if (!order) {
        throw new NotFoundException('Không tìm thấy đơn hàng');
      }

      const totalAmount = Number(order.TotalAmount);
      const paidAmount = Number(order.PaidAmount);
      const remainingAmount = totalAmount - paidAmount;

      if (remainingAmount <= 0) {
        throw new BadRequestException('Đơn hàng đã thanh toán đủ');
      }

      if (amount > remainingAmount) {
        throw new BadRequestException(
          `Số tiền thanh toán (${amount}) vượt quá số tiền còn nợ (${remainingAmount})`,
        );
      }

      // Cập nhật PaidAmount
      const updatedOrder = await this.prisma.order.update({
        where: { OrderID: referenceId },
        data: {
          PaidAmount: {
            increment: amount,
          },
        },
      });

      const newPaidAmount = Number(updatedOrder.PaidAmount);
      const newRemainingAmount = totalAmount - newPaidAmount;

      return {
        type: 'customer',
        orderId: referenceId,
        paymentAmount: amount,
        totalAmount,
        paidAmount: newPaidAmount,
        remainingAmount: newRemainingAmount,
        isFullyPaid: newRemainingAmount <= 0,
        note,
      };
    } else {
      // Thanh toán cho nhà cung cấp (trả tiền)
      const receipt = await this.prisma.stockReceipt.findFirst({
        where: {
          ReceiptID: referenceId,
          StoreID: storeId,
        },
      });

      if (!receipt) {
        throw new NotFoundException('Không tìm thấy phiếu nhập kho');
      }

      const totalAmount = Number(receipt.TotalAmount);
      const paidAmount = Number(receipt.PaidAmount);
      const remainingAmount = totalAmount - paidAmount;

      if (remainingAmount <= 0) {
        throw new BadRequestException('Phiếu nhập đã thanh toán đủ');
      }

      if (amount > remainingAmount) {
        throw new BadRequestException(
          `Số tiền thanh toán (${amount}) vượt quá số tiền còn nợ (${remainingAmount})`,
        );
      }

      // Cập nhật PaidAmount
      const updatedReceipt = await this.prisma.stockReceipt.update({
        where: { ReceiptID: referenceId },
        data: {
          PaidAmount: {
            increment: amount,
          },
        },
      });

      const newPaidAmount = Number(updatedReceipt.PaidAmount);
      const newRemainingAmount = totalAmount - newPaidAmount;

      return {
        type: 'supplier',
        receiptId: referenceId,
        paymentAmount: amount,
        totalAmount,
        paidAmount: newPaidAmount,
        remainingAmount: newRemainingAmount,
        isFullyPaid: newRemainingAmount <= 0,
        note,
      };
    }
  }
}
