import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma';
import { CreateCustomerDto, UpdateCustomerDto } from './dto';

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Tạo khách hàng mới
   */
  async create(storeId: number, createCustomerDto: CreateCustomerDto) {
    // Kiểm tra xem store có tồn tại không
    const store = await this.prisma.store.findUnique({
      where: { StoreID: storeId },
    });

    if (!store) {
      throw new NotFoundException(`Cửa hàng với ID ${storeId} không tồn tại`);
    }

    // Tạo khách hàng mới
    return this.prisma.customer.create({
      data: {
        StoreID: storeId,
        ...createCustomerDto,
      },
    });
  }

  /**
   * Lấy danh sách khách hàng của cửa hàng
   */
  async findAll(storeId: number) {
    return this.prisma.customer.findMany({
      where: { StoreID: storeId },
      orderBy: { CreatedAt: 'desc' },
    });
  }

  /**
   * Lấy thông tin chi tiết khách hàng
   */
  async findOne(storeId: number, id: number) {
    const customer = await this.prisma.customer.findFirst({
      where: {
        CustomerID: id,
        StoreID: storeId,
      },
      include: {
        orders: {
          orderBy: { OrderDate: 'desc' },
          take: 10, // Chỉ lấy 10 đơn hàng gần nhất
        },
      },
    });

    if (!customer) {
      throw new NotFoundException(`Khách hàng với ID ${id} không tồn tại`);
    }

    return customer;
  }

  /**
   * Cập nhật thông tin khách hàng
   */
  async update(
    storeId: number,
    id: number,
    updateCustomerDto: UpdateCustomerDto,
  ) {
    // Kiểm tra khách hàng có tồn tại và thuộc về cửa hàng không
    const customer = await this.prisma.customer.findFirst({
      where: {
        CustomerID: id,
        StoreID: storeId,
      },
    });

    if (!customer) {
      throw new NotFoundException(`Khách hàng với ID ${id} không tồn tại`);
    }

    // Cập nhật thông tin
    return this.prisma.customer.update({
      where: { CustomerID: id },
      data: updateCustomerDto,
    });
  }

  /**
   * Xóa khách hàng
   */
  async remove(storeId: number, id: number) {
    // Kiểm tra khách hàng có tồn tại và thuộc về cửa hàng không
    const customer = await this.prisma.customer.findFirst({
      where: {
        CustomerID: id,
        StoreID: storeId,
      },
      include: {
        orders: true,
      },
    });

    if (!customer) {
      throw new NotFoundException(`Khách hàng với ID ${id} không tồn tại`);
    }

    // Kiểm tra xem khách hàng có đơn hàng không
    if (customer.orders && customer.orders.length > 0) {
      throw new BadRequestException(
        `Không thể xóa khách hàng đã có ${customer.orders.length} đơn hàng`,
      );
    }

    // Xóa khách hàng
    await this.prisma.customer.delete({
      where: { CustomerID: id },
    });

    return { message: 'Xóa khách hàng thành công' };
  }
}
