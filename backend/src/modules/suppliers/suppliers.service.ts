import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma';
import { CreateSupplierDto, UpdateSupplierDto } from './dto';

@Injectable()
export class SuppliersService {
  constructor(private prisma: PrismaService) {}

  /**
   * Tạo nhà cung cấp mới
   */
  async create(storeId: number, dto: CreateSupplierDto) {
    // Kiểm tra tên nhà cung cấp có bị trùng không
    const existing = await this.prisma.supplier.findUnique({
      where: {
        StoreID_SupplierName: {
          StoreID: storeId,
          SupplierName: dto.supplierName,
        },
      },
    });

    if (existing) {
      throw new ConflictException(
        'Supplier name already exists in this store',
      );
    }

    return await this.prisma.supplier.create({
      data: {
        StoreID: storeId,
        SupplierName: dto.supplierName,
        Phone: dto.phone,
        Address: dto.address,
      },
    });
  }

  /**
   * Lấy danh sách tất cả nhà cung cấp của store
   */
  async findAll(storeId: number, search?: string) {
    return await this.prisma.supplier.findMany({
      where: {
        StoreID: storeId,
        ...(search && {
          OR: [
            { SupplierName: { contains: search } },
            { Phone: { contains: search } },
          ],
        }),
      },
      include: {
        _count: {
          select: {
            receipts: true, // Đếm số phiếu nhập từ nhà cung cấp này
          },
        },
      },
      orderBy: {
        CreatedAt: 'desc',
      },
    });
  }

  /**
   * Lấy chi tiết nhà cung cấp
   */
  async findOne(storeId: number, supplierId: number) {
    const supplier = await this.prisma.supplier.findFirst({
      where: {
        SupplierID: supplierId,
        StoreID: storeId,
      },
      include: {
        _count: {
          select: {
            receipts: true, // Đếm số phiếu nhập từ nhà cung cấp này
          },
        },
      },
    });

    if (!supplier) {
      throw new NotFoundException('Supplier not found in this store');
    }

    return supplier;
  }

  /**
   * Cập nhật nhà cung cấp
   */
  async update(
    storeId: number,
    supplierId: number,
    dto: UpdateSupplierDto,
  ) {
    // Kiểm tra nhà cung cấp có tồn tại không
    await this.findOne(storeId, supplierId);

    // Kiểm tra tên mới có bị trùng không (nếu có)
    if (dto.supplierName) {
      const existing = await this.prisma.supplier.findUnique({
        where: {
          StoreID_SupplierName: {
            StoreID: storeId,
            SupplierName: dto.supplierName,
          },
        },
      });

      if (existing && existing.SupplierID !== supplierId) {
        throw new ConflictException(
          'Supplier name already exists in this store',
        );
      }
    }

    return await this.prisma.supplier.update({
      where: { SupplierID: supplierId },
      data: {
        SupplierName: dto.supplierName,
        Phone: dto.phone,
        Address: dto.address,
      },
    });
  }

  /**
   * Xóa nhà cung cấp
   */
  async remove(storeId: number, supplierId: number) {
    // Kiểm tra nhà cung cấp có tồn tại không
    const supplier = await this.findOne(storeId, supplierId);

    // Kiểm tra có phiếu nhập nào từ nhà cung cấp này không
    const receiptCount = await this.prisma.stockReceipt.count({
      where: { SupplierID: supplierId },
    });

    if (receiptCount > 0) {
      throw new ConflictException(
        `Cannot delete supplier "${supplier.SupplierName}" because it has ${receiptCount} stock receipt(s)`,
      );
    }

    return await this.prisma.supplier.delete({
      where: { SupplierID: supplierId },
    });
  }
}
