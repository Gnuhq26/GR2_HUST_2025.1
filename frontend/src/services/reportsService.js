import apiClient from './api';

const reportsService = {
  // Báo cáo doanh thu
  async getRevenueReport(startDate, endDate) {
    const response = await apiClient.get('/reports/revenue', {
      params: { startDate, endDate },
    });
    return response.data;
  },

  // Báo cáo lợi nhuận
  async getProfitReport(startDate, endDate) {
    const response = await apiClient.get('/reports/profit', {
      params: { startDate, endDate },
    });
    return response.data;
  },

  // Top sản phẩm bán chạy
  async getTopProducts(startDate, endDate, sortBy = 'revenue', limit = 10) {
    const response = await apiClient.get('/reports/top-products', {
      params: { startDate, endDate, sortBy, limit },
    });
    return response.data;
  },
};

export default reportsService;
