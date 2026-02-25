import { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiX } from 'react-icons/fi';
import { useForm } from 'react-hook-form';
import { productsService } from '../services/productsService';
import ProtectedAction from '../components/ProtectedAction';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm();

  // Load products
  const loadProducts = async () => {
    setLoading(true);
    try {
      const data = await productsService.getAll();
      setProducts(data);
    } catch (error) {
      console.error('Lỗi tải sản phẩm:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  // Open modal for create
  const handleCreate = () => {
    setEditingProduct(null);
    reset({});
    setShowModal(true);
  };

  // Open modal for edit
  const handleEdit = (product) => {
    setEditingProduct(product);
    setValue('ProductName', product.ProductName);
    setValue('Description', product.Description);
    setValue('SKU', product.SKU);
    setValue('BaseUnit', product.BaseUnit);
    setValue('CategoryID', product.CategoryID);
    setValue('IsActive', product.IsActive);
    setShowModal(true);
  };

  // Submit form
  const onSubmit = async (data) => {
    try {
      if (editingProduct) {
        await productsService.update(editingProduct.ProductID, data);
      } else {
        await productsService.create(data);
      }
      setShowModal(false);
      loadProducts();
    } catch (error) {
      console.error('Lỗi:', error);
      alert(error.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  // Delete product
  const handleDelete = async (id) => {
    if (!confirm('Bạn có chắc muốn xóa sản phẩm này?')) return;
    
    try {
      await productsService.delete(id);
      loadProducts();
    } catch (error) {
      console.error('Lỗi xóa:', error);
      alert(error.response?.data?.message || 'Không thể xóa sản phẩm');
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sản phẩm</h1>
          <p className="text-gray-500 mt-1">Quản lý danh sách sản phẩm</p>
        </div>
        <ProtectedAction action="create" subject="Product">
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-black rounded-lg hover:bg-primary-700 transition-colors"
          >
            <FiPlus />
            Thêm sản phẩm
          </button>
        </ProtectedAction>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mã SKU</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tên sản phẩm</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Đơn vị</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
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
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                    Chưa có sản phẩm nào
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product.ProductID} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{product.SKU}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{product.ProductName}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{product.BaseUnit}</td>
                    <td className="px-6 py-4 text-center text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs ${product.IsActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                        {product.IsActive ? 'Hoạt động' : 'Ngưng'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-sm">
                      <ProtectedAction action="update" subject="Product">
                        <button
                          onClick={() => handleEdit(product)}
                          className="text-primary-600 hover:text-primary-700 mr-3"
                        >
                          <FiEdit2 />
                        </button>
                      </ProtectedAction>
                      <ProtectedAction action="delete" subject="Product">
                        <button
                          onClick={() => handleDelete(product.ProductID)}
                          className="text-red-600 hover:text-red-700"
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
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                {editingProduct ? 'Cập nhật sản phẩm' : 'Thêm sản phẩm mới'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <FiX size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tên sản phẩm <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('ProductName', { required: 'Tên sản phẩm là bắt buộc' })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Nhập tên sản phẩm"
                />
                {errors.ProductName && <p className="mt-1 text-sm text-red-600">{errors.ProductName.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
                <textarea
                  {...register('Description')}
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Nhập mô tả sản phẩm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mã SKU <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register('SKU', { required: 'Mã SKU là bắt buộc' })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="SKU-001"
                  />
                  {errors.SKU && <p className="mt-1 text-sm text-red-600">{errors.SKU.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Đơn vị gốc <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register('BaseUnit', { required: 'Đơn vị gốc là bắt buộc' })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Viên, Kg, Bao..."
                  />
                  {errors.BaseUnit && <p className="mt-1 text-sm text-red-600">{errors.BaseUnit.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ID Danh mục</label>
                  <input
                    type="number"
                    {...register('CategoryID')}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
                  <select
                    {...register('IsActive')}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="true">Hoạt động</option>
                    <option value="false">Ngưng hoạt động</option>
                  </select>
                </div>
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
                  {editingProduct ? 'Cập nhật' : 'Thêm mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
