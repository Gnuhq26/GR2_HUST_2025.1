import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Thêm token và store ID vào mọi request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    const currentStoreId = localStorage.getItem('currentStoreId');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Thêm X-Store-ID header cho các request cần multi-tenant
    if (currentStoreId && !config.headers['X-Store-ID']) {
      config.headers['X-Store-ID'] = currentStoreId;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Xử lý lỗi chung
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
      // Xử lý các lỗi HTTP
      switch (error.response.status) {
        case 401:
          // Unauthorized - Token hết hạn hoặc không hợp lệ
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          localStorage.removeItem('stores');
          localStorage.removeItem('currentStoreId');
          window.location.href = '/login';
          break;
        case 403:
          // Forbidden - Không có quyền truy cập
          console.error('Bạn không có quyền thực hiện hành động này');
          break;
        case 404:
          console.error('Không tìm thấy tài nguyên');
          break;
        case 500:
          console.error('Lỗi máy chủ nội bộ');
          break;
        default:
          console.error('Đã xảy ra lỗi:', error.response.data.message);
      }
    } else if (error.request) {
      // Request đã được gửi nhưng không nhận được phản hồi
      console.error('Không thể kết nối đến máy chủ');
    } else {
      // Lỗi khác
      console.error('Lỗi:', error.message);
    }
    return Promise.reject(error);
  }
);

export default api;
