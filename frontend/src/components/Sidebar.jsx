import { NavLink } from 'react-router-dom';
import { 
  FiHome, 
  FiShoppingBag, 
  FiGrid, 
  FiPackage, 
  FiShoppingCart, 
  FiUsers, 
  FiTruck,
  FiBarChart2,
  FiSettings,
  FiShield
} from 'react-icons/fi';
import { useCanPerform } from '../hooks/usePermission';

export default function Sidebar() {
  const { canPerform, loading } = useCanPerform();

  // Menu items với quyền tương ứng
  const menuItems = [
    { path: '/', icon: FiHome, label: 'Dashboard', permission: null }, // Dashboard accessible to all
    { path: '/products', icon: FiShoppingBag, label: 'Sản phẩm', permission: { action: 'read', subject: 'Product' } },
    { path: '/categories', icon: FiGrid, label: 'Danh mục', permission: { action: 'read', subject: 'Category' } },
    { path: '/inventory', icon: FiPackage, label: 'Nhập kho', permission: { action: 'read', subject: 'Inventory' } },
    { path: '/orders', icon: FiShoppingCart, label: 'Đơn hàng', permission: { action: 'read', subject: 'Order' } },
    { path: '/customers', icon: FiUsers, label: 'Khách hàng', permission: { action: 'read', subject: 'Customer' } },
    { path: '/suppliers', icon: FiTruck, label: 'Nhà cung cấp', permission: { action: 'read', subject: 'Supplier' } },
    { path: '/reports', icon: FiBarChart2, label: 'Báo cáo', permission: { action: 'read', subject: 'Report' } },
  ];

  const storeMenuItems = [
    { path: '/store/settings', icon: FiSettings, label: 'Cài đặt', permission: { action: 'read', subject: 'Store' } },
    { path: '/store/members', icon: FiShield, label: 'Thành viên', permission: { action: 'read', subject: 'User' } },
    { path: '/store/roles', icon: FiShield, label: 'Vai trò', permission: { action: 'read', subject: 'Role' } },
  ];

  // Filter menu items based on permissions
  const visibleMenuItems = menuItems.filter(item => {
    if (!item.permission) return true; // No permission required
    if (loading) return true; // Show all while loading
    return canPerform(item.permission.action, item.permission.subject);
  });

  const visibleStoreItems = storeMenuItems.filter(item => {
    if (!item.permission) return true;
    if (loading) return true;
    return canPerform(item.permission.action, item.permission.subject);
  });

  return (
    <aside className="w-64 bg-white border-r border-gray-200 h-screen sticky top-0 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
            <FiShoppingBag className="text-white text-xl" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">POS System</h1>
            <p className="text-xs text-gray-500">Quản lý bán hàng</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 overflow-y-auto">
        {/* Main Menu */}
        <div className="mb-6">
          <h3 className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Quản lý
          </h3>
          <ul className="space-y-1">
            {visibleMenuItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  end={item.path === '/'}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-primary-50 text-primary-700 font-medium'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`
                  }
                >
                  <item.icon className="text-xl" />
                  <span>{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </div>

        {/* Store Management Menu */}
        <div>
          <h3 className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Cửa hàng
          </h3>
          <ul className="space-y-1">
            {visibleStoreItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-primary-50 text-primary-700 font-medium'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`
                  }
                >
                  <item.icon className="text-xl" />
                  <span>{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <div className="text-xs text-gray-500 text-center">
          © 2026 POS System
        </div>
      </div>
    </aside>
  );
}
