import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { FiHome, FiClock, FiLogOut } from 'react-icons/fi';
import useAuthStore from '../store/authStore';

function NoStore() {
  const navigate = useNavigate();
  const { logout, user, refreshAuth } = useAuthStore();

  // Check if user has stores on mount (they might have been added after login)
  useEffect(() => {
    const checkStores = async () => {
      const result = await refreshAuth();
      if (result.success) {
        const stores = result.stores || [];
        
        if (stores.length === 1) {
          navigate('/', { replace: true });
        } else if (stores.length > 1) {
          navigate('/select-store', { replace: true });
        }
        // If stores.length === 0, stay on this page
      }
    };
    
    checkStores();
  }, [refreshAuth, navigate]);

  const handleCreateStore = () => {
    navigate('/create-store');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center p-6">
      <div className="max-w-4xl w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <div className="bg-primary-600 text-white p-4 rounded-full">
              <FiHome className="text-4xl" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Chào mừng đến với hệ thống POS
          </h1>
          <p className="text-gray-600">
            Bạn chưa thuộc cửa hàng nào. Hãy chọn một trong hai lựa chọn bên dưới:
          </p>
          {user && (
            <p className="text-sm text-gray-500 mt-2">
              Đăng nhập với email: <span className="font-medium">{user.Email}</span>
            </p>
          )}
        </div>

        {/* Options */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Option A: Create Store */}
          <div className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition-shadow">
            <div className="flex justify-center mb-4">
              <div className="bg-green-100 text-green-600 p-3 rounded-full">
                <FiHome className="text-3xl" />
              </div>
            </div>
            <h2 className="text-xl font-bold text-gray-800 text-center mb-3">
              Tạo cửa hàng mới
            </h2>
            <p className="text-gray-600 text-center mb-6">
              Bạn là chủ cửa hàng? Tạo cửa hàng của riêng bạn và bắt đầu quản lý ngay.
            </p>
            <button
              onClick={handleCreateStore}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              <FiHome />
              Tạo cửa hàng đầu tiên
            </button>
          </div>

          {/* Option B: Wait for Invitation */}
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="flex justify-center mb-4">
              <div className="bg-blue-100 text-blue-600 p-3 rounded-full">
                <FiClock className="text-3xl" />
              </div>
            </div>
            <h2 className="text-xl font-bold text-gray-800 text-center mb-3">
              Chờ lời mời
            </h2>
            <p className="text-gray-600 text-center mb-6">
              Bạn là nhân viên? Cung cấp email của bạn cho quản lý để được thêm vào hệ thống.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-blue-800 text-center">
                <strong>Email của bạn:</strong>
                <br />
                <span className="text-blue-600 font-medium">{user?.Email || 'N/A'}</span>
              </p>
            </div>
            <p className="text-xs text-gray-500 text-center mb-4">
              Hãy liên hệ với quản lý cửa hàng và cung cấp email này để được cấp quyền truy cập.
            </p>
          </div>
        </div>

        {/* Logout */}
        <div className="text-center mt-8">
          <button
            onClick={handleLogout}
            className="text-gray-600 hover:text-gray-800 font-medium flex items-center gap-2 mx-auto transition-colors"
          >
            <FiLogOut />
            Đăng xuất
          </button>
        </div>
      </div>
    </div>
  );
}

export default NoStore;
