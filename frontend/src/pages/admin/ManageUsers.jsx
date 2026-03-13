import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { getUsers, deleteUser, updateUser, lockUser, unlockUser } from '../../services/api';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import {
  Users,
  UserCheck,
  UserX,
  Crown,
  Shield,
  Edit,
  Trash2,
  Lock,
  Unlock,
  Search,
  RefreshCw,
  Download,
  Grid,
  List,
  X,
  Save,
  Calendar,
  DollarSign,
  Mail,
  User,
  AlertTriangle,
  Eye,
  EyeOff
} from 'lucide-react';

const ManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  
  // Modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [showLockModal, setShowLockModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  const [selectedUser, setSelectedUser] = useState(null);
  const [editUsername, setEditUsername] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState('');
  const [lockDays, setLockDays] = useState('');
  const [deleteUserId, setDeleteUserId] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, filterRole, filterStatus]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await getUsers();
      setUsers(response.data.users || []);
    } catch (error) {
      console.error('Lỗi khi lấy danh sách người dùng:', error.response?.data || error.message);
      toast.error('Không thể tải danh sách người dùng');
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = users;

    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterRole !== 'all') {
      filtered = filtered.filter(user => user.role === filterRole);
    }

    if (filterStatus !== 'all') {
      if (filterStatus === 'active') {
        filtered = filtered.filter(user => !user.is_locked);
      } else if (filterStatus === 'locked') {
        filtered = filtered.filter(user => user.is_locked);
      } else if (filterStatus === 'vip') {
        filtered = filtered.filter(user => user.is_vip);
      }
    }

    setFilteredUsers(filtered);
  };

  const handleDeleteUser = async () => {
    try {
      await deleteUser(deleteUserId);
      toast.success('Xóa người dùng thành công');
      setShowDeleteModal(false);
      setDeleteUserId(null);
      fetchUsers();
    } catch (error) {
      console.error('Lỗi khi xóa người dùng:', error.response?.data || error.message);
      toast.error(error.response?.data?.message || 'Không thể xóa người dùng');
    }
  };

  const handleOpenEditModal = (user) => {
    setSelectedUser(user);
    setEditUsername(user.username || '');
    setEditEmail(user.email || '');
    setEditRole(user.role || 'user');
    setShowEditModal(true);
  };

  const handleUpdateUser = async () => {
    if (!editUsername.trim() || !editEmail.trim()) {
      toast.error('Vui lòng điền đầy đủ thông tin (username và email)');
      return;
    }

    try {
      await updateUser(selectedUser.id, {
        username: editUsername,
        email: editEmail,
        role: editRole,
      });

      toast.success('Cập nhật người dùng thành công');
      setShowEditModal(false);
      fetchUsers();
    } catch (error) {
      console.error('Lỗi khi cập nhật người dùng:', error.response?.data || error.message);
      toast.error(error.response?.data?.message || 'Không thể cập nhật người dùng');
    }
  };

  const handleOpenLockModal = (user) => {
    setSelectedUser(user);
    setLockDays('');
    setShowLockModal(true);
  };

  const handleLockUser = async () => {
    if (!lockDays || lockDays <= 0) {
      toast.error('Vui lòng nhập số ngày khóa hợp lệ');
      return;
    }

    try {
      await lockUser(selectedUser.id, lockDays);
      toast.success('Khóa tài khoản thành công');
      setShowLockModal(false);
      fetchUsers();
    } catch (error) {
      console.error('Lỗi khi khóa tài khoản:', error.response?.data || error.message);
      toast.error(error.response?.data?.message || 'Không thể khóa tài khoản');
    }
  };

  const handleUnlockUser = async (userId) => {
    try {
      await unlockUser(userId);
      toast.success('Mở khóa tài khoản thành công');
      fetchUsers();
    } catch (error) {
      console.error('Lỗi khi mở khóa tài khoản:', error.response?.data || error.message);
      toast.error(error.response?.data?.message || 'Không thể mở khóa tài khoản');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Không xác định';
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' });
  };

  const formatCurrency = (amount) => {
    return (amount || 0).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
  };

  const getUserStatusInfo = (user) => {
    if (user.is_locked) {
      return { text: 'Bị khóa', color: 'bg-red-100 text-red-800', icon: Lock };
    }
    return { text: 'Hoạt động', color: 'bg-green-100 text-green-800', icon: UserCheck };
  };

  const stats = {
    total: users.length,
    active: users.filter(u => !u.is_locked).length,
    locked: users.filter(u => u.is_locked).length,
    vip: users.filter(u => u.is_vip).length,
    admins: users.filter(u => u.role === 'admin').length
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-xl font-semibold text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gray-50"
    >
      <Helmet>
        <title>Quản Lý Người Dùng - Thời Trang XYZ</title>
        <meta name="robots" content="noindex" />
      </Helmet>

      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Quản Lý Người Dùng</h1>
            <p className="text-gray-600 mt-1">Quản lý tài khoản và quyền hạn người dùng</p>
          </div>
          <div className="flex items-center gap-3 mt-4 lg:mt-0">
            <button
              onClick={fetchUsers}
              className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <RefreshCw size={18} />
              Làm mới
            </button>
            <button className="flex items-center gap-2 text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors">
              <Download size={18} />
              Xuất Excel
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tổng người dùng</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total}</p>
              </div>
              <div className="p-4 rounded-2xl bg-blue-500">
                <Users size={24} className="text-white" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Đang hoạt động</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.active}</p>
              </div>
              <div className="p-4 rounded-2xl bg-green-500">
                <UserCheck size={24} className="text-white" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Bị khóa</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.locked}</p>
              </div>
              <div className="p-4 rounded-2xl bg-red-500">
                <UserX size={24} className="text-white" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">VIP</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.vip}</p>
              </div>
              <div className="p-4 rounded-2xl bg-purple-500">
                <Crown size={24} className="text-white" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Admin</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.admins}</p>
              </div>
              <div className="p-4 rounded-2xl bg-indigo-500">
                <Shield size={24} className="text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Tìm kiếm theo username hoặc email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div className="flex items-center gap-3">
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Tất cả vai trò</option>
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="active">Hoạt động</option>
                <option value="locked">Bị khóa</option>
                <option value="vip">VIP</option>
              </select>

              <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-3 ${viewMode === 'grid' ? 'bg-blue-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'} transition-colors`}
                >
                  <Grid size={18} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-3 ${viewMode === 'list' ? 'bg-blue-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'} transition-colors`}
                >
                  <List size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Users Grid */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              Danh Sách Người Dùng ({filteredUsers.length})
            </h2>
          </div>

          {filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <Users size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm || filterRole !== 'all' || filterStatus !== 'all' 
                  ? 'Không tìm thấy người dùng nào' 
                  : 'Chưa có người dùng nào'
                }
              </h3>
              <p className="text-gray-600">
                {searchTerm || filterRole !== 'all' || filterStatus !== 'all'
                  ? 'Thử thay đổi bộ lọc tìm kiếm'
                  : 'Người dùng sẽ xuất hiện khi có đăng ký mới'
                }
              </p>
            </div>
          ) : (
            <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
              {filteredUsers.map((user) => {
                const statusInfo = getUserStatusInfo(user);
                const StatusIcon = statusInfo.icon;

                return (
                  <motion.div
                    key={user.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300"
                  >
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                            {user.username?.charAt(0).toUpperCase() || 'U'}
                          </div>
                          <div>
                            <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                              {user.username || 'N/A'}
                              {user.role === 'admin' && <Shield size={16} className="text-blue-600" />}
                              {user.is_vip && <Crown size={16} className="text-purple-600" />}
                            </h3>
                            <p className="text-sm text-gray-600">{user.email || 'N/A'}</p>
                          </div>
                        </div>
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
                          <StatusIcon size={12} />
                          {statusInfo.text}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                        <div>
                          <p className="text-gray-600">Vai trò:</p>
                          <p className="font-medium capitalize">{user.role || 'user'}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Tổng chi tiêu:</p>
                          <p className="font-bold text-green-600">{formatCurrency(user.total_spent)}</p>
                        </div>
                      </div>

                      {user.is_locked && user.locked_until && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                          <p className="text-red-600 text-sm">
                            <strong>Khóa đến:</strong> {formatDate(user.locked_until)}
                          </p>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleOpenEditModal(user)}
                          className="flex-1 flex items-center justify-center gap-2 bg-blue-50 text-blue-700 py-2 px-3 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
                        >
                          <Edit size={16} />
                          Sửa
                        </button>
                        
                        {user.is_locked ? (
                          <button
                            onClick={() => handleUnlockUser(user.id)}
                            className="flex items-center justify-center gap-2 bg-green-50 text-green-700 py-2 px-3 rounded-lg hover:bg-green-100 transition-colors text-sm font-medium"
                          >
                            <Unlock size={16} />
                          </button>
                        ) : (
                          <button
                          onClick={() => handleOpenLockModal(user)}
                          className="flex items-center justify-center gap-2 bg-yellow-50 text-yellow-700 py-2 px-3 rounded-lg hover:bg-yellow-100 transition-colors text-sm font-medium"
                        >
                          <Lock size={16} />
                        </button>
                        )}
                        
                        <button
                          onClick={() => {
                            setDeleteUserId(user.id);
                            setShowDeleteModal(true);
                          }}
                          className="flex items-center justify-center gap-2 bg-red-50 text-red-700 py-2 px-3 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 w-full max-w-md"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Chỉnh Sửa Người Dùng</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Username *</label>
                <input
                  type="text"
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nhập username..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nhập email..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Vai trò</label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                Hủy
              </button>
              <button
                onClick={handleUpdateUser}
                className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2"
              >
                <Save size={18} />
                Cập nhật
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Lock Modal */}
      {showLockModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 w-full max-w-md"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Khóa Tài Khoản</h2>
              <button
                onClick={() => setShowLockModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <div className="mb-6">
              <p className="text-gray-600 mb-4">
                Bạn đang khóa tài khoản của <strong>{selectedUser?.username}</strong>
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Số ngày khóa *
                </label>
                <input
                  type="number"
                  value={lockDays}
                  onChange={(e) => setLockDays(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  placeholder="Nhập số ngày..."
                  min="1"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowLockModal(false)}
                className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                Hủy
              </button>
              <button
                onClick={handleLockUser}
                className="flex-1 bg-yellow-600 text-white py-3 px-4 rounded-lg hover:bg-yellow-700 transition-colors font-medium flex items-center justify-center gap-2"
              >
                <Lock size={18} />
                Khóa
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 w-full max-w-md"
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle size={24} className="text-red-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Xác nhận xóa</h2>
              <p className="text-gray-600 mb-6">
                Bạn có chắc muốn xóa người dùng này? Hành động này không thể hoàn tác.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  Hủy
                </button>
                <button
                  onClick={handleDeleteUser}
                  className="flex-1 bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 transition-colors font-medium"
                >
                  Xóa
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};
export default ManageUsers;