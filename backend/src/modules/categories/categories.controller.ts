import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto';
import { CheckPermission, CurrentStore } from '../../common/decorators';

@ApiTags('Categories')
@ApiBearerAuth('JWT-auth')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @CheckPermission('create', 'Category')
  @ApiOperation({
    summary: 'Tạo danh mục mới (cần quyền create:Category)',
    description: 'Tạo danh mục sản phẩm cho cửa hàng. CategoryName phải unique trong cùng store.',
  })
  @ApiResponse({
    status: 201,
    description: 'Danh mục được tạo thành công',
    schema: {
      example: {
        CategoryID: 1,
        StoreID: 1,
        CategoryName: 'Vật liệu xây dựng',
        Description: 'Các loại vật liệu dùng trong xây dựng',
        CreatedAt: '2026-01-12T10:00:00.000Z',
        UpdatedAt: '2026-01-12T10:00:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: 409,
    description: 'Danh mục đã tồn tại trong store',
  })
  create(
    @CurrentStore() storeId: number,
    @Body() createCategoryDto: CreateCategoryDto,
  ) {
    return this.categoriesService.create(storeId, createCategoryDto);
  }

  @Get()
  @CheckPermission('read', 'Category')
  @ApiOperation({
    summary: 'Lấy danh sách danh mục (cần quyền read:Category)',
    description: 'Lấy tất cả danh mục của cửa hàng, có thể tìm kiếm theo tên',
  })
  @ApiResponse({
    status: 200,
    description: 'Danh sách danh mục',
    schema: {
      example: [
        {
          CategoryID: 1,
          StoreID: 1,
          CategoryName: 'Vật liệu xây dựng',
          Description: 'Các loại vật liệu dùng trong xây dựng',
          CreatedAt: '2026-01-12T10:00:00.000Z',
          UpdatedAt: '2026-01-12T10:00:00.000Z',
          _count: {
            products: 5,
          },
        },
      ],
    },
  })
  findAll(
    @CurrentStore() storeId: number,
    @Query('search') search?: string,
  ) {
    return this.categoriesService.findAll(storeId, search);
  }

  @Get(':id')
  @CheckPermission('read', 'Category')
  @ApiOperation({
    summary: 'Lấy chi tiết danh mục (cần quyền read:Category)',
    description: 'Lấy thông tin chi tiết một danh mục theo ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Chi tiết danh mục',
    schema: {
      example: {
        CategoryID: 1,
        StoreID: 1,
        CategoryName: 'Vật liệu xây dựng',
        Description: 'Các loại vật liệu dùng trong xây dựng',
        CreatedAt: '2026-01-12T10:00:00.000Z',
        UpdatedAt: '2026-01-12T10:00:00.000Z',
        _count: {
          products: 5,
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Không tìm thấy danh mục',
  })
  findOne(
    @CurrentStore() storeId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.categoriesService.findOne(storeId, id);
  }

  @Patch(':id')
  @CheckPermission('update', 'Category')
  @ApiOperation({
    summary: 'Cập nhật danh mục (cần quyền update:Category)',
    description: 'Cập nhật thông tin danh mục. Nếu đổi tên, phải đảm bảo không trùng với danh mục khác.',
  })
  @ApiResponse({
    status: 200,
    description: 'Danh mục được cập nhật thành công',
  })
  @ApiResponse({
    status: 404,
    description: 'Không tìm thấy danh mục',
  })
  @ApiResponse({
    status: 409,
    description: 'Tên danh mục mới đã tồn tại',
  })
  update(
    @CurrentStore() storeId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    return this.categoriesService.update(storeId, id, updateCategoryDto);
  }

  @Delete(':id')
  @CheckPermission('delete', 'Category')
  @ApiOperation({
    summary: 'Xóa danh mục (cần quyền delete:Category)',
    description:
      'Xóa danh mục nếu không có sản phẩm nào. Nếu danh mục đang có sản phẩm, yêu cầu chuyển hoặc xóa sản phẩm trước.',
  })
  @ApiResponse({
    status: 200,
    description: 'Danh mục được xóa thành công',
    schema: {
      example: {
        message: 'Category "Vật liệu xây dựng" deleted successfully',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Không thể xóa danh mục đang có sản phẩm',
  })
  @ApiResponse({
    status: 404,
    description: 'Không tìm thấy danh mục',
  })
  remove(
    @CurrentStore() storeId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.categoriesService.remove(storeId, id);
  }
}
