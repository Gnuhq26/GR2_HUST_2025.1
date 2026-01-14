import api from './api';

export const customersService = {
  // Lấy danh sách customers
  getAll: async () => {
    const response = await api.get('/customers');
    return response.data;
  },

  // Lấy chi tiết customer
  getById: async (id) => {
    const response = await api.get(`/customers/${id}`);
    return response.data;
  },

  // Tạo customer mới
  create: async (data) => {
    const response = await api.post('/customers', {
      CustomerName: data.CustomerName,
      Phone: data.Phone,
      Address: data.Address,
    });
    return response.data;
  },

  // Cập nhật customer
  update: async (id, data) => {
    const response = await api.patch(`/customers/${id}`, {
      CustomerName: data.CustomerName,
      Phone: data.Phone,
      Address: data.Address,
    });
    return response.data;
  },

  // Xóa customer
  delete: async (id) => {
    const response = await api.delete(`/customers/${id}`);
    return response.data;
  },
};
