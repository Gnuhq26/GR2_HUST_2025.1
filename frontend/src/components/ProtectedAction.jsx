import { usePermission } from '../hooks/usePermission';

/**
 * Component to protect UI elements based on permissions
 * Hides children if user doesn't have required permission
 * 
 * @param {string} action - Required action (create, read, update, delete, manage)
 * @param {string} subject - Required subject (Product, Order, Customer, etc.)
 * @param {React.ReactNode} children - Content to render if permission granted
 * @param {React.ReactNode} fallback - Optional content to render if permission denied
 */
export default function ProtectedAction({ action, subject, children, fallback = null }) {
  const { hasPermission, loading } = usePermission(action, subject);

  if (loading) {
    return fallback;
  }

  if (!hasPermission) {
    return fallback;
  }

  return children;
}
