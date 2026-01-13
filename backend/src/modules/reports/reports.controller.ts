import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { ReportQueryDto, TopProductsQueryDto } from './dto/report-query.dto';
import { CurrentStore } from '../../common/decorators';
import { CheckPermission } from '../../common/decorators/check-permission.decorator';

@ApiTags('Reports')
@ApiBearerAuth('JWT-auth')
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('revenue')
  @CheckPermission('read', 'Report')
  @ApiOperation({ summary: 'Báo cáo Doanh thu theo khoảng thời gian' })
  async getRevenueReport(
    @CurrentStore() storeId: number,
    @Query() query: ReportQueryDto,
  ) {
    return this.reportsService.getRevenueReport(storeId, query);
  }

  @Get('profit')
  @CheckPermission('read', 'ProfitReport')
  @ApiOperation({ summary: 'Báo cáo Lợi nhuận theo khoảng thời gian' })
  async getProfitReport(
    @CurrentStore() storeId: number,
    @Query() query: ReportQueryDto,
  ) {
    return this.reportsService.getProfitReport(storeId, query);
  }

  @Get('top-products')
  @CheckPermission('read', 'Report')
  @ApiOperation({ summary: 'Top sản phẩm bán chạy nhất' })
  async getTopProducts(
    @CurrentStore() storeId: number,
    @Query() query: TopProductsQueryDto,
  ) {
    return this.reportsService.getTopProducts(storeId, query);
  }
}
