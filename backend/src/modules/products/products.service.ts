import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma';
import { CreateProductDto, UpdateProductDto } from './dto';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Tạo sản phẩm mới với các đơn vị quy đổi và bảng giá
   * @param storeId ID cửa hàng (từ CurrentStore decorator)
   * @param dto Dữ liệu sản phẩm
   */
  async create(storeId: number, dto: CreateProductDto) {
    // Kiểm tra category có tồn tại và thuộc về store này không
    const category = await this.prisma.category.findFirst({
      where: {
        CategoryID: dto.categoryId,
        StoreID: storeId,
      },
    });

    if (!category) {
      throw new NotFoundException(
        'Category not found or does not belong to this store',
      );
    }

    // Kiểm tra SKU có bị trùng không (trong cùng store)
    if (dto.sku) {
      const existingSKU = await this.prisma.product.findUnique({
        where: {
          StoreID_SKU: {
            StoreID: storeId,
            SKU: dto.sku,
          },
        },
      });

      if (existingSKU) {
        throw new ConflictException('SKU already exists in this store');
      }
    }

    // Tạo sản phẩm cùng với units và prices
    const product = await this.prisma.product.create({
      data: {
        StoreID: storeId,
        CategoryID: dto.categoryId,
        ProductName: dto.productName,
        SKU: dto.sku,
        BaseUnit: dto.baseUnit,
        Description: dto.description,
        IsActive: dto.isActive ?? true,
        // Nested create cho units
        units: dto.units
          ? {
              create: dto.units.map((unit) => ({
                UnitName: unit.unitName,
                ExchangeValue: unit.exchangeValue,
                IsDefault: unit.isDefault ?? false,
              })),
            }
          : undefined,
        // Nested create cho prices
        prices: dto.prices
          ? {
              create: dto.prices.map((price) => ({
                PriceName: price.priceName,
                UnitPrice: price.unitPrice,
                MinQuantity: price.minQuantity ?? 0,
              })),
            }
          : undefined,
      },
      include: {
        category: {
          select: {
            CategoryID: true,
            CategoryName: true,
          },
        },
        units: true,
        prices: true,
      },
    });

    return product;
  }

  /**
   * Lấy danh sách tất cả sản phẩm của store
   */
  async findAll(storeId: number, isActive?: boolean) {
    return await this.prisma.product.findMany({
      where: {
        StoreID: storeId,
        ...(isActive !== undefined && { IsActive: isActive }),
      },
      include: {
        category: {
          select: {
            CategoryID: true,
            CategoryName: true,
          },
        },
        units: true,
        prices: true,
      },
      orderBy: {
        CreatedAt: 'desc',
      },
    });
  }

  /**
   * Lấy chi tiết 1 sản phẩm
   */
  async findOne(storeId: number, productId: number) {
    const product = await this.prisma.product.findFirst({
      where: {
        ProductID: productId,
        StoreID: storeId, // Đảm bảo sản phẩm thuộc store này
      },
      include: {
        category: {
          select: {
            CategoryID: true,
            CategoryName: true,
            Description: true,
          },
        },
        units: true,
        prices: true,
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found in this store');
    }

    return product;
  }

  /**
   * Cập nhật sản phẩm
   */
  async update(storeId: number, productId: number, dto: UpdateProductDto) {
    // Kiểm tra sản phẩm có tồn tại và thuộc về store này không
    const existingProduct = await this.findOne(storeId, productId);

    // Kiểm tra category mới (nếu có)
    if (dto.categoryId) {
      const category = await this.prisma.category.findFirst({
        where: {
          CategoryID: dto.categoryId,
          StoreID: storeId,
        },
      });

      if (!category) {
        throw new NotFoundException('Category not found in this store');
      }
    }

    // Kiểm tra SKU mới có bị trùng không (nếu có)
    if (dto.sku && dto.sku !== existingProduct.SKU) {
      const existingSKU = await this.prisma.product.findUnique({
        where: {
          StoreID_SKU: {
            StoreID: storeId,
            SKU: dto.sku,
          },
        },
      });

      if (existingSKU) {
        throw new ConflictException('SKU already exists in this store');
      }
    }

    // Cập nhật sản phẩm
    // Lưu ý: Cập nhật units và prices phức tạp hơn, có thể cần API riêng
    const product = await this.prisma.product.update({
      where: { ProductID: productId },
      data: {
        ProductName: dto.productName,
        CategoryID: dto.categoryId,
        SKU: dto.sku,
        BaseUnit: dto.baseUnit,
        Description: dto.description,
        IsActive: dto.isActive,
      },
      include: {
        category: {
          select: {
            CategoryID: true,
            CategoryName: true,
          },
        },
        units: true,
        prices: true,
      },
    });

    return product;
  }

  /**
   * Xóa sản phẩm (soft delete bằng cách set IsActive = false)
   */
  async remove(storeId: number, productId: number) {
    // Kiểm tra sản phẩm có tồn tại không
    await this.findOne(storeId, productId);

    // Soft delete
    return await this.prisma.product.update({
      where: { ProductID: productId },
      data: { IsActive: false },
    });
  }

  /**
   * Xóa vĩnh viễn sản phẩm
   */
  async hardDelete(storeId: number, productId: number) {
    // Kiểm tra sản phẩm có tồn tại không
    await this.findOne(storeId, productId);

    return await this.prisma.product.delete({
      where: { ProductID: productId },
    });
  }

  /**
   * Tính toán số lượng sản phẩm theo đơn vị gốc
   * Ví dụ: 10 Pallet x 500 Viên/Pallet = 5000 Viên
   */
  async calculateBaseUnitQuantity(
    productId: number,
    unitName: string,
    quantity: number,
  ): Promise<number> {
    // Lấy thông tin đơn vị quy đổi
    const unit = await this.prisma.productUnit.findFirst({
      where: {
        ProductID: productId,
        UnitName: unitName,
      },
    });

    if (!unit) {
      throw new NotFoundException('Product unit not found');
    }

    // Tính số lượng theo đơn vị gốc
    return quantity * Number(unit.ExchangeValue);
  }
}
