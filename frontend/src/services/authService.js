import api from './api';

export const authService = {
  // Đăng nhập
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  // Đăng ký
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  // Lấy thông tin user hiện tại
  getProfile: async () => {
    const response = await api.get('/auth/profile');
    return response.data;
  },

  // Lấy quyền hiện tại của user theo store đang chọn
  getMyPermissions: async () => {
    const response = await api.get('/auth/permissions');
    return response.data;
  },

  // Đăng xuất (client-side)
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('stores');
    localStorage.removeItem('currentStoreId');
  },
};
