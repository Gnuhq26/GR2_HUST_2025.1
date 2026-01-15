import { useState, useEffect } from 'react';
import { FiX, FiFileText, FiUser, FiCalendar, FiPackage, FiDollarSign, FiCheckCircle, FiClock, FiXCircle } from 'react-icons/fi';
import ordersService from '../../services/ordersService';

function OrderDetailModal({ orderId, onClose }) {
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState(null);

  useEffect(() => {
    loadOrderDetail();
  }, [orderId]);

  const loadOrderDetail = async () => {
    try {
      setLoading(true);
      const data = await ordersService.getById(orderId);
      setOrder(data);
    } catch (err) {
      console.error('Error loading order detail:', err);
      alert('Có lỗi khi tải chi tiết đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(value);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatQuantity = (quantity) => {
    return Number(quantity).toLocaleString('vi-VN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  };

  const getStatusConfig = (status) => {
    const statusConfig = {
      Completed: {
        icon: FiCheckCircle,
        className: 'bg-green-500',
        label: 'Hoàn thành',
      },
      Pending: {
        icon: FiClock,
        className: 'bg-yellow-500',
        label: 'Chờ xử lý',
      },
      Cancelled: {
        icon: FiXCircle,
        className: 'bg-red-500',
        label: 'Đã hủy',
      },
    };
    return statusConfig[status] || statusConfig.Completed;
  };

  const statusConfig = order ? getStatusConfig(order.Status) : null;
  const StatusIcon = statusConfig?.icon;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`p-6 border-b ${statusConfig?.className} bg-gradient-to-r`}>
          <div className="flex justify-between items-start">
            <div className="text-white">
              <h2 className="text-2xl font-bold mb-1 flex items-center gap-2">
                <FiFileText />
                Chi tiết đơn hàng #{orderId}
              </h2>
              {order && (
                <div className="flex items-center gap-4 text-white/90 text-sm">
                  <div className="flex items-center gap-1">
                    <FiCalendar />
                    <span>{formatDate(order.OrderDate)}</span>
                  </div>
                  <span>•</span>
                  <div className="flex items-center gap-2">
                    {StatusIcon && <StatusIcon />}
                    <span>{statusConfig.label}</span>
                  </div>
                </div>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-red-400 hover:text-red-600 transition-colors"
            >
              <FiX className="text-2xl" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-gray-500">Đang tải dữ liệu...</div>
            </div>
          ) : !order ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <FiFileText className="text-5xl mb-3 text-gray-300" />
              <p>Không tìm thấy đơn hàng</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Order Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                    <FiUser />
                    <span>Thông tin khách hàng</span>
                  </div>
                  <div className="font-semibold text-gray-900">
                    {order.customer?.CustomerName || 'Khách vãng lai'}
                  </div>
                  {order.customer && (
                    <>
                      <div className="text-sm text-gray-600 mt-1">
                        {order.customer.Phone}
                      </div>
                      {order.customer.Address && (
                        <div className="text-sm text-gray-600 mt-1">
                          {order.customer.Address}
                        </div>
                      )}
                    </>
                  )}
                </div>

                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                    <FiUser />
                    <span>Nhân viên bán hàng</span>
                  </div>
                  <div className="font-semibold text-gray-900">
                    {order.user?.FullName || order.user?.Email}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">{order.user?.Email}</div>
                </div>
              </div>

              {/* Payment Info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <div className="flex items-center gap-2 text-sm text-blue-700 font-medium mb-2">
                    <FiDollarSign />
                    <span>Tổng tiền</span>
                  </div>
                  <div className="font-bold text-2xl text-blue-900">
                    {formatCurrency(order.TotalAmount)}
                  </div>
                </div>

                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <div className="flex items-center gap-2 text-sm text-green-700 font-medium mb-2">
                    <FiCheckCircle />
                    <span>Đã thanh toán</span>
                  </div>
                  <div className="font-bold text-2xl text-green-900">
                    {formatCurrency(order.PaidAmount)}
                  </div>
                </div>

                <div
                  className={`rounded-lg p-4 border ${
                    Number(order.TotalAmount) - Number(order.PaidAmount) > 0
                      ? 'bg-orange-50 border-orange-200'
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div
                    className={`flex items-center gap-2 text-sm font-medium mb-2 ${
                      Number(order.TotalAmount) - Number(order.PaidAmount) > 0
                        ? 'text-orange-700'
                        : 'text-gray-600'
                    }`}
                  >
                    <FiDollarSign />
                    <span>Còn nợ</span>
                  </div>
                  <div
                    className={`font-bold text-2xl ${
                      Number(order.TotalAmount) - Number(order.PaidAmount) > 0
                        ? 'text-orange-900'
                        : 'text-gray-700'
                    }`}
                  >
                    {formatCurrency(Number(order.TotalAmount) - Number(order.PaidAmount))}
                  </div>
                </div>
              </div>

              {/* Note */}
              {order.Note && (
                <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                  <div className="flex items-center gap-2 text-sm text-yellow-700 font-medium mb-2">
                    <FiFileText />
                    <span>Ghi chú</span>
                  </div>
                  <p className="text-gray-700">{order.Note}</p>
                </div>
              )}

              {/* Products Table */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <FiPackage className="text-gray-600" />
                  <h3 className="font-semibold text-gray-800">Danh sách sản phẩm</h3>
                  <span className="text-sm text-gray-500">({order.details.length} sản phẩm)</span>
                </div>

                <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Sản phẩm
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          SKU
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Đơn vị
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Số lượng
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Đơn giá
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Thành tiền
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {order.details.map((detail) => {
                        const totalPrice = Number(detail.Quantity) * Number(detail.UnitPrice);
                        return (
                          <tr key={detail.DetailID} className="hover:bg-gray-50">
                            <td className="px-4 py-4">
                              <div className="font-medium text-gray-900">
                                {detail.product.ProductName}
                              </div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <span className="text-sm text-gray-600">
                                {detail.product.SKU || '-'}
                              </span>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                                {detail.UnitName}
                              </span>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-right">
                              <span className="text-sm font-semibold text-gray-900">
                                {formatQuantity(detail.Quantity)}
                              </span>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-right">
                              <span className="text-sm text-gray-700">
                                {formatCurrency(detail.UnitPrice)}
                              </span>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-right">
                              <span className="text-sm font-semibold text-green-600">
                                {formatCurrency(totalPrice)}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="bg-gray-50">
                      <tr>
                        <td colSpan="5" className="px-4 py-4 text-right font-semibold text-gray-700">
                          Tổng cộng:
                        </td>
                        <td className="px-4 py-4 text-right">
                          <span className="text-lg font-bold text-green-600">
                            {formatCurrency(order.TotalAmount)}
                          </span>
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

export default OrderDetailModal;
