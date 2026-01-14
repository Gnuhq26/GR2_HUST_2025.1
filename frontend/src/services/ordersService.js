import apiClient from './api';

const ordersService = {
  // Tạo đơn hàng mới
  async createOrder(data) {
    const response = await apiClient.post('/orders', {
      CustomerID: data.customerId || null,
      Note: data.note || '',
      items: data.items.map(item => ({
        ProductID: item.productId,
        UnitName: item.unitName,
        Quantity: parseFloat(item.quantity),
      })),
    });
    return response.data;
  },

  // Lấy danh sách đơn hàng
  async getAll() {
    const response = await apiClient.get('/orders');
    return response.data;
  },

  // Lấy chi tiết đơn hàng
  async getById(orderId) {
    const response = await apiClient.get(`/orders/${orderId}`);
    return response.data;
  },
};

export default ordersService;
