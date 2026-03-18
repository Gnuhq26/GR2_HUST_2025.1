import { Link } from 'react-router-dom';
import { FiShieldOff, FiHome } from 'react-icons/fi';

export default function Forbidden() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="max-w-lg w-full bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
        <div className="mx-auto mb-4 w-14 h-14 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
          <FiShieldOff size={28} />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">Không có quyền truy cập</h1>
        <p className="text-gray-600 mb-6">
          Tài khoản của bạn không có quyền thực hiện hành động này trong cửa hàng hiện tại.
        </p>

        <Link
          to="/"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition-colors"
        >
          <FiHome />
          Quay về Dashboard
        </Link>
      </div>
    </div>
  );
}
