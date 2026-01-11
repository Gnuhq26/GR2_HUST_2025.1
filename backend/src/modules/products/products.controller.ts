import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  Query,
  ParseBoolPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { CreateProductDto, UpdateProductDto } from './dto';
import { CheckPermission } from '../../common/decorators';
import { CurrentStore } from '../../common/decorators';

@ApiTags('Products')
@ApiBearerAuth()
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @CheckPermission('create', 'Product')
  @ApiOperation({ summary: 'Tạo sản phẩm mới (cần quyền create:Product)' })
  @ApiResponse({ status: 201, description: 'Sản phẩm đã được tạo thành công' })
  @ApiResponse({ status: 403, description: 'Không có quyền truy cập' })
  async create(
    @CurrentStore() storeId: number,
    @Body() createProductDto: CreateProductDto,
  ) {
    return await this.productsService.create(storeId, createProductDto);
  }

  @Get()
  @CheckPermission('read', 'Product')
  @ApiOperation({ summary: 'Lấy danh sách sản phẩm (cần quyền read:Product)' })
  @ApiResponse({ status: 200, description: 'Danh sách sản phẩm' })
  async findAll(
    @CurrentStore() storeId: number,
    @Query('isActive', new ParseBoolPipe({ optional: true })) isActive?: boolean,
  ) {
    return await this.productsService.findAll(storeId, isActive);
  }

  @Get(':id')
  @CheckPermission('read', 'Product')
  @ApiOperation({ summary: 'Lấy chi tiết sản phẩm (cần quyền read:Product)' })
  @ApiResponse({ status: 200, description: 'Chi tiết sản phẩm' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy sản phẩm' })
  async findOne(
    @CurrentStore() storeId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return await this.productsService.findOne(storeId, id);
  }

  @Patch(':id')
  @CheckPermission('update', 'Product')
  @ApiOperation({ summary: 'Cập nhật sản phẩm (cần quyền update:Product)' })
  @ApiResponse({ status: 200, description: 'Sản phẩm đã được cập nhật' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy sản phẩm' })
  @ApiResponse({ status: 403, description: 'Không có quyền truy cập' })
  async update(
    @CurrentStore() storeId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    return await this.productsService.update(storeId, id, updateProductDto);
  }

  @Delete(':id')
  @CheckPermission('delete', 'Product')
  @ApiOperation({ summary: 'Xóa sản phẩm - Soft delete (cần quyền delete:Product)' })
  @ApiResponse({ status: 200, description: 'Sản phẩm đã được xóa (soft delete)' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy sản phẩm' })
  @ApiResponse({ status: 403, description: 'Không có quyền truy cập' })
  async remove(
    @CurrentStore() storeId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return await this.productsService.remove(storeId, id);
  }

  @Delete(':id/hard')
  @CheckPermission('delete', 'Product')
  @ApiOperation({ summary: 'Xóa vĩnh viễn sản phẩm (cần quyền delete:Product)' })
  @ApiResponse({ status: 200, description: 'Sản phẩm đã được xóa vĩnh viễn' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy sản phẩm' })
  @ApiResponse({ status: 403, description: 'Không có quyền truy cập' })
  async hardDelete(
    @CurrentStore() storeId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return await this.productsService.hardDelete(storeId, id);
  }

  @Post(':id/calculate')
  @CheckPermission('read', 'Product')
  @ApiOperation({
    summary: 'Tính toán số lượng theo đơn vị gốc',
    description:
      'Ví dụ: 10 Pallet x 500 Viên/Pallet = 5000 Viên',
  })
  @ApiResponse({
    status: 200,
    description: 'Số lượng theo đơn vị gốc',
    schema: {
      example: {
        productId: 1,
        unit: 'Pallet',
        quantity: 10,
        baseUnit: 'Viên',
        baseQuantity: 5000,
      },
    },
  })
  async calculateBaseUnit(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { unitName: string; quantity: number },
  ) {
    const baseQuantity = await this.productsService.calculateBaseUnitQuantity(
      id,
      body.unitName,
      body.quantity,
    );

    return {
      productId: id,
      unit: body.unitName,
      quantity: body.quantity,
      baseQuantity,
    };
  }
}
