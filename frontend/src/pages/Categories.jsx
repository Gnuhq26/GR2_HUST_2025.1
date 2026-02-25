import { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiX, FiSearch, FiPackage } from 'react-icons/fi';
import { useForm } from 'react-hook-form';
import { categoriesService } from '../services/categoriesService';
import ProtectedAction from '../components/ProtectedAction';

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm();

  // Load categories
  const loadCategories = async (search = '') => {
    setLoading(true);
    try {
      const data = await categoriesService.getAll(search);
      setCategories(data);
    } catch (error) {
      console.error('Lỗi tải danh mục:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  // Search handler
  const handleSearch = (e) => {
    e.preventDefault();
    loadCategories(searchTerm);
  };

  // Open modal for create
  const handleCreate = () => {
    setEditingCategory(null);
    reset({});
    setShowModal(true);
  };

  // Open modal for edit
  const handleEdit = (category) => {
    setEditingCategory(category);
    setValue('CategoryName', category.CategoryName);
    setValue('Description', category.Description);
    setShowModal(true);
  };

  // Submit form
  const onSubmit = async (data) => {
    try {
      if (editingCategory) {
        await categoriesService.update(editingCategory.CategoryID, data);
      } else {
        await categoriesService.create(data);
      }
      setShowModal(false);
      loadCategories(searchTerm);
    } catch (error) {
      console.error('Lỗi:', error);
      alert(error.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  // Delete category
  const handleDelete = async (id, categoryName) => {
    if (!confirm(`Bạn có chắc muốn xóa danh mục "${categoryName}"?`)) return;
    
    try {
      await categoriesService.delete(id);
      loadCategories(searchTerm);
    } catch (error) {
      console.error('Lỗi xóa:', error);
      alert(error.response?.data?.message || 'Không thể xóa danh mục (có thể đang có sản phẩm)');
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Danh mục</h1>
          <p className="text-gray-500 mt-1">Quản lý danh mục sản phẩm</p>
        </div>
        <ProtectedAction action="create" subject="Category">
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-black rounded-lg hover:bg-primary-700 transition-colors"
          >
            <FiPlus />
            Thêm danh mục
          </button>
        </ProtectedAction>
      </div>

      {/* Search Bar */}
      <div className="mb-4">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1 max-w-md">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm danh mục..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Tìm kiếm
          </button>
          {searchTerm && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                loadCategories();
              }}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Xóa lọc
            </button>
          )}
        </form>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tên danh mục</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mô tả</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Số sản phẩm</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                    Đang tải...
                  </td>
                </tr>
              ) : categories.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                    {searchTerm ? 'Không tìm thấy danh mục nào' : 'Chưa có danh mục nào'}
                  </td>
                </tr>
              ) : (
                categories.map((category) => (
                  <tr key={category.CategoryID} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {category.CategoryName}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {category.Description || '-'}
                    </td>
                    <td className="px-6 py-4 text-center text-sm text-gray-700">
                      <div className="flex items-center justify-center gap-1">
                        <FiPackage className="text-gray-400" size={14} />
                        {category._count?.products || 0}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right text-sm">
                      <ProtectedAction action="update" subject="Category">
                        <button
                          onClick={() => handleEdit(category)}
                          className="text-primary-600 hover:text-primary-700 mr-3"
                          title="Chỉnh sửa"
                        >
                          <FiEdit2 />
                        </button>
                      </ProtectedAction>
                      <ProtectedAction action="delete" subject="Category">
                        <button
                          onClick={() => handleDelete(category.CategoryID, category.CategoryName)}
                          className="text-red-600 hover:text-red-700"
                          title="Xóa"
                        >
                          <FiTrash2 />
                        </button>
                      </ProtectedAction>
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
                {editingCategory ? 'Cập nhật danh mục' : 'Thêm danh mục mới'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <FiX size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tên danh mục <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('CategoryName', { 
                    required: 'Tên danh mục là bắt buộc',
                    minLength: { value: 1, message: 'Tên danh mục quá ngắn' },
                    maxLength: { value: 255, message: 'Tên danh mục quá dài' }
                  })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Nhập tên danh mục"
                />
                {errors.CategoryName && (
                  <p className="mt-1 text-sm text-red-600">{errors.CategoryName.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
                <textarea
                  {...register('Description')}
                  rows="4"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Nhập mô tả danh mục (không bắt buộc)"
                />
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
                  className="flex-1 px-4 py-2 bg-primary-600 text-black rounded-lg hover:bg-primary-700 transition-colors"
                >
                  {editingCategory ? 'Cập nhật' : 'Thêm mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
