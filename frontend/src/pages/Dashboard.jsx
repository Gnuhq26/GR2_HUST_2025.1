import { useState, useEffect } from 'react';
import { FiShoppingBag, FiShoppingCart, FiUsers, FiDollarSign } from 'react-icons/fi';
import { productsService } from '../services/productsService';
import { customersService } from '../services/customersService';
import ordersService from '../services/ordersService';

function formatCurrency(amount) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
}

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    products: 0,
    orders: 0,
    customers: 0,
    revenue: 0,
  });
  const [recentOrders, setRecentOrders] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [products, customers, orders] = await Promise.all([
          productsService.getAll().catch(() => []),
          customersService.getAll().catch(() => []),
          ordersService.getAll().catch(() => []),
        ]);

        const revenue = orders.reduce(
          (sum, order) => sum + parseFloat(order.TotalAmount || 0),
          0,
        );

        setStats({
          products: products.length,
          customers: customers.length,
          orders: orders.length,
          revenue,
        });

        // 5 đơn hàng gần nhất
        setRecentOrders(orders.slice(0, 5));
      } catch (err) {
        console.error('Dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const statCards = [
    { icon: FiShoppingBag, label: 'Sản phẩm', value: stats.products, color: 'text-blue-600', bg: 'bg-blue-50' },
    { icon: FiShoppingCart, label: 'Đơn hàng', value: stats.orders, color: 'text-green-600', bg: 'bg-green-50' },
    { icon: FiUsers, label: 'Khách hàng', value: stats.customers, color: 'text-purple-600', bg: 'bg-purple-50' },
    { icon: FiDollarSign, label: 'Doanh thu', value: formatCurrency(stats.revenue), color: 'text-orange-600', bg: 'bg-orange-50' },
  ];

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Tổng quan hệ thống quản lý bán hàng</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat, index) => (
          <div key={index} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 mb-2">{stat.label}</p>
                {loading ? (
                  <div className="h-8 w-24 bg-gray-100 animate-pulse rounded" />
                ) : (
                  <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                )}
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
        {/* Đơn hàng gần đây */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Đơn hàng gần đây</h3>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-100 animate-pulse rounded" />
              ))}
            </div>
          ) : recentOrders.length === 0 ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                <FiShoppingCart className="text-gray-400 text-2xl" />
              </div>
              <p className="text-gray-500">Chưa có đơn hàng nào</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {recentOrders.map((order) => (
                <div key={order.OrderID} className="py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      #{order.OrderID} — {order.customer?.CustomerName || 'Khách vãng lai'}
                    </p>
                    <p className="text-xs text-gray-500">{formatDate(order.OrderDate)}</p>
                  </div>
                  <span className="text-sm font-semibold text-green-600">
                    {formatCurrency(order.TotalAmount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Thống kê nhanh */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Thống kê nhanh</h3>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-10 bg-gray-100 animate-pulse rounded" />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <span className="text-sm text-blue-700 font-medium">Tổng sản phẩm</span>
                <span className="text-lg font-bold text-blue-700">{stats.products}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <span className="text-sm text-green-700 font-medium">Tổng đơn hàng</span>
                <span className="text-lg font-bold text-green-700">{stats.orders}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                <span className="text-sm text-purple-700 font-medium">Tổng khách hàng</span>
                <span className="text-lg font-bold text-purple-700">{stats.customers}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                <span className="text-sm text-orange-700 font-medium">Tổng doanh thu</span>
                <span className="text-lg font-bold text-orange-700">{formatCurrency(stats.revenue)}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
