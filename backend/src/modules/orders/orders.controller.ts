import { Controller, Get, Post, Body, Param, ParseIntPipe, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto';
import { CurrentStore } from '../../common/decorators';
import { CheckPermission } from '../../common/decorators';

@ApiTags('Đơn hàng')
@ApiBearerAuth('JWT-auth')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @CheckPermission('create', 'Order')
  @ApiOperation({
    summary: 'Tạo đơn hàng mới (Bán hàng)',
    description:
      'Tự động kiểm tra tồn kho, áp giá từ PriceList, tạo đơn và trừ kho',
  })
  @ApiResponse({
    status: 201,
    description: 'Đơn hàng đã được tạo thành công',
  })
  @ApiResponse({
    status: 400,
    description: 'Không đủ hàng trong kho hoặc chưa có giá bán',
  })
  @ApiResponse({ status: 404, description: 'Sản phẩm hoặc khách hàng không tồn tại' })
  create(
    @CurrentStore() storeId: number,
    @Req() req: any,
    @Body() createOrderDto: CreateOrderDto,
  ) {
    const userId = req.user.UserID;
    return this.ordersService.createOrder(storeId, userId, createOrderDto);
  }

  @Get()
  @CheckPermission('read', 'Order')
  @ApiOperation({ summary: 'Lấy danh sách đơn hàng' })
  @ApiResponse({
    status: 200,
    description: 'Trả về danh sách đơn hàng của cửa hàng',
  })
  findAll(@CurrentStore() storeId: number) {
    return this.ordersService.findAll(storeId);
  }

  @Get(':id')
  @CheckPermission('read', 'Order')
  @ApiOperation({ summary: 'Lấy chi tiết đơn hàng' })
  @ApiParam({ name: 'id', description: 'ID đơn hàng', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Trả về thông tin chi tiết đơn hàng',
  })
  @ApiResponse({ status: 404, description: 'Đơn hàng không tồn tại' })
  findOne(
    @CurrentStore() storeId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.ordersService.findOne(storeId, id);
  }
}
