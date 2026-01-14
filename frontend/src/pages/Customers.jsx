import { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiX, FiUser, FiPhone, FiMapPin, FiShoppingCart } from 'react-icons/fi';
import { useForm } from 'react-hook-form';
import { customersService } from '../services/customersService';
import CustomerDetailModal from '../components/customer/CustomerDetailModal';

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm();

  // Load customers
  const loadCustomers = async () => {
    setLoading(true);
    try {
      const data = await customersService.getAll();
      setCustomers(data);
    } catch (error) {
      console.error('Lỗi tải khách hàng:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  // Open modal for create
  const handleCreate = () => {
    setEditingCustomer(null);
    reset({});
    setShowModal(true);
  };

  // Open modal for edit
  const handleEdit = (customer) => {
    setEditingCustomer(customer);
    setValue('CustomerName', customer.CustomerName);
    setValue('Phone', customer.Phone);
    setValue('Address', customer.Address);
    setShowModal(true);
  };

  // Submit form
  const onSubmit = async (data) => {
    try {
      if (editingCustomer) {
        await customersService.update(editingCustomer.CustomerID, data);
      } else {
        await customersService.create(data);
      }
      setShowModal(false);
      loadCustomers();
    } catch (error) {
      console.error('Lỗi:', error);
      alert(error.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  // Delete customer
  const handleDelete = async (id, customerName) => {
    if (!confirm(`Bạn có chắc muốn xóa khách hàng "${customerName}"?`)) return;
    
    try {
      await customersService.delete(id);
      loadCustomers();
    } catch (error) {
      console.error('Lỗi xóa:', error);
      alert(error.response?.data?.message || 'Không thể xóa khách hàng (có thể đã có đơn hàng)');
    }
  };

  return (
    <div className="max-w-7xl">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Khách hàng</h1>
          <p className="text-gray-500 mt-1">Quản lý thông tin khách hàng</p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-black rounded-lg hover:bg-blue-600 transition-colors"
        >
          <FiPlus />
          Thêm khách hàng
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary-100 rounded-lg">
              <FiUser className="text-primary-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Tổng khách hàng</p>
              <p className="text-2xl font-bold text-gray-900">{customers.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tên khách hàng</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Số điện thoại</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Địa chỉ</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Đơn hàng</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                    Đang tải...
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                    Chưa có khách hàng nào
                  </td>
                </tr>
              ) : (
                customers.map((customer) => (
                  <tr 
                    key={customer.CustomerID} 
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={(e) => {
                      // Không mở detail modal khi click vào button
                      if (!e.target.closest('button')) {
                        setSelectedCustomerId(customer.CustomerID);
                      }
                    }}
                  >
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      <div className="flex items-center gap-2">
                        <FiUser className="text-gray-400" />
                        {customer.CustomerName}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {customer.Phone ? (
                        <div className="flex items-center gap-2">
                          <FiPhone className="text-gray-400" size={14} />
                          {customer.Phone}
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                      {customer.Address ? (
                        <div className="flex items-center gap-2">
                          <FiMapPin className="text-gray-400 flex-shrink-0" size={14} />
                          <span className="truncate">{customer.Address}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center text-sm">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                        customer._count?.orders > 0 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-gray-100 text-gray-500'
                      }`}>
                        <FiShoppingCart size={12} />
                        {customer._count?.orders || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-sm">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(customer);
                        }}
                        className="text-primary-600 hover:text-primary-700 mr-3"
                        title="Chỉnh sửa"
                      >
                        <FiEdit2 />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(customer.CustomerID, customer.CustomerName);
                        }}
                        className="text-red-600 hover:text-red-700"
                        title="Xóa"
                      >
                        <FiTrash2 />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-xl w-full">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                {editingCustomer ? 'Cập nhật khách hàng' : 'Thêm khách hàng mới'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <FiX size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tên khách hàng <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('CustomerName', { 
                    required: 'Tên khách hàng là bắt buộc',
                    maxLength: { value: 100, message: 'Tên khách hàng không được quá 100 ký tự' }
                  })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Nhập tên khách hàng"
                />
                {errors.CustomerName && (
                  <p className="mt-1 text-sm text-red-600">{errors.CustomerName.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
                <input
                  {...register('Phone', {
                    maxLength: { value: 20, message: 'Số điện thoại không được quá 20 ký tự' }
                  })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="0912345678"
                />
                {errors.Phone && (
                  <p className="mt-1 text-sm text-red-600">{errors.Phone.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ</label>
                <textarea
                  {...register('Address', {
                    maxLength: { value: 255, message: 'Địa chỉ không được quá 255 ký tự' }
                  })}
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Nhập địa chỉ khách hàng"
                />
                {errors.Address && (
                  <p className="mt-1 text-sm text-red-600">{errors.Address.message}</p>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  {editingCustomer ? 'Cập nhật' : 'Thêm mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer Detail Modal */}
      {selectedCustomerId && (
        <CustomerDetailModal
          customerId={selectedCustomerId}
          onClose={() => setSelectedCustomerId(null)}
        />
      )}
    </div>
  );
}
