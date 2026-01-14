import { useState } from 'react';
import { FiUser, FiLogOut, FiChevronDown, FiShoppingBag } from 'react-icons/fi';
import useAuthStore from '../store/authStore';

export default function Header() {
  const { user, stores, currentStoreId, setCurrentStore, logout } = useAuthStore();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showStoreMenu, setShowStoreMenu] = useState(false);

  const currentStore = stores.find(s => s.storeId === currentStoreId);

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Search - Placeholder */}
        <div className="flex-1 max-w-xl">
          <div className="relative">
            <input
              type="text"
              placeholder="Tìm kiếm..."
              className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-4">
          {/* Store Selector */}
          {stores.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setShowStoreMenu(!showStoreMenu)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FiShoppingBag className="text-gray-600" />
                <span className="text-sm font-medium text-gray-700">
                  {currentStore?.storeName || 'Chọn cửa hàng'}
                </span>
                <FiChevronDown className="text-gray-400" />
              </button>

              {showStoreMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                  {stores.map((store) => (
                    <button
                      key={store.storeId}
                      onClick={() => {
                        setCurrentStore(store.storeId);
                        setShowStoreMenu(false);
                      }}
                      className={`w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors ${
                        store.storeId === currentStoreId ? 'bg-primary-50 text-primary-700' : 'text-gray-700'
                      }`}
                    >
                      <div className="font-medium">{store.storeName}</div>
                      <div className="text-xs text-gray-500">{store.subdomain}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                <FiUser className="text-primary-600" />
              </div>
              <div className="text-left">
                <div className="text-sm font-medium text-gray-900">{user?.FullName || 'User'}</div>
                <div className="text-xs text-gray-500">{user?.Email}</div>
              </div>
              <FiChevronDown className="text-gray-400" />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors flex items-center gap-2 text-red-600"
                >
                  <FiLogOut />
                  <span>Đăng xuất</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
