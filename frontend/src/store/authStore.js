import { create } from 'zustand';
import { authService } from '../services/authService';

const useAuthStore = create((set) => ({
  // State
  user: JSON.parse(localStorage.getItem('user')) || null,
  token: localStorage.getItem('token') || null,
  stores: JSON.parse(localStorage.getItem('stores')) || [],
  currentStoreId: localStorage.getItem('currentStoreId') || null,
  isAuthenticated: !!localStorage.getItem('token'),
  isLoading: false,
  error: null,

  // Actions
  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const data = await authService.login(email, password);
      
      // Lưu token và user info (backend trả về access_token)
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      // Lưu danh sách cửa hàng nếu có (backend dùng storeId)
      if (data.stores && data.stores.length > 0) {
        localStorage.setItem('stores', JSON.stringify(data.stores));
        // Tự động chọn cửa hàng đầu tiên
        localStorage.setItem('currentStoreId', data.stores[0].storeId);
        set({
          stores: data.stores,
          currentStoreId: data.stores[0].storeId,
        });
      }
      
      set({
        user: data.user,
        token: data.access_token,
        isAuthenticated: true,
        isLoading: false,
      });
      
      return { success: true, data };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Đăng nhập thất bại';
      set({ 
        error: errorMessage, 
        isLoading: false 
      });
      return { success: false, error: errorMessage };
    }
  },

  register: async (userData) => {
    set({ isLoading: true, error: null });
    try {
      const data = await authService.register(userData);
      set({ isLoading: false });
      return { success: true, data };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Đăng ký thất bại';
      set({ 
        error: errorMessage, 
        isLoading: false 
      });
      return { success: false, error: errorMessage };
    }
  },

  logout: () => {
    authService.logout();
    set({
      user: null,
      token: null,
      stores: [],
      currentStoreId: null,
      isAuthenticated: false,
      error: null,
    });
  },

  setCurrentStore: (storeId) => {
    localStorage.setItem('currentStoreId', storeId);
    set({ currentStoreId: storeId });
  },

  clearError: () => {
    set({ error: null });
  },

  // Load user profile from token
  loadProfile: async () => {
    set({ isLoading: true });
    try {
      const data = await authService.getProfile();
      localStorage.setItem('user', JSON.stringify(data.user));
      
      if (data.stores) {
        localStorage.setItem('stores', JSON.stringify(data.stores));
        set({ stores: data.stores });
      }
      
      set({
        user: data.user,
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false });
      // Nếu không lấy được profile, logout
      useAuthStore.getState().logout();
    }
  },
}));

export default useAuthStore;
