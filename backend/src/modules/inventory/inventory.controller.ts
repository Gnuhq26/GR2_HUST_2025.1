import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  ParseIntPipe,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { InventoryService } from './inventory.service';
import { CreateStockReceiptDto } from './dto';
import { DirectShipDto } from './dto/direct-ship.dto';
import { CheckPermission, CurrentStore } from '../../common/decorators';

@ApiTags('Inventory')
@ApiBearerAuth('JWT-auth')
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Post('stock-in')
  @CheckPermission('create', 'Inventory')
  @ApiOperation({
    summary: 'Nhập kho (Stock-In Transaction) (cần quyền create:Inventory)',
    description:
      'Tạo phiếu nhập kho, tự động quy đổi đơn vị về BaseUnit và cập nhật tồn kho. Sử dụng Transaction để đảm bảo tính toàn vẹn dữ liệu.',
  })
  @ApiResponse({
    status: 201,
    description: 'Nhập kho thành công',
    schema: {
      example: {
        receipt: {
          ReceiptID: 1,
          SupplierID: 1,
          ImportDate: '2026-01-12T10:00:00.000Z',
          TotalAmount: '5000000.00',
          Note: 'Nhập hàng tháng 1/2026',
          supplier: {
            SupplierID: 1,
            SupplierName: 'Công ty TNHH ABC',
          },
        },
        details: [
          {
            DetailID: 1,
            ReceiptID: 1,
            ProductID: 1,
            UnitName: 'Pallet',
            Quantity: '10.00',
            UnitPrice: '500000.00',
            product: {
              ProductID: 1,
              ProductName: 'Gạch xây dựng',
              SKU: 'GACH-001',
              BaseUnit: 'Viên',
            },
            quantityInBaseUnit: 5000,
            exchangeValue: 500,
          },
        ],
        message: 'Stock receipt created successfully. 1 product(s) added to inventory.',
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Không tìm thấy nhà cung cấp hoặc sản phẩm' })
  @ApiResponse({ status: 400, description: 'Đơn vị tính không hợp lệ' })
  async createStockReceipt(
    @CurrentStore() storeId: number,
    @Body() createStockReceiptDto: CreateStockReceiptDto,
  ) {
    return await this.inventoryService.createStockReceipt(
      storeId,
      createStockReceiptDto,
    );
  }

  @Get()
  @CheckPermission('read', 'Inventory')
  @ApiOperation({
    summary: 'Lấy danh sách tồn kho (cần quyền read:Inventory)',
    description:
      'Lấy danh sách tồn kho hiện tại với filtering theo tên/SKU và cảnh báo tồn kho thấp',
  })
  @ApiResponse({ status: 200, description: 'Danh sách tồn kho' })
  async getInventory(
    @CurrentStore() storeId: number,
    @Query('search') search?: string,
    @Query('lowStockThreshold', new ParseIntPipe({ optional: true }))
    lowStockThreshold?: number,
  ) {
    return await this.inventoryService.getInventory(
      storeId,
      search,
      lowStockThreshold,
    );
  }

  @Get('products/:productId/history')
  @CheckPermission('read', 'Inventory')
  @ApiOperation({
    summary: 'Lấy lịch sử nhập hàng của sản phẩm (cần quyền read:Inventory)',
    description: 'Xem lịch sử tất cả các lần nhập kho của một sản phẩm cụ thể',
  })
  @ApiResponse({ status: 200, description: 'Lịch sử nhập hàng' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy sản phẩm' })
  async getProductStockHistory(
    @CurrentStore() storeId: number,
    @Param('productId', ParseIntPipe) productId: number,
  ) {
    return await this.inventoryService.getProductStockHistory(
      storeId,
      productId,
    );
  }

  @Get('receipts')
  @CheckPermission('read', 'Inventory')
  @ApiOperation({
    summary: 'Lấy danh sách phiếu nhập kho (cần quyền read:Inventory)',
  })
  @ApiResponse({ status: 200, description: 'Danh sách phiếu nhập kho' })
  async getStockReceipts(
    @CurrentStore() storeId: number,
    @Query('supplierId', new ParseIntPipe({ optional: true }))
    supplierId?: number,
  ) {
    return await this.inventoryService.getStockReceipts(storeId, supplierId);
  }

  @Get('receipts/:receiptId')
  @CheckPermission('read', 'Inventory')
  @ApiOperation({
    summary: 'Lấy chi tiết phiếu nhập kho (cần quyền read:Inventory)',
  })
  @ApiResponse({ status: 200, description: 'Chi tiết phiếu nhập kho' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy phiếu nhập' })
  async getStockReceiptDetail(
    @CurrentStore() storeId: number,
    @Param('receiptId', ParseIntPipe) receiptId: number,
  ) {
    return await this.inventoryService.getStockReceiptDetail(
      storeId,
      receiptId,
    );
  }

  @Post('direct-ship')
  @CheckPermission('create', 'Inventory')
  @ApiOperation({
    summary: 'Nhập giao thẳng: nhập một phần, bán trực tiếp một phần',
  })
  @ApiResponse({ status: 201, description: 'Xử lý direct ship thành công' })
  async directShip(
    @CurrentStore() storeId: number,
    @Req() req: any,
    @Body() dto: DirectShipDto,
  ) {
    const userId = req.user.UserID;
    return await this.inventoryService.directShipTransaction(storeId, userId, dto);
  }

  @Post('receipts/:receiptId/receive')
  @CheckPermission('create', 'Inventory')
  @ApiOperation({
    summary: 'Xác nhận nhận hàng: chuyển phiếu nhập từ Pending → Received (cần quyền create:Inventory)',
    description:
      'Khi hàng về thực tế, chuyển InTransitQty → Quantity. Chỉ áp dụng cho phiếu đang Pending.',
  })
  @ApiResponse({ status: 201, description: 'Xác nhận thành công, hàng đã vào kho thực tế' })
  @ApiResponse({ status: 400, description: 'Phiếu không ở trạng thái Pending' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy phiếu nhập' })
  async fulfillReceipt(
    @CurrentStore() storeId: number,
    @Req() req: any,
    @Param('receiptId', ParseIntPipe) receiptId: number,
  ) {
    const userId = req.user.UserID;
    return await this.inventoryService.fulfillReceipt(storeId, receiptId, userId);
  }
}
