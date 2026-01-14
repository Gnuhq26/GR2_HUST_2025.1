import apiClient from './api';

const storesService = {
  /**
   * Create a new store
   */
  async createStore(data) {
    const response = await apiClient.post('/stores', data);
    return response.data;
  },

  /**
   * Get current store details
   */
  async getStoreDetails() {
    const response = await apiClient.get('/stores/details');
    return response.data;
  },

  /**
   * Get all members of current store
   */
  async getMembers() {
    const response = await apiClient.get('/stores/members');
    return response.data;
  },

  /**
   * Add a member to the store
   */
  async addMember(data) {
    const response = await apiClient.post('/stores/members', data);
    return response.data;
  },

  /**
   * Update member role
   */
  async updateMemberRole(userId, roleId) {
    const response = await apiClient.put(`/stores/members/${userId}/role`, {
      roleId,
    });
    return response.data;
  },

  /**
   * Remove a member from store
   */
  async removeMember(userId) {
    const response = await apiClient.delete(`/stores/members/${userId}`);
    return response.data;
  },
};

export default storesService;
