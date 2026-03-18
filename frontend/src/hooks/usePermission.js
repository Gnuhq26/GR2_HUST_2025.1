import { useState, useEffect } from 'react';
import useAuthStore from '../store/authStore';
import { authService } from '../services/authService';

/**
 * Hook to check if current user has a specific permission
 * @param {string} action - Permission action (e.g., 'create', 'read', 'update', 'delete', 'manage')
 * @param {string} subject - Permission subject (e.g., 'Product', 'Order', 'Customer', 'all')
 * @returns {boolean} - True if user has permission, false otherwise
 */
export function usePermission(action, subject) {
  const { stores, currentStoreId } = useAuthStore();
  const [hasPermission, setHasPermission] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkPermission = async () => {
      setLoading(true);
      
      // Find current store
      const parsedStoreId = Number(currentStoreId);
      const currentStore = stores.find((s) => s.storeId === parsedStoreId) || stores[0];
      
      if (!currentStore || !currentStore.roleId) {
        setHasPermission(false);
        setLoading(false);
        return;
      }

      try {
        // Get effective permissions of current user in selected store
        const permissions = await authService.getMyPermissions();
        
        // Check for super admin permission (manage all)
        const isSuperAdmin = permissions.some(
          p => p.Action === 'manage' && p.Subject === 'all'
        );
        
        if (isSuperAdmin) {
          setHasPermission(true);
          setLoading(false);
          return;
        }
        
        // Check for specific permission
        const hasSpecificPermission = permissions.some(
          p => p.Action === action && p.Subject === subject
        );
        
        setHasPermission(hasSpecificPermission);
      } catch (error) {
        console.error('Error checking permission:', error);
        setHasPermission(false);
      } finally {
        setLoading(false);
      }
    };

    checkPermission();
  }, [action, subject, stores, currentStoreId]);

  return { hasPermission, loading };
}

/**
 * Hook to get all permissions of current user
 * @returns {object} - Object with permissions array and loading state
 */
export function usePermissions() {
  const { stores, currentStoreId } = useAuthStore();
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPermissions = async () => {
      setLoading(true);
      
      // Find current store
      const parsedStoreId = Number(currentStoreId);
      const currentStore = stores.find((s) => s.storeId === parsedStoreId) || stores[0];
      
      if (!currentStore || !currentStore.roleId) {
        setPermissions([]);
        setLoading(false);
        return;
      }

      try {
        const rolePermissions = await authService.getMyPermissions();
        setPermissions(rolePermissions);
      } catch (error) {
        console.error('Error loading permissions:', error);
        setPermissions([]);
      } finally {
        setLoading(false);
      }
    };

    loadPermissions();
  }, [stores, currentStoreId]);

  return { permissions, loading };
}

/**
 * Hook to check if current user can perform an action
 * Similar to usePermission but returns a function
 * @returns {function} - Function that takes (action, subject) and returns boolean
 */
export function useCanPerform() {
  const { permissions, loading } = usePermissions();

  const canPerform = (action, subject) => {
    if (loading) return false;
    
    // Check for super admin permission
    // Backend returns array of permission objects directly
    const isSuperAdmin = permissions.some(
      p => p.Action === 'manage' && p.Subject === 'all'
    );
    
    if (isSuperAdmin) return true;
    
    // Check for specific permission
    return permissions.some(
      p => p.Action === action && p.Subject === subject
    );
  };

  return { canPerform, loading };
}
