import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiHome, FiUsers, FiMapPin } from 'react-icons/fi';
import useAuthStore from '../store/authStore';

function SelectStore() {
  const navigate = useNavigate();
  const { stores, setCurrentStore } = useAuthStore();

  const handleSelectStore = (store) => {
    setCurrentStore(store);
    navigate('/');
  };

  const handleCreateNewStore = () => {
    navigate('/create-store');
  };

  useEffect(() => {
    // If user has no stores, redirect to no-store page
    if (stores.length === 0) {
      navigate('/no-store', { replace: true });
    }
    // If user has only one store, auto-select it
    else if (stores.length === 1) {
      handleSelectStore(stores[0]);
    }
  }, [stores.length, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center p-6">
      <div className="max-w-4xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-primary-600 text-white p-4 rounded-full">
              <FiHome className="text-4xl" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Chọn cửa hàng để làm việc
          </h1>
          <p className="text-gray-600">
            Bạn thuộc {stores.length} cửa hàng. Chọn cửa hàng bạn muốn quản lý.
          </p>
        </div>

        {/* Stores Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          {stores.map((store) => (
            <div
              key={store.storeId}
              onClick={() => handleSelectStore(store)}
              className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl hover:scale-105 transition-all cursor-pointer border-2 border-transparent hover:border-primary-500"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="bg-primary-100 text-primary-600 p-3 rounded-lg">
                  <FiHome className="text-2xl" />
                </div>
                <span className="bg-primary-100 text-primary-600 text-xs font-medium px-2 py-1 rounded">
                  {store.roleName}
                </span>
              </div>
              
              <h3 className="text-lg font-bold text-gray-800 mb-2">
                {store.storeName}
              </h3>
              
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <FiMapPin className="text-gray-400" />
                  <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                    {store.subdomain}
                  </span>
                </div>
              </div>

              <button className="w-full mt-4 bg-primary-600 hover:bg-primary-700 text-white py-2 rounded-lg font-medium transition-colors">
                Chọn cửa hàng này
              </button>
            </div>
          ))}

          {/* Create New Store Card */}
          <div
            onClick={handleCreateNewStore}
            className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl hover:scale-105 transition-all cursor-pointer border-2 border-dashed border-gray-300 hover:border-green-500 flex flex-col items-center justify-center"
          >
            <div className="bg-green-100 text-green-600 p-4 rounded-full mb-4">
              <FiHome className="text-3xl" />
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">
              Tạo cửa hàng mới
            </h3>
            <p className="text-sm text-gray-600 text-center mb-4">
              Mở rộng kinh doanh của bạn
            </p>
            <button className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors">
              + Tạo mới
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SelectStore;
