import { useState, useEffect } from 'react';
import { FiSave, FiInfo, FiUsers, FiShield } from 'react-icons/fi';
import { useForm } from 'react-hook-form';
import storesService from '../services/storesService';
import useAuthStore from '../store/authStore';

export default function StoreSettings() {
  const [store, setStore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { stores, currentStoreId } = useAuthStore();

  const { register, handleSubmit, setValue, formState: { errors } } = useForm();

  // Get current store info from authStore
  const currentStore = stores.find(s => s.storeId === parseInt(currentStoreId));

  // Load store details
  const loadStoreDetails = async () => {
    try {
      setLoading(true);
      const data = await storesService.getStoreDetails();
      setStore(data);
      
      // Populate form
      setValue('StoreName', data.StoreName);
      setValue('Subdomain', data.Subdomain);
      setValue('Phone', data.Phone || '');
      setValue('Address', data.Address || '');
    } catch (error) {
      console.error('Error loading store details:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStoreDetails();
  }, []);

  // Note: Backend không có API update store info yet
  // Sẽ cần thêm endpoint PUT /stores trong backend
  const onSubmit = async (data) => {
    setSaving(true);
    try {
      // TODO: Backend cần implement endpoint này
      // await storesService.updateStore(data);
      alert('Tính năng cập nhật thông tin store sẽ được bổ sung trong phiên bản tiếp theo');
    } catch (error) {
      alert(error.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Đang tải...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Cài đặt cửa hàng</h1>
        <p className="text-gray-500 mt-1">Quản lý thông tin cửa hàng của bạn</p>
      </div>

      {/* Store Info Card */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-primary-100 rounded-lg">
            <FiInfo className="text-primary-600 text-xl" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Thông tin cơ bản</h2>
            <p className="text-sm text-gray-500">Thông tin chung về cửa hàng</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Store Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tên cửa hàng <span className="text-red-500">*</span>
              </label>
              <input
                {...register('StoreName', { required: 'Tên cửa hàng là bắt buộc' })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Cửa hàng ABC"
              />
              {errors.StoreName && (
                <p className="mt-1 text-sm text-red-600">{errors.StoreName.message}</p>
              )}
            </div>

            {/* Subdomain */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subdomain <span className="text-red-500">*</span>
              </label>
              <input
                {...register('Subdomain', { required: 'Subdomain là bắt buộc' })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                placeholder="abc-store"
                disabled
                title="Subdomain không thể thay đổi"
              />
              <p className="mt-1 text-xs text-gray-500">Subdomain không thể thay đổi sau khi tạo</p>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Số điện thoại
              </label>
              <input
                {...register('Phone')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="0123456789"
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Trạng thái
              </label>
              <div className="flex items-center h-10">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  store?.Status === 'Active' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {store?.Status === 'Active' ? 'Đang hoạt động' : 'Tạm ngưng'}
                </span>
              </div>
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Địa chỉ
            </label>
            <textarea
              {...register('Address')}
              rows="3"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Nhập địa chỉ cửa hàng"
            />
          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FiSave />
              {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </div>
        </form>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Members Count */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <FiUsers className="text-blue-600 text-xl" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Tổng số thành viên</p>
              <p className="text-2xl font-bold text-gray-900">{store?._count?.storeUsers || 0}</p>
            </div>
          </div>
        </div>

        {/* Roles Count */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 rounded-lg">
              <FiShield className="text-purple-600 text-xl" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Số vai trò</p>
              <p className="text-2xl font-bold text-gray-900">{store?._count?.roles || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Info Note */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex gap-3">
          <FiInfo className="text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Lưu ý:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Subdomain không thể thay đổi sau khi tạo cửa hàng</li>
              <li>Để quản lý thành viên và phân quyền, vui lòng vào menu tương ứng</li>
              <li>Mọi thay đổi sẽ được áp dụng ngay lập tức</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
