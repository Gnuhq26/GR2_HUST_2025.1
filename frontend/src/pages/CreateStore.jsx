import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiHome, FiArrowLeft } from 'react-icons/fi';
import storesService from '../services/storesService';
import useAuthStore from '../store/authStore';

function CreateStore() {
  const navigate = useNavigate();
  const { refreshAuth } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    storeName: '',
    subdomain: '',
    phone: '',
    address: '',
  });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Auto-generate subdomain from store name
    if (name === 'storeName') {
      const autoSubdomain = value
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove Vietnamese accents
        .replace(/đ/g, 'd')
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
      
      setFormData(prev => ({
        ...prev,
        storeName: value,
        subdomain: autoSubdomain,
      }));
    } else if (name === 'subdomain') {
      // Validate subdomain format
      const cleanSubdomain = value.toLowerCase().replace(/[^a-z0-9-]/g, '');
      setFormData(prev => ({ ...prev, subdomain: cleanSubdomain }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.storeName.trim()) {
      newErrors.storeName = 'Tên cửa hàng không được để trống';
    }

    if (!formData.subdomain.trim()) {
      newErrors.subdomain = 'Subdomain không được để trống';
    } else if (!/^[a-z0-9-]+$/.test(formData.subdomain)) {
      newErrors.subdomain = 'Subdomain chỉ được chứa chữ thường, số và dấu gạch ngang';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      setLoading(true);
      await storesService.createStore(formData);
      
      // Refresh auth to get updated stores list
      await refreshAuth();
      
      alert('Tạo cửa hàng thành công!');
      navigate('/');
    } catch (error) {
      console.error('Error creating store:', error);
      if (error.response?.data?.message?.includes('subdomain')) {
        setErrors({ subdomain: 'Subdomain này đã được sử dụng' });
      } else {
        alert(error.response?.data?.message || 'Có lỗi xảy ra khi tạo cửa hàng');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center p-6">
      <div className="max-w-2xl w-full">
        {/* Back Button */}
        <button
          onClick={() => navigate('/no-store')}
          className="text-gray-600 hover:text-gray-800 font-medium flex items-center gap-2 mb-6 transition-colors"
        >
          <FiArrowLeft />
          Quay lại
        </button>

        {/* Form Card */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-primary-600 text-white p-3 rounded-lg">
              <FiHome className="text-2xl" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Tạo cửa hàng mới</h1>
              <p className="text-gray-600 text-sm">Điền thông tin cửa hàng của bạn</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Store Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tên cửa hàng <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="storeName"
                value={formData.storeName}
                onChange={handleChange}
                placeholder="Ví dụ: Cửa hàng ABC"
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  errors.storeName ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.storeName && (
                <p className="text-red-500 text-sm mt-1">{errors.storeName}</p>
              )}
            </div>

            {/* Subdomain */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subdomain <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="subdomain"
                value={formData.subdomain}
                onChange={handleChange}
                placeholder="vd: cua-hang-abc"
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  errors.subdomain ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.subdomain && (
                <p className="text-red-500 text-sm mt-1">{errors.subdomain}</p>
              )}
              <p className="text-gray-500 text-xs mt-1">
                Chỉ được chứa chữ thường (a-z), số (0-9) và dấu gạch ngang (-)
              </p>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Số điện thoại
              </label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="0123456789"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {/* Address */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Địa chỉ
              </label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="79 Cầu Giấy, Hà Nội"
                rows="3"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-600 hover:bg-primary-700 text-white py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <FiHome />
              {loading ? 'Đang tạo...' : 'Tạo cửa hàng'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default CreateStore;
