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
  FiSettings
} from 'react-icons/fi';

export default function Sidebar() {
  const menuItems = [
    { path: '/', icon: FiHome, label: 'Dashboard' },
    { path: '/products', icon: FiShoppingBag, label: 'Sản phẩm' },
    { path: '/categories', icon: FiGrid, label: 'Danh mục' },
    { path: '/inventory', icon: FiPackage, label: 'Nhập kho' },
    { path: '/orders', icon: FiShoppingCart, label: 'Đơn hàng' },
    { path: '/customers', icon: FiUsers, label: 'Khách hàng' },
    { path: '/suppliers', icon: FiTruck, label: 'Nhà cung cấp' },
    { path: '/reports', icon: FiBarChart2, label: 'Báo cáo' },
    { path: '/settings', icon: FiSettings, label: 'Cài đặt' },
  ];

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
        <ul className="space-y-1">
          {menuItems.map((item) => (
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
