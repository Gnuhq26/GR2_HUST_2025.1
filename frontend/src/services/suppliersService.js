import apiClient from './api';

const suppliersService = {
  // Lấy danh sách nhà cung cấp (có thể tìm kiếm)
  async getAll(search = '') {
    const params = search ? { search } : {};
    const response = await apiClient.get('/suppliers', { params });
    return response.data;
  },

  // Lấy chi tiết nhà cung cấp
  async getById(id) {
    const response = await apiClient.get(`/suppliers/${id}`);
    return response.data;
  },

  // Tạo nhà cung cấp mới
  async create(data) {
    const response = await apiClient.post('/suppliers', {
      supplierName: data.SupplierName,
      phone: data.Phone,
      address: data.Address,
    });
    return response.data;
  },

  // Cập nhật nhà cung cấp
  async update(id, data) {
    const response = await apiClient.patch(`/suppliers/${id}`, {
      supplierName: data.SupplierName,
      phone: data.Phone,
      address: data.Address,
    });
    return response.data;
  },

  // Xóa nhà cung cấp
  async delete(id) {
    const response = await apiClient.delete(`/suppliers/${id}`);
    return response.data;
  },
};

export default suppliersService;
