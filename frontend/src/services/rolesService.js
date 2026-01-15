import apiClient from './api';

const rolesService = {
  /**
   * Get all roles in current store
   */
  async getAll() {
    const response = await apiClient.get('/roles');
    return response.data;
  },

  /**
   * Get role by ID
   */
  async getById(id) {
    const response = await apiClient.get(`/roles/${id}`);
    return response.data;
  },

  /**
   * Create a new role
   */
  async create(data) {
    const response = await apiClient.post('/roles', {
      roleName: data.roleName,
      description: data.description,
    });
    return response.data;
  },

  /**
   * Update a role
   */
  async update(id, data) {
    const response = await apiClient.put(`/roles/${id}`, {
      roleName: data.roleName,
      description: data.description,
    });
    return response.data;
  },

  /**
   * Delete a role
   */
  async delete(id) {
    const response = await apiClient.delete(`/roles/${id}`);
    return response.data;
  },

  /**
   * Assign permissions to a role
   */
  async assignPermissions(roleId, permissionIds) {
    const response = await apiClient.post(`/roles/${roleId}/permissions`, {
      permissionIds,
    });
    return response.data;
  },

  /**
   * Get permissions of a role
   */
  async getPermissions(roleId) {
    const response = await apiClient.get(`/roles/${roleId}/permissions`);
    return response.data;
  },
};

export default rolesService;
