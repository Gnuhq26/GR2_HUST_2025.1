import { useState, useEffect } from 'react';
import { FiX, FiPackage, FiTruck, FiCalendar, FiDollarSign, FiFileText } from 'react-icons/fi';
import inventoryService from '../../services/inventoryService';

function ProductStockHistoryModal({ productId, onClose }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    loadHistory();
  }, [productId]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const response = await inventoryService.getProductStockHistory(productId);
      setData(response);
    } catch (err) {
      console.error('Error loading product stock history:', err);
      alert('Có lỗi khi tải lịch sử nhập hàng');
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
        <div className="p-6 border-b bg-gradient-to-r from-blue-500 to-blue-600">
          <div className="flex justify-between items-start">
            <div className="text-white">
              <h2 className="text-2xl font-bold mb-1">Lịch sử nhập hàng</h2>
              {data?.product && (
                <div className="flex items-center gap-4 text-blue-50 text-sm">
                  <div className="flex items-center gap-1">
                    <FiPackage />
                    <span>{data.product.ProductName}</span>
                  </div>
                  <span>•</span>
                  <span>SKU: {data.product.SKU}</span>
                  <span>•</span>
                  <span>Đơn vị gốc: {data.product.BaseUnit}</span>
                </div>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-blue-100 transition-colors"
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
          ) : !data?.history || data.history.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <FiPackage className="text-5xl mb-3 text-gray-300" />
              <p>Chưa có lịch sử nhập hàng cho sản phẩm này</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Summary Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-500 text-white p-3 rounded-lg">
                      <FiFileText className="text-xl" />
                    </div>
                    <div>
                      <p className="text-sm text-blue-600 font-medium">Tổng số lần nhập</p>
                      <p className="text-2xl font-bold text-blue-900">{data.history.length}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
                  <div className="flex items-center gap-3">
                    <div className="bg-green-500 text-white p-3 rounded-lg">
                      <FiPackage className="text-xl" />
                    </div>
                    <div>
                      <p className="text-sm text-green-600 font-medium">Tổng số lượng</p>
                      <p className="text-2xl font-bold text-green-900">
                        {formatQuantity(
                          data.history.reduce((sum, item) => sum + Number(item.Quantity), 0)
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
                  <div className="flex items-center gap-3">
                    <div className="bg-purple-500 text-white p-3 rounded-lg">
                      <FiDollarSign className="text-xl" />
                    </div>
                    <div>
                      <p className="text-sm text-purple-600 font-medium">Tổng giá trị</p>
                      <p className="text-2xl font-bold text-purple-900">
                        {formatCurrency(
                          data.history.reduce((sum, item) => sum + item.TotalPrice, 0)
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* History Table */}
              <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ngày nhập
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Nhà cung cấp
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
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ghi chú
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {data.history.map((item) => (
                      <tr key={item.DetailID} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2 text-sm text-gray-900">
                            <FiCalendar className="text-gray-400" />
                            {formatDate(item.ImportDate)}
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <FiTruck className="text-gray-400" />
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {item.Supplier.SupplierName}
                              </div>
                              <div className="text-xs text-gray-500">
                                Phiếu #{item.ReceiptID}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                            {item.UnitName}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-right">
                          <span className="text-sm font-semibold text-gray-900">
                            {formatQuantity(item.Quantity)}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-right">
                          <span className="text-sm text-gray-700">
                            {formatCurrency(item.UnitPrice)}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-right">
                          <span className="text-sm font-semibold text-green-600">
                            {formatCurrency(item.TotalPrice)}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-sm text-gray-600 max-w-xs truncate">
                            {item.Note || '-'}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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

export default ProductStockHistoryModal;
