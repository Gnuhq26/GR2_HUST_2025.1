import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma';
import { CreateCategoryDto, UpdateCategoryDto } from './dto';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Tạo danh mục mới
   * Kiểm tra unique CategoryName trong cùng Store
   */
  async create(storeId: number, createCategoryDto: CreateCategoryDto) {
    const { categoryName, description } = createCategoryDto;

    // Kiểm tra trùng tên danh mục trong cùng store
    const existingCategory = await this.prisma.category.findUnique({
      where: {
        StoreID_CategoryName: {
          StoreID: storeId,
          CategoryName: categoryName,
        },
      },
    });

    if (existingCategory) {
      throw new ConflictException(
        `Category "${categoryName}" already exists in this store`,
      );
    }

    return this.prisma.category.create({
      data: {
        StoreID: storeId,
        CategoryName: categoryName,
        Description: description,
      },
    });
  }

  /**
   * Lấy danh sách danh mục
   * Có thể tìm kiếm theo tên
   */
  async findAll(storeId: number, search?: string) {
    const categories = await this.prisma.category.findMany({
      where: {
        StoreID: storeId,
        ...(search && {
          CategoryName: {
            contains: search,
          },
        }),
      },
      include: {
        _count: {
          select: {
            products: true,
          },
        },
      },
      orderBy: {
        CategoryName: 'asc',
      },
    });

    return categories;
  }

  /**
   * Lấy chi tiết một danh mục
   */
  async findOne(storeId: number, id: number) {
    const category = await this.prisma.category.findFirst({
      where: {
        CategoryID: id,
        StoreID: storeId,
      },
      include: {
        _count: {
          select: {
            products: true,
          },
        },
      },
    });

    if (!category) {
      throw new NotFoundException(
        'Category not found or does not belong to this store',
      );
    }

    return category;
  }

  /**
   * Cập nhật danh mục
   * Kiểm tra unique CategoryName nếu đổi tên
   */
  async update(
    storeId: number,
    id: number,
    updateCategoryDto: UpdateCategoryDto,
  ) {
    const { categoryName, description } = updateCategoryDto;

    // Kiểm tra danh mục tồn tại
    const category = await this.findOne(storeId, id);

    // Nếu đổi tên, kiểm tra trùng tên
    if (categoryName && categoryName !== category.CategoryName) {
      const existingCategory = await this.prisma.category.findUnique({
        where: {
          StoreID_CategoryName: {
            StoreID: storeId,
            CategoryName: categoryName,
          },
        },
      });

      if (existingCategory) {
        throw new ConflictException(
          `Category "${categoryName}" already exists in this store`,
        );
      }
    }

    return this.prisma.category.update({
      where: {
        CategoryID: id,
      },
      data: {
        ...(categoryName && { CategoryName: categoryName }),
        ...(description !== undefined && { Description: description }),
      },
    });
  }

  /**
   * Xóa danh mục
   * Chặn xóa nếu danh mục đang có sản phẩm (onDelete: Restrict)
   */
  async remove(storeId: number, id: number) {
    // Kiểm tra danh mục tồn tại
    const category = await this.findOne(storeId, id);

    // Kiểm tra số lượng sản phẩm trong danh mục
    const productCount = await this.prisma.product.count({
      where: {
        CategoryID: id,
        StoreID: storeId,
      },
    });

    if (productCount > 0) {
      throw new BadRequestException(
        `Cannot delete category "${category.CategoryName}" because it has ${productCount} product(s). Please move or delete the products first.`,
      );
    }

    // Xóa danh mục
    await this.prisma.category.delete({
      where: {
        CategoryID: id,
      },
    });

    return {
      message: `Category "${category.CategoryName}" deleted successfully`,
    };
  }
}
