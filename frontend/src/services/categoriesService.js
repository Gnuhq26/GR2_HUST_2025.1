import api from './api';

export const categoriesService = {
  // Lấy danh sách categories
  getAll: async (search = '') => {
    const params = search ? { search } : {};
    const response = await api.get('/categories', { params });
    return response.data;
  },

  // Lấy chi tiết category
  getById: async (id) => {
    const response = await api.get(`/categories/${id}`);
    return response.data;
  },

  // Tạo category mới
  create: async (data) => {
    const response = await api.post('/categories', {
      categoryName: data.CategoryName,
      description: data.Description,
    });
    return response.data;
  },

  // Cập nhật category
  update: async (id, data) => {
    const response = await api.patch(`/categories/${id}`, {
      categoryName: data.CategoryName,
      description: data.Description,
    });
    return response.data;
  },

  // Xóa category
  delete: async (id) => {
    const response = await api.delete(`/categories/${id}`);
    return response.data;
  },
};
