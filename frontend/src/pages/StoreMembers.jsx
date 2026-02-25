import { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiX, FiUsers, FiMail, FiShield, FiAlertCircle, FiUserPlus } from 'react-icons/fi';
import { useForm } from 'react-hook-form';
import storesService from '../services/storesService';
import rolesService from '../services/rolesService';

export default function StoreMembers() {
  const [members, setMembers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const { register: registerAdd, handleSubmit: handleSubmitAdd, reset: resetAdd, formState: { errors: errorsAdd } } = useForm();
  const { register: registerEdit, handleSubmit: handleSubmitEdit, reset: resetEdit, setValue: setValueEdit, formState: { errors: errorsEdit } } = useForm();

  // Load members
  const loadMembers = async () => {
    try {
      setLoading(true);
      const data = await storesService.getMembers();
      setMembers(data);
    } catch (error) {
      console.error('Error loading members:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load roles
  const loadRoles = async () => {
    try {
      const data = await rolesService.getAll();
      setRoles(data);
    } catch (error) {
      console.error('Error loading roles:', error);
    }
  };

  useEffect(() => {
    loadMembers();
    loadRoles();
  }, []);

  // Open add modal
  const handleOpenAdd = () => {
    resetAdd({});
    setShowAddModal(true);
  };

  // Open edit modal
  const handleOpenEdit = (member) => {
    setEditingMember(member);
    setValueEdit('roleId', member.role.RoleID);
    setShowEditModal(true);
  };

  // Submit add member
  const onSubmitAdd = async (data) => {
    try {
      setSubmitting(true);
      await storesService.addMember({
        email: data.email,
        roleId: parseInt(data.roleId),
      });
      setShowAddModal(false);
      loadMembers();
      alert('Thêm thành viên thành công!');
    } catch (error) {
      alert(error.response?.data?.message || 'Có lỗi xảy ra khi thêm thành viên');
    } finally {
      setSubmitting(false);
    }
  };

  // Submit edit member role
  const onSubmitEdit = async (data) => {
    try {
      setSubmitting(true);
      await storesService.updateMemberRole(
        editingMember.userId,
        parseInt(data.roleId)
      );
      setShowEditModal(false);
      loadMembers();
      alert('Cập nhật vai trò thành công!');
    } catch (error) {
      alert(error.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setSubmitting(false);
    }
  };

  // Remove member
  const handleRemoveMember = async (member) => {
    if (!confirm(`Bạn có chắc muốn xóa thành viên "${member.user.Email}" khỏi cửa hàng?`)) {
      return;
    }

    try {
      await storesService.removeMember(member.userId);
      loadMembers();
      alert('Đã xóa thành viên khỏi cửa hàng');
    } catch (error) {
      alert(error.response?.data?.message || 'Không thể xóa thành viên');
    }
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

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Thành viên cửa hàng</h1>
          <p className="text-gray-500 mt-1">Quản lý thành viên và phân quyền</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-black rounded-lg hover:bg-primary-700 transition-colors"
        >
          <FiPlus />
          Thêm thành viên
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <FiUsers className="text-blue-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Tổng thành viên</p>
              <p className="text-2xl font-bold text-gray-900">{members.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 rounded-lg">
              <FiShield className="text-purple-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Số vai trò</p>
              <p className="text-2xl font-bold text-gray-900">{roles.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <FiUserPlus className="text-green-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Thành viên mới</p>
              <p className="text-2xl font-bold text-gray-900">
                {members.filter(m => {
                  const joinDate = new Date(m.joinedAt);
                  const sevenDaysAgo = new Date();
                  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                  return joinDate >= sevenDaysAgo;
                }).length}
              </p>
              <p className="text-xs text-gray-500">Trong 7 ngày qua</p>
            </div>
          </div>
        </div>
      </div>

      {/* Members Table */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thành viên</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Liên hệ</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vai trò</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tham gia</th>
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
              ) : members.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                    Chưa có thành viên nào
                  </td>
                </tr>
              ) : (
                members.map((member) => (
                  <tr key={member.userId} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                          <span className="text-primary-600 font-semibold">
                            {member.user.FullName?.[0]?.toUpperCase() || member.user.Email[0].toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {member.user.FullName || 'Chưa cập nhật'}
                          </div>
                          <div className="text-sm text-gray-500">{member.user.Email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{member.user.Phone || '-'}</div>
                      <div className="text-sm text-gray-500">{member.user.Address || '-'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-primary-100 text-primary-800">
                        <FiShield className="mr-1" />
                        {member.role.RoleName}
                      </span>
                      {member.role.Description && (
                        <div className="text-xs text-gray-500 mt-1">{member.role.Description}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatDate(member.joinedAt)}
                    </td>
                    <td className="px-6 py-4 text-right text-sm">
                      <button
                        onClick={() => handleOpenEdit(member)}
                        className="text-blue-600 hover:text-blue-700 mr-3"
                        title="Đổi vai trò"
                      >
                        <FiEdit2 />
                      </button>
                      <button
                        onClick={() => handleRemoveMember(member)}
                        className="text-red-600 hover:text-red-700"
                        title="Xóa khỏi cửa hàng"
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

      {/* Add Member Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Thêm thành viên mới</h2>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                <FiX size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmitAdd(onSubmitAdd)} className="p-6 space-y-4">
              {/* Info Alert */}
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex gap-2">
                <FiAlertCircle className="text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800">
                  Nếu email chưa tồn tại trong hệ thống, một tài khoản mới sẽ được tạo với mật khẩu mặc định: <strong>123456</strong>
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  {...registerAdd('email', {
                    required: 'Email là bắt buộc',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Email không hợp lệ',
                    },
                  })}
                  type="email"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="member@example.com"
                />
                {errorsAdd.email && (
                  <p className="mt-1 text-sm text-red-600">{errorsAdd.email.message}</p>
                )}
              </div>

              {/* Role */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vai trò <span className="text-red-500">*</span>
                </label>
                <select
                  {...registerAdd('roleId', { required: 'Vai trò là bắt buộc' })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">-- Chọn vai trò --</option>
                  {roles.map((role) => (
                    <option key={role.RoleID} value={role.RoleID}>
                      {role.RoleName} {role.Description && `- ${role.Description}`}
                    </option>
                  ))}
                </select>
                {errorsAdd.roleId && (
                  <p className="mt-1 text-sm text-red-600">{errorsAdd.roleId.message}</p>
                )}
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Đang thêm...' : 'Thêm thành viên'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Role Modal */}
      {showEditModal && editingMember && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Đổi vai trò</h2>
              <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600">
                <FiX size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmitEdit(onSubmitEdit)} className="p-6 space-y-4">
              {/* Member Info */}
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                    <span className="text-primary-600 font-semibold">
                      {editingMember.user.FullName?.[0]?.toUpperCase() || editingMember.user.Email[0].toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {editingMember.user.FullName || 'Chưa cập nhật'}
                    </div>
                    <div className="text-sm text-gray-500">{editingMember.user.Email}</div>
                  </div>
                </div>
              </div>

              {/* Current Role */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vai trò hiện tại
                </label>
                <div className="px-4 py-2 bg-gray-100 rounded-lg text-sm text-gray-700">
                  {editingMember.role.RoleName}
                </div>
              </div>

              {/* New Role */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vai trò mới <span className="text-red-500">*</span>
                </label>
                <select
                  {...registerEdit('roleId', { required: 'Vai trò là bắt buộc' })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  {roles.map((role) => (
                    <option key={role.RoleID} value={role.RoleID}>
                      {role.RoleName} {role.Description && `- ${role.Description}`}
                    </option>
                  ))}
                </select>
                {errorsEdit.roleId && (
                  <p className="mt-1 text-sm text-red-600">{errorsEdit.roleId.message}</p>
                )}
              </div>

              {/* Buttons */}
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
                  {submitting ? 'Đang cập nhật...' : 'Cập nhật vai trò'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
