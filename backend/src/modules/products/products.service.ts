import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma';
import { CreateProductDto, UpdateProductDto } from './dto';
import { ensureInventoryExists } from '../../utils';

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
                UnitName: price.unitName,
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

    // Tự động tạo bản ghi Inventory với Quantity = 0 (Task 21)
    await ensureInventoryExists(this.prisma, storeId, product.ProductID);

    return product;
  }

  /**
   * Lấy danh sách tất cả sản phẩm của store với filtering
   * @param storeId ID cửa hàng (từ CurrentStore decorator)
   * @param isActive Lọc theo trạng thái hoạt động
   * @param search Tìm kiếm theo tên hoặc SKU
   * @param categoryId Lọc theo danh mục
   */
  async findAll(
    storeId: number,
    isActive?: boolean,
    search?: string,
    categoryId?: number,
  ) {
    return await this.prisma.product.findMany({
      where: {
        StoreID: storeId,
        ...(isActive !== undefined && { IsActive: isActive }),
        ...(categoryId && { CategoryID: categoryId }),
        ...(search && {
          OR: [
            { ProductName: { contains: search } },
            { SKU: { contains: search } },
          ],
        }),
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
   * Cập nhật sản phẩm (bao gồm units và prices)
   * Strategy: Replace All - Xóa toàn bộ units/prices cũ và tạo mới
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

    // Sử dụng transaction để đảm bảo tính toàn vẹn
    const product = await this.prisma.$transaction(async (tx) => {
      // 1. Xóa toàn bộ units cũ (nếu có units mới)
      if (dto.units !== undefined) {
        await tx.productUnit.deleteMany({
          where: { ProductID: productId },
        });
      }

      // 2. Xóa toàn bộ prices cũ (nếu có prices mới)
      if (dto.prices !== undefined) {
        await tx.priceList.deleteMany({
          where: { ProductID: productId },
        });
      }

      // 3. Cập nhật thông tin sản phẩm và tạo mới units/prices
      return await tx.product.update({
        where: { ProductID: productId },
        data: {
          ProductName: dto.productName,
          CategoryID: dto.categoryId,
          SKU: dto.sku,
          BaseUnit: dto.baseUnit,
          Description: dto.description,
          IsActive: dto.isActive,
          // Tạo mới units (nếu có)
          units: dto.units
            ? {
                create: dto.units.map((unit) => ({
                  UnitName: unit.unitName,
                  ExchangeValue: unit.exchangeValue,
                  IsDefault: unit.isDefault ?? false,
                })),
              }
            : undefined,
          // Tạo mới prices (nếu có)
          prices: dto.prices
            ? {
                create: dto.prices.map((price) => ({
                  PriceName: price.priceName,
                  UnitName: price.unitName,
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
   * Kiểm tra không có dữ liệu tham chiếu trước khi xóa
   */
  async hardDelete(storeId: number, productId: number) {
    // Kiểm tra sản phẩm có tồn tại không
    await this.findOne(storeId, productId);

    // Kiểm tra sản phẩm có trong đơn hàng nào không
    const orderCount = await this.prisma.orderDetail.count({
      where: { ProductID: productId },
    });
    if (orderCount > 0) {
      throw new BadRequestException(
        `Không thể xóa vĩnh viễn: sản phẩm đang được tham chiếu bởi ${orderCount} chi tiết đơn hàng. Hãy dùng soft delete thay thế.`,
      );
    }

    // Kiểm tra sản phẩm có trong phiếu nhập nào không
    const receiptCount = await this.prisma.stockReceiptDetail.count({
      where: { ProductID: productId },
    });
    if (receiptCount > 0) {
      throw new BadRequestException(
        `Không thể xóa vĩnh viễn: sản phẩm đang được tham chiếu bởi ${receiptCount} chi tiết phiếu nhập. Hãy dùng soft delete thay thế.`,
      );
    }

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

  /**
   * Thêm đơn vị quy đổi mới cho sản phẩm
   */
  async addProductUnit(
    storeId: number,
    productId: number,
    unitName: string,
    exchangeValue: number,
    isDefault: boolean = false,
  ) {
    // Kiểm tra sản phẩm có tồn tại và thuộc về store này không
    await this.findOne(storeId, productId);

    // Kiểm tra UnitName có bị trùng không
    const existingUnit = await this.prisma.productUnit.findFirst({
      where: {
        ProductID: productId,
        UnitName: unitName,
      },
    });

    if (existingUnit) {
      throw new ConflictException(
        `Unit "${unitName}" already exists for this product`,
      );
    }

    return await this.prisma.productUnit.create({
      data: {
        ProductID: productId,
        UnitName: unitName,
        ExchangeValue: exchangeValue,
        IsDefault: isDefault,
      },
    });
  }

  /**
   * Cập nhật đơn vị quy đổi
   */
  async updateProductUnit(
    storeId: number,
    productId: number,
    unitId: number,
    unitName?: string,
    exchangeValue?: number,
    isDefault?: boolean,
  ) {
    // Kiểm tra sản phẩm có tồn tại không
    await this.findOne(storeId, productId);

    // Kiểm tra unit có thuộc product này không
    const existingUnit = await this.prisma.productUnit.findFirst({
      where: {
        UnitID: unitId,
        ProductID: productId,
      },
    });

    if (!existingUnit) {
      throw new NotFoundException('Unit not found for this product');
    }

    // Kiểm tra UnitName mới có bị trùng không (nếu có)
    if (unitName && unitName !== existingUnit.UnitName) {
      const duplicateUnit = await this.prisma.productUnit.findFirst({
        where: {
          ProductID: productId,
          UnitName: unitName,
        },
      });

      if (duplicateUnit) {
        throw new ConflictException(
          `Unit "${unitName}" already exists for this product`,
        );
      }
    }

    return await this.prisma.productUnit.update({
      where: { UnitID: unitId },
      data: {
        ...(unitName && { UnitName: unitName }),
        ...(exchangeValue !== undefined && { ExchangeValue: exchangeValue }),
        ...(isDefault !== undefined && { IsDefault: isDefault }),
      },
    });
  }

  /**
   * Xóa đơn vị quy đổi
   */
  async deleteProductUnit(
    storeId: number,
    productId: number,
    unitId: number,
  ) {
    // Kiểm tra sản phẩm có tồn tại không
    await this.findOne(storeId, productId);

    // Kiểm tra unit có thuộc product này không
    const existingUnit = await this.prisma.productUnit.findFirst({
      where: {
        UnitID: unitId,
        ProductID: productId,
      },
    });

    if (!existingUnit) {
      throw new NotFoundException('Unit not found for this product');
    }

    return await this.prisma.productUnit.delete({
      where: { UnitID: unitId },
    });
  }

  /**
   * Thêm bảng giá mới cho sản phẩm
   */
  async addPriceList(
    storeId: number,
    productId: number,
    priceName: string,
    unitName: string,
    unitPrice: number,
    minQuantity: number = 0,
  ) {
    // Kiểm tra sản phẩm có tồn tại và thuộc về store này không
    await this.findOne(storeId, productId);

    return await this.prisma.priceList.create({
      data: {
        ProductID: productId,
        PriceName: priceName,
        UnitName: unitName,
        UnitPrice: unitPrice,
        MinQuantity: minQuantity,
      },
    });
  }

  /**
   * Cập nhật bảng giá
   */
  async updatePriceList(
    storeId: number,
    productId: number,
    priceId: number,
    priceName?: string,
    unitName?: string,
    unitPrice?: number,
    minQuantity?: number,
  ) {
    // Kiểm tra sản phẩm có tồn tại không
    await this.findOne(storeId, productId);

    // Kiểm tra price có thuộc product này không
    const existingPrice = await this.prisma.priceList.findFirst({
      where: {
        PriceID: priceId,
        ProductID: productId,
      },
    });

    if (!existingPrice) {
      throw new NotFoundException('Price not found for this product');
    }

    return await this.prisma.priceList.update({
      where: { PriceID: priceId },
      data: {
        ...(priceName && { PriceName: priceName }),
        ...(unitName && { UnitName: unitName }),
        ...(unitPrice !== undefined && { UnitPrice: unitPrice }),
        ...(minQuantity !== undefined && { MinQuantity: minQuantity }),
      },
    });
  }

  /**
   * Xóa bảng giá
   */
  async deletePriceList(
    storeId: number,
    productId: number,
    priceId: number,
  ) {
    // Kiểm tra sản phẩm có tồn tại không
    await this.findOne(storeId, productId);

    // Kiểm tra price có thuộc product này không
    const existingPrice = await this.prisma.priceList.findFirst({
      where: {
        PriceID: priceId,
        ProductID: productId,
      },
    });

    if (!existingPrice) {
      throw new NotFoundException('Price not found for this product');
    }

    return await this.prisma.priceList.delete({
      where: { PriceID: priceId },
    });
  }

  /**
   * Lấy giá phù hợp dựa trên đơn vị và số lượng mua
   * Logic: 
   * 1. Filter giá theo UnitName trước
   * 2. Tìm giá có MinQuantity <= quantity
   * 3. Chọn giá có MinQuantity cao nhất
   * Ví dụ: Mua 10 Pallet -> Tìm giá của "Pallet", rồi chọn giá phù hợp với quantity >= 5
   */
  async getApplicablePrice(
    storeId: number,
    productId: number,
    unitName: string,
    quantity: number,
  ) {
    // Kiểm tra sản phẩm có tồn tại không
    const product = await this.findOne(storeId, productId);

    // Lấy tất cả bảng giá của sản phẩm theo đơn vị
    const allPrices = await this.prisma.priceList.findMany({
      where: {
        ProductID: productId,
        UnitName: unitName,             // Filter theo đơn vị trước
        MinQuantity: { lte: quantity }, // Chỉ lấy giá có MinQuantity <= quantity
      },
      orderBy: {
        MinQuantity: 'desc', // Sắp xếp giảm dần để lấy MinQuantity cao nhất
      },
    });

    if (allPrices.length === 0) {
      throw new NotFoundException(
        `No applicable price found for unit "${unitName}" with quantity ${quantity}. Please add a price for this unit.`,
      );
    }

    const applicablePrice = allPrices[0]; // Lấy giá đầu tiên (MinQuantity cao nhất)

    return {
      product: {
        ProductID: product.ProductID,
        ProductName: product.ProductName,
        SKU: product.SKU,
        BaseUnit: product.BaseUnit,
      },
      unitName,
      quantity,
      appliedPrice: {
        PriceID: applicablePrice.PriceID,
        PriceName: applicablePrice.PriceName,
        UnitName: applicablePrice.UnitName,
        UnitPrice: applicablePrice.UnitPrice,
        MinQuantity: applicablePrice.MinQuantity,
      },
      totalAmount: Number(applicablePrice.UnitPrice) * quantity,
      allAvailablePrices: allPrices,
    };
  }
}
