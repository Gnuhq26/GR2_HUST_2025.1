import apiClient from './api';

const inventoryService = {
  // Lấy danh sách tồn kho
  async getInventory(search = '', lowStockThreshold = null) {
    const params = {};
    if (search) params.search = search;
    if (lowStockThreshold !== null) params.lowStockThreshold = lowStockThreshold;
    
    const response = await apiClient.get('/inventory', { params });
    return response.data;
  },

  // Nhập kho (Stock-In)
  async stockIn(data) {
    const response = await apiClient.post('/inventory/stock-in', {
      supplierId: data.supplierId,
      note: data.note,
      items: data.items.map(item => ({
        productId: item.productId,
        unitName: item.unitName,
        quantity: parseFloat(item.quantity),
        unitPrice: parseFloat(item.unitPrice),
      })),
    });
    return response.data;
  },

  // Lấy lịch sử nhập hàng của một sản phẩm
  async getProductStockHistory(productId) {
    const response = await apiClient.get(`/inventory/products/${productId}/history`);
    return response.data;
  },

  // Lấy danh sách phiếu nhập kho
  async getStockReceipts(supplierId = null) {
    const params = {};
    if (supplierId) params.supplierId = supplierId;
    const response = await apiClient.get('/inventory/receipts', { params });
    return response.data;
  },

  // Chi tiết phiếu nhập
  async getStockReceiptById(receiptId) {
    const response = await apiClient.get(`/inventory/receipts/${receiptId}`);
    return response.data;
  },
};

export default inventoryService;
