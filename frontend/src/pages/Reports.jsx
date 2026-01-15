import { useState, useEffect } from 'react';
import { FiDollarSign, FiTrendingUp, FiPackage, FiBarChart2, FiCalendar, FiAward } from 'react-icons/fi';
import reportsService from '../services/reportsService';

function Reports() {
  const [loading, setLoading] = useState(false);
  
  // Date range
  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const [startDate, setStartDate] = useState(firstDayOfMonth.toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(today.toISOString().split('T')[0]);

  // Reports data
  const [revenueReport, setRevenueReport] = useState(null);
  const [profitReport, setProfitReport] = useState(null);
  const [topProducts, setTopProducts] = useState(null);
  
  // Top products options
  const [sortBy, setSortBy] = useState('revenue');
  const [limit, setLimit] = useState(10);

  // Load all reports
  const loadReports = async () => {
    try {
      setLoading(true);
      const [revenue, profit, products] = await Promise.all([
        reportsService.getRevenueReport(startDate, endDate),
        reportsService.getProfitReport(startDate, endDate),
        reportsService.getTopProducts(startDate, endDate, sortBy, limit),
      ]);
      
      setRevenueReport(revenue);
      setProfitReport(profit);
      setTopProducts(products);
    } catch (err) {
      console.error('Error loading reports:', err);
      alert('Có lỗi khi tải báo cáo');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  // Handle filter change
  const handleFilterChange = () => {
    loadReports();
  };

  // Format currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(value);
  };

  // Format number
  const formatNumber = (value) => {
    return new Intl.NumberFormat('vi-VN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(value);
  };

  // Format percent
  const formatPercent = (value) => {
    return `${value.toFixed(2)}%`;
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Báo cáo</h1>
        <p className="text-gray-600 text-sm mt-1">Thống kê doanh thu và lợi nhuận</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex items-end gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <FiCalendar className="inline mr-1" />
              Từ ngày
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <FiCalendar className="inline mr-1" />
              Đến ngày
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sắp xếp theo
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="revenue">Doanh thu</option>
              <option value="quantity">Số lượng</option>
            </select>
          </div>

          <div className="w-32">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Hiển thị
            </label>
            <input
              type="number"
              min="1"
              max="50"
              value={limit}
              onChange={(e) => setLimit(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <button
            onClick={handleFilterChange}
            disabled={loading}
            className="bg-primary-600 hover:bg-primary-700 text-black px-6 py-2 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
          >
            <FiBarChart2 />
            {loading ? 'Đang tải...' : 'Xem báo cáo'}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Đang tải báo cáo...</div>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {/* Revenue */}
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white">
              <div className="flex items-center justify-between mb-2">
                <div className="text-blue-100 text-sm">Doanh thu</div>
                <FiDollarSign className="text-3xl text-blue-200" />
              </div>
              <div className="text-2xl font-bold">
                {revenueReport ? formatCurrency(revenueReport.totalRevenue) : '-'}
              </div>
              <div className="text-blue-100 text-xs mt-1">
                {revenueReport ? `${revenueReport.totalOrders} đơn hàng` : '-'}
              </div>
            </div>

            {/* Profit */}
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-6 text-white">
              <div className="flex items-center justify-between mb-2">
                <div className="text-green-100 text-sm">Lợi nhuận</div>
                <FiTrendingUp className="text-3xl text-green-200" />
              </div>
              <div className="text-2xl font-bold">
                {profitReport ? formatCurrency(profitReport.totalProfit) : '-'}
              </div>
              <div className="text-green-100 text-xs mt-1">
                {profitReport ? `Tỷ suất: ${formatPercent(profitReport.profitMargin)}` : '-'}
              </div>
            </div>

            {/* Cost */}
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg p-6 text-white">
              <div className="flex items-center justify-between mb-2">
                <div className="text-orange-100 text-sm">Giá vốn</div>
                <FiPackage className="text-3xl text-orange-200" />
              </div>
              <div className="text-2xl font-bold">
                {profitReport ? formatCurrency(profitReport.totalCost) : '-'}
              </div>
              <div className="text-orange-100 text-xs mt-1">
                Tổng chi phí
              </div>
            </div>

            {/* Top Products Count */}
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-6 text-white">
              <div className="flex items-center justify-between mb-2">
                <div className="text-purple-100 text-sm">SP bán chạy</div>
                <FiAward className="text-3xl text-purple-200" />
              </div>
              <div className="text-2xl font-bold">
                {topProducts ? topProducts.products.length : '-'}
              </div>
              <div className="text-purple-100 text-xs mt-1">
                Sản phẩm
              </div>
            </div>
          </div>

          {/* Revenue & Profit Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Revenue Breakdown */}
            {revenueReport && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center gap-2 mb-4">
                  <FiDollarSign className="text-blue-600" />
                  <h3 className="font-semibold text-gray-800">Chi tiết Doanh thu</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                    <span className="text-gray-700">Tổng doanh thu</span>
                    <span className="font-semibold text-blue-600">
                      {formatCurrency(revenueReport.totalRevenue)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-700">Số đơn hàng</span>
                    <span className="font-semibold text-gray-900">
                      {revenueReport.totalOrders}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-700">Doanh thu TB/đơn</span>
                    <span className="font-semibold text-gray-900">
                      {revenueReport.totalOrders > 0
                        ? formatCurrency(revenueReport.totalRevenue / revenueReport.totalOrders)
                        : formatCurrency(0)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Profit Breakdown */}
            {profitReport && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center gap-2 mb-4">
                  <FiTrendingUp className="text-green-600" />
                  <h3 className="font-semibold text-gray-800">Chi tiết Lợi nhuận</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                    <span className="text-gray-700">Lợi nhuận</span>
                    <span className="font-semibold text-green-600">
                      {formatCurrency(profitReport.totalProfit)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-700">Doanh thu</span>
                    <span className="font-semibold text-gray-900">
                      {formatCurrency(profitReport.totalRevenue)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-700">Giá vốn</span>
                    <span className="font-semibold text-orange-600">
                      {formatCurrency(profitReport.totalCost)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg border-t-2 border-blue-200">
                    <span className="text-gray-700 font-medium">Tỷ suất LN</span>
                    <span className="font-bold text-blue-600">
                      {formatPercent(profitReport.profitMargin)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Top Products Table */}
          {topProducts && (
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="p-6 border-b">
                <div className="flex items-center gap-2">
                  <FiAward className="text-purple-600" />
                  <h3 className="font-semibold text-gray-800">
                    Top {topProducts.products.length} Sản phẩm bán chạy nhất
                  </h3>
                  <span className="text-sm text-gray-500">
                    (Sắp xếp theo {sortBy === 'revenue' ? 'doanh thu' : 'số lượng'})
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        #
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Sản phẩm
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        SKU
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Số lượng bán
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Doanh thu
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {topProducts.products.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                          Không có dữ liệu sản phẩm trong khoảng thời gian này
                        </td>
                      </tr>
                    ) : (
                      topProducts.products.map((product, index) => (
                        <tr
                          key={product.productId}
                          className={`hover:bg-gray-50 ${index < 3 ? 'bg-purple-50/30' : ''}`}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              {index < 3 && (
                                <FiAward
                                  className={`text-lg ${
                                    index === 0
                                      ? 'text-yellow-500'
                                      : index === 1
                                      ? 'text-gray-400'
                                      : 'text-orange-600'
                                  }`}
                                />
                              )}
                              <span className="font-medium text-gray-900">{index + 1}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-medium text-gray-900">{product.productName}</div>
                            <div className="text-xs text-gray-500">{product.baseUnit}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                            {product.sku || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <span className="font-semibold text-gray-900">
                              {formatNumber(product.totalQuantity)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <span className="font-semibold text-green-600">
                              {formatCurrency(product.totalRevenue)}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default Reports;
