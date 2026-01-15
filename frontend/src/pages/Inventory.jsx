import { useState, useEffect } from 'react';
import { FiPlus, FiPackage, FiTruck, FiShoppingBag, FiX, FiAlertTriangle, FiFileText, FiEye } from 'react-icons/fi';
import inventoryService from '../services/inventoryService';
import suppliersService from '../services/suppliersService';
import { productsService } from '../services/productsService';
import ProductStockHistoryModal from '../components/inventory/ProductStockHistoryModal';
import StockReceiptDetailModal from '../components/inventory/StockReceiptDetailModal';
import ProtectedAction from '../components/ProtectedAction';

function Inventory() {
  const [activeTab, setActiveTab] = useState('inventory'); // 'inventory' | 'receipts'
  const [inventory, setInventory] = useState([]);
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isStockInModalOpen, setIsStockInModalOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [selectedReceiptId, setSelectedReceiptId] = useState(null);

  // Stock-In Form States
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [note, setNote] = useState('');
  const [items, setItems] = useState([{ productId: '', unitName: '', quantity: '', unitPrice: '' }]);

  // Load danh sách tồn kho
  const loadInventory = async () => {
    try {
      setLoading(true);
      const data = await inventoryService.getInventory();
      setInventory(data);
    } catch (err) {
      console.error('Error loading inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load danh sách phiếu nhập kho
  const loadReceipts = async () => {
    try {
      setLoading(true);
      const data = await inventoryService.getStockReceipts();
      setReceipts(data);
    } catch (err) {
      console.error('Error loading receipts:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load suppliers và products khi mở modal
  const loadFormData = async () => {
    try {
      const [suppliersData, productsData] = await Promise.all([
        suppliersService.getAll(),
        productsService.getAll(),
      ]);
      setSuppliers(suppliersData);
      setProducts(productsData.filter(p => p.IsActive)); // Chỉ lấy sản phẩm active
    } catch (err) {
      console.error('Error loading form data:', err);
    }
  };

  useEffect(() => {
    if (activeTab === 'inventory') {
      loadInventory();
    } else if (activeTab === 'receipts') {
      loadReceipts();
    }
  }, [activeTab]);

  // Mở modal nhập kho
  const handleOpenStockIn = async () => {
    await loadFormData();
    setSelectedSupplier('');
    setNote('');
    setItems([{ productId: '', unitName: '', quantity: '', unitPrice: '' }]);
    setIsStockInModalOpen(true);
  };

  // Thêm dòng item
  const handleAddItem = () => {
    setItems([...items, { productId: '', unitName: '', quantity: '', unitPrice: '' }]);
  };

  // Xóa dòng item
  const handleRemoveItem = (index) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  // Cập nhật item
  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;

    // Khi chọn product, tự động điền BaseUnit
    if (field === 'productId') {
      const product = products.find(p => p.ProductID === parseInt(value));
      if (product) {
        newItems[index].unitName = product.BaseUnit;
      }
    }

    setItems(newItems);
  };

  // Submit nhập kho
  const handleSubmitStockIn = async (e) => {
    e.preventDefault();

    // Validation
    if (!selectedSupplier) {
      alert('Vui lòng chọn nhà cung cấp');
      return;
    }

    const validItems = items.filter(
      item => item.productId && item.unitName && item.quantity && item.unitPrice
    );

    if (validItems.length === 0) {
      alert('Vui lòng thêm ít nhất 1 sản phẩm hợp lệ');
      return;
    }

    try {
      await inventoryService.stockIn({
        supplierId: parseInt(selectedSupplier),
        note,
        items: validItems.map(item => ({
          productId: parseInt(item.productId),
          unitName: item.unitName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
      });

      alert('Nhập kho thành công!');
      setIsStockInModalOpen(false);
      if (activeTab === 'inventory') {
        loadInventory();
      } else {
        loadReceipts();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra khi nhập kho');
      console.error('Error stock-in:', err);
    }
  };

  // Tính tổng tiền
  const calculateTotal = () => {
    return items.reduce((sum, item) => {
      const quantity = parseFloat(item.quantity) || 0;
      const price = parseFloat(item.unitPrice) || 0;
      return sum + (quantity * price);
    }, 0);
  };

  // Format currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(value);
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
          <h1 className="text-2xl font-bold text-gray-800">Quản lý Tồn kho</h1>
          <p className="text-gray-600 text-sm mt-1">Theo dõi tồn kho và nhập hàng</p>
        </div>
        <ProtectedAction action="create" subject="Inventory">
          <button
            onClick={handleOpenStockIn}
            className="bg-primary-600 hover:bg-primary-700 text-black px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <FiPlus />
            Nhập kho
          </button>
        </ProtectedAction>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('inventory')}
          className={`px-6 py-2.5 rounded-md font-medium transition-all flex items-center gap-2 ${
            activeTab === 'inventory'
              ? 'bg-white text-primary-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          <FiPackage />
          Danh sách tồn kho
        </button>
        <button
          onClick={() => setActiveTab('receipts')}
          className={`px-6 py-2.5 rounded-md font-medium transition-all flex items-center gap-2 ${
            activeTab === 'receipts'
              ? 'bg-white text-primary-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          <FiFileText />
          Phiếu nhập kho
        </button>
      </div>

      {/* Content based on active tab */}
      {activeTab === 'inventory' ? (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Tổng sản phẩm</p>
                  <p className="text-3xl font-bold mt-1">{inventory.length}</p>
                </div>
                <FiShoppingBag className="text-4xl text-blue-200" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm">Còn hàng</p>
                  <p className="text-3xl font-bold mt-1">
                    {inventory.filter(item => Number(item.Quantity) > 0).length}
                  </p>
                </div>
                <FiPackage className="text-4xl text-green-200" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm">Hết hàng</p>
                  <p className="text-3xl font-bold mt-1">
                    {inventory.filter(item => Number(item.Quantity) === 0).length}
                  </p>
                </div>
                <FiAlertTriangle className="text-4xl text-orange-200" />
              </div>
            </div>
          </div>

          {/* Inventory Table */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Sản phẩm
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Danh mục
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                SKU
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Đơn vị
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tồn kho
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Trạng thái
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {inventory.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                  Chưa có dữ liệu tồn kho
                </td>
              </tr>
            ) : (
              inventory.map((item) => {
                const quantity = Number(item.Quantity);
                const isOutOfStock = quantity === 0;

                return (
                  <tr 
                    key={item.InventoryID} 
                    onClick={() => setSelectedProductId(item.ProductID)}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">
                        {item.ProductName || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">
                        {item.Category.CategoryName || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                      {item.SKU || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                      {item.BaseUnit || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <span className={`font-semibold ${isOutOfStock ? 'text-red-600' : 'text-gray-900'}`}>
                        {quantity.toLocaleString('vi-VN')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {isOutOfStock ? (
                        <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                          Hết hàng
                        </span>
                      ) : (
                        <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          Còn hàng
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
        </>
      ) : (
        <>
          {/* Receipts Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm">Tổng phiếu nhập</p>
                  <p className="text-3xl font-bold mt-1">{receipts.length}</p>
                </div>
                <FiFileText className="text-4xl text-purple-200" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Tổng sản phẩm nhập</p>
                  <p className="text-3xl font-bold mt-1">
                    {receipts.reduce((sum, r) => sum + (r._count?.details || 0), 0)}
                  </p>
                </div>
                <FiPackage className="text-4xl text-blue-200" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm">Tổng giá trị</p>
                  <p className="text-3xl font-bold mt-1">
                    {formatCurrency(receipts.reduce((sum, r) => sum + Number(r.TotalAmount), 0))}
                  </p>
                </div>
                <FiTruck className="text-4xl text-green-200" />
              </div>
            </div>
          </div>

          {/* Receipts Table */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mã phiếu
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ngày nhập
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nhà cung cấp
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Số SP
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tổng tiền
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {receipts.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                      Chưa có phiếu nhập kho
                    </td>
                  </tr>
                ) : (
                  receipts.map((receipt) => (
                    <tr key={receipt.ReceiptID} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <FiFileText className="text-gray-400" />
                          <span className="font-medium text-gray-900">
                            #{receipt.ReceiptID}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                        {new Date(receipt.ImportDate).toLocaleDateString('vi-VN', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <FiTruck className="text-gray-400" />
                          <span className="text-gray-900">{receipt.supplier.SupplierName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                          {receipt._count?.details || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <span className="font-semibold text-green-600">
                          {formatCurrency(receipt.TotalAmount)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <button
                          onClick={() => setSelectedReceiptId(receipt.ReceiptID)}
                          className="text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1 mx-auto"
                        >
                          <FiEye />
                          Xem chi tiết
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Stock-In Modal */}
      {isStockInModalOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 p-4"
          onClick={() => setIsStockInModalOpen(false)}
        >
          <div
            className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b sticky top-0 bg-white z-10">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-800">Nhập kho (Stock-In)</h2>
                <button
                  onClick={() => setIsStockInModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FiX className="text-2xl" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmitStockIn} className="p-6 space-y-6">
              {/* Supplier Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nhà cung cấp <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <FiTruck className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <select
                    required
                    value={selectedSupplier}
                    onChange={(e) => setSelectedSupplier(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">-- Chọn nhà cung cấp --</option>
                    {suppliers.map((supplier) => (
                      <option key={supplier.SupplierID} value={supplier.SupplierID}>
                        {supplier.SupplierName}
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
                  placeholder="Ghi chú về phiếu nhập..."
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
                    // Tìm product được chọn để lấy danh sách units
                    const selectedProduct = item.productId 
                      ? products.find(p => p.ProductID === parseInt(item.productId))
                      : null;
                    
                    // Tạo danh sách units: BaseUnit + các ProductUnit
                    const availableUnits = selectedProduct 
                      ? [
                          { UnitName: selectedProduct.BaseUnit, ExchangeValue: 1, IsDefault: true },
                          ...(selectedProduct.units || [])
                        ]
                      : [];

                    return (
                      <div key={index} className="flex gap-2 items-start p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1 grid grid-cols-4 gap-2">
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

                          {/* Unit Name - Dropdown */}
                          <select
                            required
                            disabled={!item.productId}
                            value={item.unitName}
                            onChange={(e) => handleItemChange(index, 'unitName', e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                          >
                            <option value="">-- Chọn đơn vị --</option>
                            {availableUnits.map((unit, idx) => (
                              <option key={idx} value={unit.UnitName}>
                                {unit.UnitName} {unit.ExchangeValue > 1 && `(1 = ${unit.ExchangeValue} ${selectedProduct.BaseUnit})`}
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

                          {/* Unit Price */}
                          <input
                            type="number"
                            required
                            step="0.01"
                            min="0"
                            placeholder="Đơn giá"
                            value={item.unitPrice}
                            onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)}
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

              {/* Total */}
              <div className="border-t pt-4">
                <div className="flex justify-between items-center text-lg font-semibold">
                  <span>Tổng tiền:</span>
                  <span className="text-primary-600">{formatCurrency(calculateTotal())}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsStockInModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Xác nhận nhập kho
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Product Stock History Modal */}
      {selectedProductId && (
        <ProductStockHistoryModal
          productId={selectedProductId}
          onClose={() => setSelectedProductId(null)}
        />
      )}

      {/* Stock Receipt Detail Modal */}
      {selectedReceiptId && (
        <StockReceiptDetailModal
          receiptId={selectedReceiptId}
          onClose={() => setSelectedReceiptId(null)}
        />
      )}
    </div>
  );
}

export default Inventory;
