import { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiX, FiShield, FiUsers, FiKey, FiAlertCircle } from 'react-icons/fi';
import { useForm } from 'react-hook-form';
import rolesService from '../services/rolesService';
import permissionsService from '../services/permissionsService';

export default function Roles() {
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [groupedPermissions, setGroupedPermissions] = useState({});
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [selectedRoleForPermissions, setSelectedRoleForPermissions] = useState(null);
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const { register: registerCreate, handleSubmit: handleSubmitCreate, reset: resetCreate, formState: { errors: errorsCreate } } = useForm();
  const { register: registerEdit, handleSubmit: handleSubmitEdit, reset: resetEdit, setValue: setValueEdit, formState: { errors: errorsEdit } } = useForm();

  // Load roles
  const loadRoles = async () => {
    try {
      setLoading(true);
      const data = await rolesService.getAll();
      setRoles(data);
    } catch (error) {
      console.error('Error loading roles:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load permissions
  const loadPermissions = async () => {
    try {
      const [allPerms, grouped] = await Promise.all([
        permissionsService.getAll(),
        permissionsService.getGrouped(),
      ]);
      setPermissions(allPerms);
      setGroupedPermissions(grouped);
    } catch (error) {
      console.error('Error loading permissions:', error);
    }
  };

  useEffect(() => {
    loadRoles();
    loadPermissions();
  }, []);

  // Open create modal
  const handleOpenCreate = () => {
    resetCreate({});
    setShowCreateModal(true);
  };

  // Open edit modal
  const handleOpenEdit = (role) => {
    setEditingRole(role);
    setValueEdit('roleName', role.RoleName);
    setValueEdit('description', role.Description || '');
    setShowEditModal(true);
  };

  // Open permissions modal
  const handleOpenPermissions = async (role) => {
    setSelectedRoleForPermissions(role);
    
    // Get current permissions for this role
    const currentPermIds = role.rolePermissions.map(rp => rp.permission.PermissionID);
    setSelectedPermissions(currentPermIds);
    
    setShowPermissionsModal(true);
  };

  // Submit create role
  const onSubmitCreate = async (data) => {
    try {
      setSubmitting(true);
      await rolesService.create(data);
      setShowCreateModal(false);
      loadRoles();
      alert('Tạo vai trò thành công!');
    } catch (error) {
      alert(error.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setSubmitting(false);
    }
  };

  // Submit edit role
  const onSubmitEdit = async (data) => {
    try {
      setSubmitting(true);
      await rolesService.update(editingRole.RoleID, data);
      setShowEditModal(false);
      loadRoles();
      alert('Cập nhật vai trò thành công!');
    } catch (error) {
      alert(error.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete role
  const handleDeleteRole = async (role) => {
    if (!confirm(`Bạn có chắc muốn xóa vai trò "${role.RoleName}"?`)) {
      return;
    }

    try {
      await rolesService.delete(role.RoleID);
      loadRoles();
      alert('Đã xóa vai trò');
    } catch (error) {
      alert(error.response?.data?.message || 'Không thể xóa vai trò (có thành viên đang dùng)');
    }
  };

  // Toggle permission
  const togglePermission = (permId) => {
    setSelectedPermissions(prev => {
      if (prev.includes(permId)) {
        return prev.filter(id => id !== permId);
      } else {
        return [...prev, permId];
      }
    });
  };

  // Toggle all permissions in a subject
  const toggleSubject = (subject) => {
    const subjectPerms = groupedPermissions[subject] || [];
    const subjectPermIds = subjectPerms.map(p => p.PermissionID);
    const allSelected = subjectPermIds.every(id => selectedPermissions.includes(id));

    if (allSelected) {
      // Deselect all
      setSelectedPermissions(prev => prev.filter(id => !subjectPermIds.includes(id)));
    } else {
      // Select all
      setSelectedPermissions(prev => {
        const newSet = new Set([...prev, ...subjectPermIds]);
        return Array.from(newSet);
      });
    }
  };

  // Save permissions
  const handleSavePermissions = async () => {
    try {
      setSubmitting(true);
      await rolesService.assignPermissions(
        selectedRoleForPermissions.RoleID,
        selectedPermissions
      );
      setShowPermissionsModal(false);
      loadRoles();
      alert('Cập nhật quyền thành công!');
    } catch (error) {
      alert(error.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setSubmitting(false);
    }
  };

  // Get permission badge color
  const getActionColor = (action) => {
    const colors = {
      manage: 'bg-purple-100 text-purple-800',
      create: 'bg-green-100 text-green-800',
      read: 'bg-blue-100 text-blue-800',
      update: 'bg-yellow-100 text-yellow-800',
      delete: 'bg-red-100 text-red-800',
    };
    return colors[action] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quản lý vai trò</h1>
          <p className="text-gray-500 mt-1">Tạo và quản lý vai trò trong cửa hàng</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <FiPlus />
          Tạo vai trò mới
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 rounded-lg">
              <FiShield className="text-purple-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Tổng vai trò</p>
              <p className="text-2xl font-bold text-gray-900">{roles.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <FiKey className="text-blue-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Tổng quyền hạn</p>
              <p className="text-2xl font-bold text-gray-900">{permissions.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <FiUsers className="text-green-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Thành viên có vai trò</p>
              <p className="text-2xl font-bold text-gray-900">
                {roles.reduce((sum, role) => sum + role._count.storeUsers, 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Roles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full text-center py-12 text-gray-500">
            Đang tải...
          </div>
        ) : roles.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500">
            Chưa có vai trò nào
          </div>
        ) : (
          roles.map((role) => (
            <div key={role.RoleID} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
              {/* Role Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary-100 rounded-lg">
                    <FiShield className="text-primary-600" size={20} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{role.RoleName}</h3>
                    <p className="text-sm text-gray-500">{role.Description || 'Không có mô tả'}</p>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-4 mb-4 text-sm">
                <div className="flex items-center gap-1 text-gray-600">
                  <FiUsers size={16} />
                  <span>{role._count.storeUsers} thành viên</span>
                </div>
                <div className="flex items-center gap-1 text-gray-600">
                  <FiKey size={16} />
                  <span>{role.rolePermissions.length} quyền</span>
                </div>
              </div>

              {/* Permissions Preview */}
              <div className="mb-4">
                <p className="text-xs font-medium text-gray-500 mb-2">QUYỀN HẠN:</p>
                <div className="flex flex-wrap gap-1">
                  {role.rolePermissions.length === 0 ? (
                    <span className="text-xs text-gray-400">Chưa có quyền</span>
                  ) : (
                    role.rolePermissions.slice(0, 3).map((rp) => (
                      <span
                        key={rp.permission.PermissionID}
                        className={`px-2 py-1 text-xs rounded ${getActionColor(rp.permission.Action)}`}
                      >
                        {rp.permission.Action}:{rp.permission.Subject}
                      </span>
                    ))
                  )}
                  {role.rolePermissions.length > 3 && (
                    <span className="px-2 py-1 text-xs rounded bg-gray-100 text-gray-600">
                      +{role.rolePermissions.length - 3} thêm
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => handleOpenPermissions(role)}
                  className="flex-1 px-3 py-2 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <FiKey className="inline mr-1" />
                  Phân quyền
                </button>
                <button
                  onClick={() => handleOpenEdit(role)}
                  className="px-3 py-2 text-sm bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <FiEdit2 />
                </button>
                <button
                  onClick={() => handleDeleteRole(role)}
                  className="px-3 py-2 text-sm bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors"
                  disabled={role._count.storeUsers > 0}
                  title={role._count.storeUsers > 0 ? 'Không thể xóa vai trò đang có thành viên' : 'Xóa vai trò'}
                >
                  <FiTrash2 />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Tạo vai trò mới</h2>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600">
                <FiX size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmitCreate(onSubmitCreate)} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tên vai trò <span className="text-red-500">*</span>
                </label>
                <input
                  {...registerCreate('roleName', { required: 'Tên vai trò là bắt buộc' })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Kế toán kho"
                />
                {errorsCreate.roleName && (
                  <p className="mt-1 text-sm text-red-600">{errorsCreate.roleName.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mô tả
                </label>
                <textarea
                  {...registerCreate('description')}
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Quản lý kho hàng và báo cáo tài chính"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Đang tạo...' : 'Tạo vai trò'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingRole && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Chỉnh sửa vai trò</h2>
              <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600">
                <FiX size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmitEdit(onSubmitEdit)} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tên vai trò <span className="text-red-500">*</span>
                </label>
                <input
                  {...registerEdit('roleName', { required: 'Tên vai trò là bắt buộc' })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Kế toán kho"
                />
                {errorsEdit.roleName && (
                  <p className="mt-1 text-sm text-red-600">{errorsEdit.roleName.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mô tả
                </label>
                <textarea
                  {...registerEdit('description')}
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Quản lý kho hàng và báo cáo tài chính"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Đang cập nhật...' : 'Cập nhật'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Permissions Modal */}
      {showPermissionsModal && selectedRoleForPermissions && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Phân quyền cho vai trò</h2>
                <p className="text-sm text-gray-500 mt-1">
                  {selectedRoleForPermissions.RoleName} - {selectedPermissions.length} quyền đã chọn
                </p>
              </div>
              <button onClick={() => setShowPermissionsModal(false)} className="text-gray-400 hover:text-gray-600">
                <FiX size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {/* Info Alert */}
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex gap-2">
                <FiAlertCircle className="text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800">
                  Chọn các quyền mà vai trò này sẽ được phép thực hiện. Click vào tiêu đề để chọn/bỏ chọn tất cả quyền trong nhóm.
                </div>
              </div>

              {/* Permissions by Subject */}
              <div className="space-y-4">
                {Object.keys(groupedPermissions).sort().map((subject) => {
                  const perms = groupedPermissions[subject];
                  const allSelected = perms.every(p => selectedPermissions.includes(p.PermissionID));
                  const someSelected = perms.some(p => selectedPermissions.includes(p.PermissionID));

                  return (
                    <div key={subject} className="border border-gray-200 rounded-lg overflow-hidden">
                      <button
                        type="button"
                        onClick={() => toggleSubject(subject)}
                        className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between"
                      >
                        <span className="font-semibold text-gray-900">{subject}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-500">
                            {perms.filter(p => selectedPermissions.includes(p.PermissionID)).length} / {perms.length}
                          </span>
                          <div className={`w-5 h-5 border-2 rounded ${
                            allSelected 
                              ? 'bg-primary-600 border-primary-600' 
                              : someSelected 
                              ? 'bg-primary-200 border-primary-600' 
                              : 'border-gray-300'
                          }`}>
                            {allSelected && (
                              <svg className="w-full h-full text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                            {someSelected && !allSelected && (
                              <div className="w-full h-full flex items-center justify-center">
                                <div className="w-2 h-2 bg-primary-600 rounded-sm"></div>
                              </div>
                            )}
                          </div>
                        </div>
                      </button>
                      <div className="p-4 grid grid-cols-2 gap-2">
                        {perms.map((perm) => (
                          <label
                            key={perm.PermissionID}
                            className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={selectedPermissions.includes(perm.PermissionID)}
                              onChange={() => togglePermission(perm.PermissionID)}
                              className="w-4 h-4 text-primary-600 rounded focus:ring-2 focus:ring-primary-500"
                            />
                            <span className={`text-sm px-2 py-1 rounded ${getActionColor(perm.Action)}`}>
                              {perm.Action}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowPermissionsModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleSavePermissions}
                disabled={submitting}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
              >
                {submitting ? 'Đang lưu...' : 'Lưu quyền hạn'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
