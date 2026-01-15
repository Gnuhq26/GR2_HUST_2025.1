import apiClient from './api';

const permissionsService = {
  /**
   * Get all permissions
   */
  async getAll() {
    const response = await apiClient.get('/permissions');
    return response.data;
  },

  /**
   * Get permissions grouped by subject
   */
  async getGrouped() {
    const response = await apiClient.get('/permissions/grouped');
    return response.data;
  },

  /**
   * Get permission by ID
   */
  async getById(id) {
    const response = await apiClient.get(`/permissions/${id}`);
    return response.data;
  },
};

export default permissionsService;
