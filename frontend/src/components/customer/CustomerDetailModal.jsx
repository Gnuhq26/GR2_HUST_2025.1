import { useEffect, useState } from 'react';
import { FiX, FiUser, FiPhone, FiMapPin, FiCalendar, FiShoppingCart, FiLoader, FiDollarSign, FiCheckCircle, FiClock, FiXCircle } from 'react-icons/fi';
import { customersService } from '../../services/customersService';

export default function CustomerDetailModal({ customerId, onClose }) {
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadCustomerDetail = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await customersService.getById(customerId);
        setCustomer(data);
      } catch (err) {
        console.error('Lỗi tải chi tiết khách hàng:', err);
        setError('Không thể tải thông tin khách hàng');
      } finally {
        setLoading(false);
      }
    };

    if (customerId) {
      loadCustomerDetail();
    }
  }, [customerId]);

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount) => {
    if (!amount) return '0đ';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const getStatusBadge = (order) => {
    const debt = Number(order.TotalAmount) - Number(order.PaidAmount);
    
    // Nếu còn nợ, hiển thị trạng thái "Chưa thanh toán" bất kể Status từ backend
    if (debt > 0) {
      return { 
        label: 'Chưa thanh toán', 
        color: 'bg-orange-100 text-orange-700', 
        icon: FiDollarSign 
      };
    }
    
    // Nếu đã thanh toán đủ, dựa vào Status từ backend
    const statusConfig = {
      Completed: { label: 'Hoàn thành', color: 'bg-green-100 text-green-700', icon: FiCheckCircle },
      Pending: { label: 'Chờ xử lý', color: 'bg-yellow-100 text-yellow-700', icon: FiClock },
      Cancelled: { label: 'Đã hủy', color: 'bg-red-100 text-red-700', icon: FiXCircle },
    };
    
    return statusConfig[order.Status] || { label: order.Status, color: 'bg-gray-100 text-gray-700', icon: FiClock };
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-[60] p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
          <h2 className="text-xl font-bold text-gray-900">Chi tiết khách hàng</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FiX size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <FiLoader className="animate-spin text-primary-600" size={32} />
              <span className="ml-3 text-gray-600">Đang tải...</span>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-600">{error}</p>
              <button
                onClick={onClose}
                className="mt-4 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Đóng
              </button>
            </div>
          ) : customer ? (
            <div className="space-y-6">
              {/* Customer Info Card */}
              <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-lg p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-white rounded-full shadow-sm">
                    <FiUser className="text-primary-600" size={32} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-gray-900 mb-1">
                      {customer.CustomerName}
                    </h3>
                    <p className="text-sm text-gray-600">
                      ID: {customer.CustomerID}
                    </p>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div>
                <h4 className="text-sm font-semibold text-gray-500 uppercase mb-3">
                  Thông tin liên hệ
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <FiPhone className="text-gray-400 flex-shrink-0" size={20} />
                    <div>
                      <p className="text-xs text-gray-500">Số điện thoại</p>
                      <p className="text-sm font-medium text-gray-900">
                        {customer.Phone || <span className="text-gray-400 italic">Chưa có</span>}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <FiMapPin className="text-gray-400 flex-shrink-0 mt-0.5" size={20} />
                    <div>
                      <p className="text-xs text-gray-500">Địa chỉ</p>
                      <p className="text-sm font-medium text-gray-900">
                        {customer.Address || <span className="text-gray-400 italic">Chưa có</span>}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Orders Summary */}
              {customer.orders && customer.orders.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-500 uppercase mb-3">
                    Lịch sử mua hàng
                  </h4>
                  <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="p-3 bg-green-100 rounded-lg">
                      <FiShoppingCart className="text-green-600" size={24} />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Đơn hàng gần đây</p>
                      <p className="text-2xl font-bold text-green-700">
                        {customer.orders.length} đơn
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        (10 đơn hàng gần nhất)
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Recent Orders List */}
              {customer.orders && customer.orders.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-500 uppercase mb-3">
                    Chi tiết đơn hàng
                  </h4>
                  <div className="space-y-3">
                    {customer.orders.map((order) => {
                      const status = getStatusBadge(order);
                      const StatusIcon = status.icon;
                      const debt = Number(order.TotalAmount) - Number(order.PaidAmount);
                      
                      return (
                        <div 
                          key={order.OrderID}
                          className="p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <p className="text-sm font-semibold text-gray-900">
                                Đơn hàng #{order.OrderID}
                              </p>
                              <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                                <FiCalendar size={12} />
                                {formatDate(order.OrderDate)}
                              </p>
                            </div>
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
                              <StatusIcon size={12} />
                              {status.label}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-gray-100">
                            <div>
                              <p className="text-xs text-gray-500">Tổng tiền</p>
                              <p className="text-sm font-bold text-gray-900">
                                {formatCurrency(order.TotalAmount)}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Đã trả</p>
                              <p className="text-sm font-semibold text-green-600">
                                {formatCurrency(order.PaidAmount)}
                              </p>
                            </div>
                          </div>

                          {debt > 0 && (
                            <div className="mt-2 p-2 bg-orange-50 border border-orange-200 rounded flex items-center gap-2">
                              <FiDollarSign className="text-orange-600" size={14} />
                              <span className="text-xs text-orange-700">
                                Còn nợ: <strong>{formatCurrency(debt)}</strong>
                              </span>
                            </div>
                          )}

                          {order.Note && (
                            <div className="mt-2 text-xs text-gray-600 italic">
                              Ghi chú: {order.Note}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Timestamps */}
              <div>
                <h4 className="text-sm font-semibold text-gray-500 uppercase mb-3">
                  Thông tin hệ thống
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-3 text-sm">
                    <FiCalendar className="text-gray-400" size={16} />
                    <span className="text-gray-600">Ngày tạo:</span>
                    <span className="font-medium text-gray-900">
                      {formatDate(customer.CreatedAt)}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <FiCalendar className="text-gray-400" size={16} />
                    <span className="text-gray-600">Cập nhật lần cuối:</span>
                    <span className="font-medium text-gray-900">
                      {formatDate(customer.UpdatedAt)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer */}
        {!loading && !error && (
          <div className="p-6 border-t border-gray-200 flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Đóng
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
