import api from './api';

export const productsService = {
  // Lấy danh sách sản phẩm với pagination
  getAll: async (params = {}) => {
    const response = await api.get('/products', { params });
    return response.data;
  },

  // Lấy chi tiết sản phẩm
  getById: async (id) => {
    const response = await api.get(`/products/${id}`);
    return response.data;
  },

  // Tạo sản phẩm mới
  create: async (data) => {
    const response = await api.post('/products', data);
    return response.data;
  },

  // Cập nhật sản phẩm
  update: async (id, data) => {
    const response = await api.patch(`/products/${id}`, data);
    return response.data;
  },

  // Xóa sản phẩm
  delete: async (id) => {
    const response = await api.delete(`/products/${id}`);
    return response.data;
  },
};
