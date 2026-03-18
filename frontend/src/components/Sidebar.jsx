import { NavLink } from 'react-router-dom';
import { FiShoppingBag } from 'react-icons/fi';
import { useCanPerform } from '../hooks/usePermission';
import { protectedRoutes } from '../routes/protectedRoutes';

export default function Sidebar() {
  const { canPerform, loading } = useCanPerform();

  const canAccessRoute = (route) => {
    if (!route.permission) return true;
    if (loading) return false; // Avoid flashing unauthorized items while loading

    return canPerform(route.permission.action, route.permission.subject);
  };

  // Filter menu items based on permissions
  const visibleMenuItems = protectedRoutes
    .filter((route) => route.menu?.group === 'main')
    .filter(canAccessRoute);

  const visibleStoreItems = protectedRoutes
    .filter((route) => route.menu?.group === 'store')
    .filter(canAccessRoute);

  return (
    <aside className="w-64 bg-white border-r border-gray-200 h-screen sticky top-0 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
            <FiShoppingBag className="text-white text-xl" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-blue-900">POS System</h1>
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
                  <item.menu.icon className="text-xl" />
                  <span>{item.menu.label}</span>
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
                  <item.menu.icon className="text-xl" />
                  <span>{item.menu.label}</span>
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
