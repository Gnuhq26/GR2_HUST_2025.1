import { FiShoppingBag, FiShoppingCart, FiUsers, FiDollarSign } from 'react-icons/fi';

export default function Dashboard() {
  // Placeholder data
  const stats = [
    { icon: FiShoppingBag, label: 'Sản phẩm', value: '0', color: 'text-blue-600', bg: 'bg-blue-50' },
    { icon: FiShoppingCart, label: 'Đơn hàng', value: '0', color: 'text-green-600', bg: 'bg-green-50' },
    { icon: FiUsers, label: 'Khách hàng', value: '0', color: 'text-purple-600', bg: 'bg-purple-50' },
    { icon: FiDollarSign, label: 'Doanh thu', value: '0đ', color: 'text-orange-600', bg: 'bg-orange-50' },
  ];

  return (
    <div className="max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Tổng quan hệ thống quản lý bán hàng</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 mb-2">{stat.label}</p>
                <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
              </div>
              <div className={`${stat.bg} ${stat.color} p-3 rounded-lg`}>
                <stat.icon className="text-2xl" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Đơn hàng gần đây</h3>
            <button className="text-sm text-primary-600 hover:text-primary-700 font-medium">
              Xem tất cả
            </button>
          </div>
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
              <FiShoppingCart className="text-gray-400 text-2xl" />
            </div>
            <p className="text-gray-500">Chưa có đơn hàng nào</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Sản phẩm bán chạy</h3>
            <button className="text-sm text-primary-600 hover:text-primary-700 font-medium">
              Xem tất cả
            </button>
          </div>
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
              <FiShoppingBag className="text-gray-400 text-2xl" />
            </div>
            <p className="text-gray-500">Chưa có dữ liệu</p>
          </div>
        </div>
      </div>
    </div>
  );
}
