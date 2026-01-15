import { useState, useEffect } from 'react';
import { FiPlus, FiShoppingCart, FiUser, FiX, FiDollarSign, FiFileText, FiEye, FiClock, FiCheckCircle, FiXCircle } from 'react-icons/fi';
import ordersService from '../services/ordersService';
import { customersService } from '../services/customersService';
import { productsService } from '../services/productsService';
import OrderDetailModal from '../components/orders/OrderDetailModal';
import ProtectedAction from '../components/ProtectedAction';

function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState(null);

  // Create Order Form States
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [note, setNote] = useState('');
  const [items, setItems] = useState([{ productId: '', unitName: '', quantity: '' }]);

  // Load orders
  const loadOrders = async () => {
    try {
      setLoading(true);
      const data = await ordersService.getAll();
      setOrders(data);
    } catch (err) {
      console.error('Error loading orders:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load form data (customers and products)
  const loadFormData = async () => {
    try {
      const [customersData, productsData] = await Promise.all([
        customersService.getAll(),
        productsService.getAll(),
      ]);
      setCustomers(customersData);
      setProducts(productsData.filter((p) => p.IsActive));
    } catch (err) {
      console.error('Error loading form data:', err);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  // Open create modal
  const handleOpenCreate = async () => {
    await loadFormData();
    setSelectedCustomer('');
    setNote('');
    setItems([{ productId: '', unitName: '', quantity: '' }]);
    setIsCreateModalOpen(true);
  };

  // Add item
  const handleAddItem = () => {
    setItems([...items, { productId: '', unitName: '', quantity: '' }]);
  };

  // Remove item
  const handleRemoveItem = (index) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  // Update item
  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;

    // Auto-fill BaseUnit when product selected
    if (field === 'productId') {
      const product = products.find((p) => p.ProductID === parseInt(value));
      if (product) {
        newItems[index].unitName = product.BaseUnit;
      }
    }

    setItems(newItems);
  };

  // Submit create order
  const handleSubmitCreate = async (e) => {
    e.preventDefault();

    const validItems = items.filter(
      (item) => item.productId && item.unitName && item.quantity
    );

    if (validItems.length === 0) {
      alert('Vui lòng thêm ít nhất 1 sản phẩm hợp lệ');
      return;
    }

    try {
      await ordersService.createOrder({
        customerId: selectedCustomer ? parseInt(selectedCustomer) : null,
        note,
        items: validItems.map((item) => ({
          productId: parseInt(item.productId),
          unitName: item.unitName,
          quantity: parseFloat(item.quantity),
        })),
      });

      alert('Tạo đơn hàng thành công!');
      setIsCreateModalOpen(false);
      loadOrders();
    } catch (err) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra khi tạo đơn hàng');
      console.error('Error creating order:', err);
    }
  };

  // Calculate total
  const calculateTotal = () => {
    return items.reduce((sum, item) => {
      const product = products.find((p) => p.ProductID === parseInt(item.productId));
      if (!product || !item.quantity || !item.unitName) return sum;

      // Find matching price
      const price = product.prices?.find((p) => p.UnitName === item.unitName);
      if (!price) return sum;

      return sum + parseFloat(item.quantity) * parseFloat(price.UnitPrice);
    }, 0);
  };

  // Format currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(value);
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Get status badge
  const getStatusBadge = (status) => {
    const statusConfig = {
      Completed: {
        icon: FiCheckCircle,
        className: 'bg-green-100 text-green-800',
        label: 'Hoàn thành',
      },
      Pending: {
        icon: FiClock,
        className: 'bg-yellow-100 text-yellow-800',
        label: 'Chờ xử lý',
      },
      Cancelled: {
        icon: FiXCircle,
        className: 'bg-red-100 text-red-800',
        label: 'Đã hủy',
      },
    };

    const config = statusConfig[status] || statusConfig.Completed;
    const Icon = config.icon;

    return (
      <span
        className={`px-3 py-1 inline-flex items-center gap-1 text-xs leading-5 font-semibold rounded-full ${config.className}`}
      >
        <Icon className="text-sm" />
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Đang tải...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Quản lý Đơn hàng</h1>
          <p className="text-gray-600 text-sm mt-1">Tạo và theo dõi đơn hàng</p>
        </div>
        <ProtectedAction action="create" subject="Order">
          <button
            onClick={handleOpenCreate}
            className="bg-primary-600 hover:bg-primary-700 text-black px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <FiPlus />
            Tạo đơn hàng
          </button>
        </ProtectedAction>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Tổng đơn hàng</p>
              <p className="text-3xl font-bold mt-1">{orders.length}</p>
            </div>
            <FiShoppingCart className="text-4xl text-blue-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Hoàn thành</p>
              <p className="text-3xl font-bold mt-1">
                {orders.filter((o) => o.Status === 'Completed').length}
              </p>
            </div>
            <FiCheckCircle className="text-4xl text-green-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-100 text-sm">Chờ xử lý</p>
              <p className="text-3xl font-bold mt-1">
                {orders.filter((o) => o.Status === 'Pending').length}
              </p>
            </div>
            <FiClock className="text-4xl text-yellow-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Doanh thu</p>
              <p className="text-2xl font-bold mt-1">
                {formatCurrency(orders.reduce((sum, o) => sum + Number(o.TotalAmount), 0))}
              </p>
            </div>
            <FiDollarSign className="text-4xl text-purple-200" />
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Mã ĐH
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ngày tạo
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Khách hàng
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nhân viên
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Số SP
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tổng tiền
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Trạng thái
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {orders.length === 0 ? (
              <tr>
                <td colSpan="8" className="px-6 py-8 text-center text-gray-500">
                  Chưa có đơn hàng
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order.OrderID} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <FiFileText className="text-gray-400" />
                      <span className="font-medium text-gray-900">#{order.OrderID}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                    {formatDate(order.OrderDate)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <FiUser className="text-gray-400" />
                      <span className="text-gray-900">
                        {order.customer?.CustomerName || 'Khách vãng lai'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                    {order.user?.FullName || order.user?.Email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                      {order._count?.details || 0}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <span className="font-semibold text-green-600">
                      {formatCurrency(order.TotalAmount)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    {getStatusBadge(order.Status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <button
                      onClick={() => setSelectedOrderId(order.OrderID)}
                      className="text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1 mx-auto"
                    >
                      <FiEye />
                      Chi tiết
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create Order Modal */}
      {isCreateModalOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 p-4"
          onClick={() => setIsCreateModalOpen(false)}
        >
          <div
            className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b sticky top-0 bg-white z-10">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-800">Tạo đơn hàng mới</h2>
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FiX className="text-2xl" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmitCreate} className="p-6 space-y-6">
              {/* Customer Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Khách hàng (Để trống nếu khách vãng lai)
                </label>
                <div className="relative">
                  <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <select
                    value={selectedCustomer}
                    onChange={(e) => setSelectedCustomer(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">-- Khách vãng lai --</option>
                    {customers.map((customer) => (
                      <option key={customer.CustomerID} value={customer.CustomerID}>
                        {customer.CustomerName} - {customer.Phone}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Note */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ghi chú
                </label>
                <textarea
                  rows={2}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Ghi chú về đơn hàng..."
                />
              </div>

              {/* Items */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Danh sách sản phẩm <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="text-primary-600 hover:text-primary-700 text-sm flex items-center gap-1"
                  >
                    <FiPlus /> Thêm sản phẩm
                  </button>
                </div>

                <div className="space-y-3">
                  {items.map((item, index) => {
                    const selectedProduct = item.productId
                      ? products.find((p) => p.ProductID === parseInt(item.productId))
                      : null;

                    const availableUnits = selectedProduct
                      ? [
                          {
                            UnitName: selectedProduct.BaseUnit,
                            ExchangeValue: 1,
                            IsDefault: true,
                          },
                          ...(selectedProduct.units || []),
                        ]
                      : [];

                    return (
                      <div
                        key={index}
                        className="flex gap-2 items-start p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex-1 grid grid-cols-3 gap-2">
                          {/* Product */}
                          <select
                            required
                            value={item.productId}
                            onChange={(e) => handleItemChange(index, 'productId', e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                          >
                            <option value="">-- Chọn sản phẩm --</option>
                            {products.map((product) => (
                              <option key={product.ProductID} value={product.ProductID}>
                                {product.ProductName} ({product.SKU})
                              </option>
                            ))}
                          </select>

                          {/* Unit Name */}
                          <select
                            required
                            disabled={!item.productId}
                            value={item.unitName}
                            onChange={(e) => handleItemChange(index, 'unitName', e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100"
                          >
                            <option value="">-- Chọn đơn vị --</option>
                            {availableUnits.map((unit, idx) => (
                              <option key={idx} value={unit.UnitName}>
                                {unit.UnitName}{' '}
                                {unit.ExchangeValue > 1 &&
                                  `(1 = ${unit.ExchangeValue} ${selectedProduct.BaseUnit})`}
                              </option>
                            ))}
                          </select>

                          {/* Quantity */}
                          <input
                            type="number"
                            required
                            step="0.01"
                            min="0.01"
                            placeholder="Số lượng"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                          />
                        </div>

                        {/* Remove Button */}
                        {items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(index)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <FiX />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Total (estimated) */}
              <div className="border-t pt-4">
                <div className="flex justify-between items-center text-lg font-semibold">
                  <span>Tổng tiền (ước tính):</span>
                  <span className="text-primary-600">{formatCurrency(calculateTotal())}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  * Giá cuối cùng sẽ được tính dựa trên bảng giá và số lượng mua
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary-600 text-black rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Tạo đơn hàng
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedOrderId && (
        <OrderDetailModal
          orderId={selectedOrderId}
          onClose={() => setSelectedOrderId(null)}
        />
      )}
    </div>
  );
}

export default Orders;
