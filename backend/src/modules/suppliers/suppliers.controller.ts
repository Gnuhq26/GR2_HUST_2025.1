import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SuppliersService } from './suppliers.service';
import { CreateSupplierDto, UpdateSupplierDto } from './dto';
import { CheckPermission, CurrentStore } from '../../common/decorators';

@ApiTags('Suppliers')
@ApiBearerAuth('JWT-auth')
@Controller('suppliers')
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  @Post()
  @CheckPermission('create', 'Supplier')
  @ApiOperation({
    summary: 'Tạo nhà cung cấp mới (cần quyền create:Supplier)',
  })
  @ApiResponse({ status: 201, description: 'Nhà cung cấp đã được tạo' })
  @ApiResponse({ status: 409, description: 'Tên nhà cung cấp đã tồn tại' })
  async create(
    @CurrentStore() storeId: number,
    @Body() createSupplierDto: CreateSupplierDto,
  ) {
    return await this.suppliersService.create(storeId, createSupplierDto);
  }

  @Get()
  @CheckPermission('read', 'Supplier')
  @ApiOperation({
    summary: 'Lấy danh sách nhà cung cấp (cần quyền read:Supplier)',
  })
  @ApiResponse({ status: 200, description: 'Danh sách nhà cung cấp' })
  async findAll(
    @CurrentStore() storeId: number,
    @Query('search') search?: string,
  ) {
    return await this.suppliersService.findAll(storeId, search);
  }

  @Get(':id')
  @CheckPermission('read', 'Supplier')
  @ApiOperation({
    summary: 'Lấy chi tiết nhà cung cấp (cần quyền read:Supplier)',
  })
  @ApiResponse({ status: 200, description: 'Chi tiết nhà cung cấp' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy nhà cung cấp' })
  async findOne(
    @CurrentStore() storeId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return await this.suppliersService.findOne(storeId, id);
  }

  @Patch(':id')
  @CheckPermission('update', 'Supplier')
  @ApiOperation({
    summary: 'Cập nhật nhà cung cấp (cần quyền update:Supplier)',
  })
  @ApiResponse({ status: 200, description: 'Nhà cung cấp đã được cập nhật' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy nhà cung cấp' })
  @ApiResponse({ status: 409, description: 'Tên nhà cung cấp đã tồn tại' })
  async update(
    @CurrentStore() storeId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateSupplierDto: UpdateSupplierDto,
  ) {
    return await this.suppliersService.update(storeId, id, updateSupplierDto);
  }

  @Delete(':id')
  @CheckPermission('delete', 'Supplier')
  @ApiOperation({ summary: 'Xóa nhà cung cấp (cần quyền delete:Supplier)' })
  @ApiResponse({ status: 200, description: 'Nhà cung cấp đã được xóa' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy nhà cung cấp' })
  @ApiResponse({
    status: 409,
    description: 'Không thể xóa vì còn phiếu nhập liên quan',
  })
  async remove(
    @CurrentStore() storeId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return await this.suppliersService.remove(storeId, id);
  }
}
