import { useState, useEffect } from 'react';
import { FiEdit2, FiTrash2, FiPlus, FiTruck, FiPhone, FiMapPin, FiSearch, FiPackage } from 'react-icons/fi';
import suppliersService from '../services/suppliersService';

function Suppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentSupplier, setCurrentSupplier] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    SupplierName: '',
    Phone: '',
    Address: '',
  });

  // Stats
  const stats = {
    total: suppliers.length,
    withReceipts: suppliers.filter((s) => s._count?.receipts > 0).length,
    withPhone: suppliers.filter((s) => s.Phone).length,
  };

  // Load danh sách nhà cung cấp
  const loadSuppliers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await suppliersService.getAll(searchQuery);
      setSuppliers(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể tải danh sách nhà cung cấp');
      console.error('Error loading suppliers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSuppliers();
  }, [searchQuery]);

  // Xử lý search
  const handleSearch = (e) => {
    e.preventDefault();
    loadSuppliers();
  };

  // Mở modal tạo mới
  const handleCreate = () => {
    setIsEditing(false);
    setCurrentSupplier(null);
    setFormData({
      SupplierName: '',
      Phone: '',
      Address: '',
    });
    setIsModalOpen(true);
  };

  // Mở modal chỉnh sửa
  const handleEdit = (supplier) => {
    setIsEditing(true);
    setCurrentSupplier(supplier);
    setFormData({
      SupplierName: supplier.SupplierName,
      Phone: supplier.Phone || '',
      Address: supplier.Address || '',
    });
    setIsModalOpen(true);
  };

  // Xử lý submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await suppliersService.update(currentSupplier.SupplierID, formData);
      } else {
        await suppliersService.create(formData);
      }
      setIsModalOpen(false);
      loadSuppliers();
    } catch (err) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra');
      console.error('Error saving supplier:', err);
    }
  };

  // Xử lý xóa
  const handleDelete = async (supplier) => {
    if (!confirm(`Bạn có chắc muốn xóa nhà cung cấp "${supplier.SupplierName}"?`)) {
      return;
    }
    try {
      await suppliersService.delete(supplier.SupplierID);
      loadSuppliers();
    } catch (err) {
      alert(err.response?.data?.message || 'Không thể xóa nhà cung cấp');
      console.error('Error deleting supplier:', err);
    }
  };

  if (loading && suppliers.length === 0) {
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
          <h1 className="text-2xl font-bold text-gray-800">Quản lý Nhà cung cấp</h1>
          <p className="text-gray-600 text-sm mt-1">Quản lý thông tin nhà cung cấp hàng hóa</p>
        </div>
        <button
          onClick={handleCreate}
          className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <FiPlus />
          Thêm nhà cung cấp
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Tổng số nhà cung cấp</p>
              <p className="text-3xl font-bold mt-1">{stats.total}</p>
            </div>
            <FiTruck className="text-4xl text-blue-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Có phiếu nhập</p>
              <p className="text-3xl font-bold mt-1">{stats.withReceipts}</p>
            </div>
            <FiPackage className="text-4xl text-green-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Có số điện thoại</p>
              <p className="text-3xl font-bold mt-1">{stats.withPhone}</p>
            </div>
            <FiPhone className="text-4xl text-purple-200" />
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="flex-1 relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên hoặc số điện thoại..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <button
            type="submit"
            className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Tìm kiếm
          </button>
        </form>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tên nhà cung cấp
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Số điện thoại
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Địa chỉ
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Số phiếu nhập
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {suppliers.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                  Không có nhà cung cấp nào
                </td>
              </tr>
            ) : (
              suppliers.map((supplier) => (
                <tr key={supplier.SupplierID} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <FiTruck className="text-gray-400" />
                      <span className="font-medium text-gray-900">{supplier.SupplierName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2 text-gray-700">
                      <FiPhone className="text-gray-400" />
                      {supplier.Phone || <span className="text-gray-400 italic">Chưa có</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-start gap-2 text-gray-700">
                      <FiMapPin className="text-gray-400 mt-0.5 flex-shrink-0" />
                      <span className="line-clamp-2">
                        {supplier.Address || <span className="text-gray-400 italic">Chưa có</span>}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <FiPackage className="text-gray-400" />
                      <span className="text-gray-700">{supplier._count?.receipts || 0}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleEdit(supplier)}
                      className="text-primary-600 hover:text-primary-900 mr-4 inline-flex items-center gap-1"
                    >
                      <FiEdit2 /> Sửa
                    </button>
                    <button
                      onClick={() => handleDelete(supplier)}
                      className="text-red-600 hover:text-red-900 inline-flex items-center gap-1"
                    >
                      <FiTrash2 /> Xóa
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Form */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 p-4"
          onClick={() => setIsModalOpen(false)}
        >
          <div 
            className="bg-white rounded-lg shadow-xl w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold text-gray-800">
                {isEditing ? 'Chỉnh sửa nhà cung cấp' : 'Thêm nhà cung cấp mới'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tên nhà cung cấp <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={255}
                  value={formData.SupplierName}
                  onChange={(e) => setFormData({ ...formData, SupplierName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Nhập tên nhà cung cấp"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Số điện thoại
                </label>
                <input
                  type="text"
                  maxLength={20}
                  value={formData.Phone}
                  onChange={(e) => setFormData({ ...formData, Phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Nhập số điện thoại"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Địa chỉ
                </label>
                <textarea
                  rows={3}
                  value={formData.Address}
                  onChange={(e) => setFormData({ ...formData, Address: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Nhập địa chỉ nhà cung cấp"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  {isEditing ? 'Cập nhật' : 'Tạo mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Suppliers;
