import { Navigate } from 'react-router-dom';
import { usePermission } from '../hooks/usePermission';

export default function PermissionRoute({ action, subject, children }) {
  const { hasPermission, loading } = usePermission(action, subject);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-gray-500">
        Đang kiểm tra quyền truy cập...
      </div>
    );
  }

  if (!hasPermission) {
    return <Navigate to="/forbidden" replace />;
  }

  return children;
}
