import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { CustomersService } from './customers.service';
import { CreateCustomerDto, UpdateCustomerDto } from './dto';
import { CurrentStore } from '../../common/decorators';
import { CheckPermission } from '../../common/decorators';

@ApiTags('Khách hàng')
@ApiBearerAuth('JWT-auth')
@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Post()
  @CheckPermission('manage', 'Customer')
  @ApiOperation({ summary: 'Tạo khách hàng mới' })
  @ApiResponse({
    status: 201,
    description: 'Khách hàng đã được tạo thành công',
  })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
  @ApiResponse({ status: 404, description: 'Cửa hàng không tồn tại' })
  create(
    @CurrentStore() storeId: number,
    @Body() createCustomerDto: CreateCustomerDto,
  ) {
    return this.customersService.create(storeId, createCustomerDto);
  }

  @Get()
  @CheckPermission('read', 'Customer')
  @ApiOperation({ summary: 'Lấy danh sách khách hàng' })
  @ApiResponse({
    status: 200,
    description: 'Trả về danh sách khách hàng của cửa hàng',
  })
  findAll(@CurrentStore() storeId: number) {
    return this.customersService.findAll(storeId);
  }

  @Get(':id')
  @CheckPermission('read', 'Customer')
  @ApiOperation({ summary: 'Lấy thông tin chi tiết khách hàng' })
  @ApiParam({ name: 'id', description: 'ID khách hàng', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Trả về thông tin chi tiết khách hàng',
  })
  @ApiResponse({ status: 404, description: 'Khách hàng không tồn tại' })
  findOne(
    @CurrentStore() storeId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.customersService.findOne(storeId, id);
  }

  @Patch(':id')
  @CheckPermission('update', 'Customer')
  @ApiOperation({ summary: 'Cập nhật thông tin khách hàng' })
  @ApiParam({ name: 'id', description: 'ID khách hàng', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Khách hàng đã được cập nhật thành công',
  })
  @ApiResponse({ status: 404, description: 'Khách hàng không tồn tại' })
  update(
    @CurrentStore() storeId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCustomerDto: UpdateCustomerDto,
  ) {
    return this.customersService.update(storeId, id, updateCustomerDto);
  }

  @Delete(':id')
  @CheckPermission('delete', 'Customer')
  @ApiOperation({ summary: 'Xóa khách hàng' })
  @ApiParam({ name: 'id', description: 'ID khách hàng', type: Number })
  @ApiResponse({ status: 200, description: 'Khách hàng đã được xóa thành công' })
  @ApiResponse({ status: 404, description: 'Khách hàng không tồn tại' })
  @ApiResponse({
    status: 400,
    description: 'Không thể xóa khách hàng đã có đơn hàng',
  })
  remove(
    @CurrentStore() storeId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.customersService.remove(storeId, id);
  }
}
