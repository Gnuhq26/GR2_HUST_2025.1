import { Controller, Get, Post, Body } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { DebtsService } from './debts.service';
import { RecordPaymentDto } from './dto/payment.dto';
import { CurrentStore } from '../../common/decorators';
import { CheckPermission } from '../../common/decorators/check-permission.decorator';

@ApiTags('Debts')
@ApiBearerAuth('JWT-auth')
@Controller('debts')
export class DebtsController {
  constructor(private readonly debtsService: DebtsService) {}

  @Get('customers')
  @CheckPermission('read', 'Debt')
  @ApiOperation({ summary: 'Danh sách công nợ khách hàng' })
  async getCustomerDebts(@CurrentStore() storeId: number) {
    return this.debtsService.getCustomerDebts(storeId);
  }

  @Get('suppliers')
  @CheckPermission('read', 'Debt')
  @ApiOperation({ summary: 'Danh sách công nợ nhà cung cấp' })
  async getSupplierDebts(@CurrentStore() storeId: number) {
    return this.debtsService.getSupplierDebts(storeId);
  }

  @Post('payment')
  @CheckPermission('manage', 'Debt')
  @ApiOperation({ summary: 'Ghi nhận thanh toán công nợ' })
  async recordPayment(
    @CurrentStore() storeId: number,
    @Body() dto: RecordPaymentDto,
  ) {
    return this.debtsService.recordPayment(storeId, dto);
  }
}
