import React, { useState, useEffect, useContext, useCallback, useMemo } from 'react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../../services/api';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Folder,
  FolderPlus,
  RefreshCw,
  Download,
  Grid,
  List,
  X,
  Save,
  Package,
  Tag,
  AlertTriangle
} from 'lucide-react';

const ManageCategories = () => {
  const { user, logout, loading } = useContext(AuthContext);
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState('');
  const [editId, setEditId] = useState(null);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [hasInitialized, setHasInitialized] = useState(false);

  // Memoize fetchCategories để tránh re-render không cần thiết
  const fetchCategories = useCallback(async () => {
    try {
      setLoadingData(true);
      const res = await getCategories();
      setCategories(res.data.categories || []);
      setError('');
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Lỗi khi lấy danh mục: ' + err.message;
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Lỗi lấy danh mục:', err.response?.data || err);
      if (err.response?.status === 401) {
        setTimeout(() => {
          logout();
          navigate('/dang-nhap');
        }, 2000);
      }
    } finally {
      setLoadingData(false);
    }
  }, [logout, navigate]);

  useEffect(() => {
    if (loading) return;
    if (!user || user.role !== 'admin') {
      setError('Bạn không có quyền truy cập. Vui lòng đăng nhập tài khoản admin.');
      toast.error('Bạn không có quyền truy cập.');
      setTimeout(() => navigate('/dang-nhap'), 2000);
      return;
    }
    if (!hasInitialized) {
      fetchCategories();
      setHasInitialized(true);
    }
  }, [user, loading, navigate, fetchCategories, hasInitialized]);

  // Memoize filtered categories để tránh re-render không cần thiết
  const filteredCategories = useMemo(() => {
    if (!searchTerm.trim()) {
      return categories;
    }
    return categories.filter(category =>
      category.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [categories, searchTerm]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Vui lòng nhập tên danh mục');
      return;
    }

    setError('');
    const token = localStorage.getItem('token');

    if (!token) {
      setError('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
      toast.error('Phiên đăng nhập hết hạn.');
      setTimeout(() => {
        logout();
        navigate('/dang-nhap');
      }, 2000);
      return;
    }

    if (!user || user.role !== 'admin') {
      setError('Bạn không có quyền thực hiện hành động này.');
      toast.error('Bạn không có quyền thực hiện hành động này.');
      return;
    }

    try {
      if (editId) {
        await updateCategory(editId, name);
        toast.success('Cập nhật danh mục thành công');
      } else {
        await createCategory(name);
        toast.success('Thêm danh mục thành công');
      }
      resetForm();
      setShowModal(false);
      fetchCategories();
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Lỗi: ' + err.message;
      setError(errorMessage);
      toast.error(errorMessage);
      if (err.response?.status === 401) {
        setTimeout(() => {
          logout();
          navigate('/dang-nhap');
        }, 2000);
      }
      console.error('Lỗi xử lý danh mục:', err.response?.data || err);
    }
  }, [name, editId, user, logout, navigate, fetchCategories]);

  const handleEdit = useCallback((category) => {
    setName(category.name);
    setEditId(category.id);
    setIsEditing(true);
    setShowModal(true);
  }, []);

  const handleDelete = useCallback(async (id, categoryName) => {
    if (window.confirm(`Bạn chắc chắn muốn xóa danh mục "${categoryName}"? Lưu ý: Không thể xóa nếu danh mục đang được sử dụng bởi sản phẩm.`)) {
      setError('');
      const token = localStorage.getItem('token');

      if (!token) {
        setError('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
        toast.error('Phiên đăng nhập hết hạn.');
        setTimeout(() => {
          logout();
          navigate('/dang-nhap');
        }, 2000);
        return;
      }

      try {
        await deleteCategory(id);
        toast.success('Xóa danh mục thành công');
        fetchCategories();
      } catch (err) {
        const errorMessage = err.response?.data?.message || 'Lỗi: ' + err.message;
        setError(errorMessage);
        toast.error(errorMessage);
        if (err.response?.status === 401) {
          setTimeout(() => {
            logout();
            navigate('/dang-nhap');
          }, 2000);
        }
        console.error('Lỗi xóa danh mục:', err.response?.data || err);
      }
    }
  }, [logout, navigate, fetchCategories]);

  const resetForm = useCallback(() => {
    setName('');
    setEditId(null);
    setIsEditing(false);
    setError('');
  }, []);

  const handleSearchChange = useCallback((e) => {
    setSearchTerm(e.target.value);
  }, []);

  const handleViewModeChange = useCallback((mode) => {
    setViewMode(mode);
  }, []);

  const handleNameChange = useCallback((e) => {
    setName(e.target.value);
  }, []);

  const handleOpenModal = useCallback(() => {
    resetForm();
    setShowModal(true);
  }, [resetForm]);

  const handleCloseModal = useCallback(() => {
    setShowModal(false);
    resetForm();
  }, [resetForm]);

  // Memoize stats calculation
  const stats = useMemo(() => ({
    total: categories.length,
    recent: categories.filter(c => {
      const createdAt = new Date(c.createdAt);
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return createdAt > oneWeekAgo;
    }).length
  }), [categories]);

  const StatCard = React.memo(({ icon: Icon, title, value, color, subtitle }) => (
    <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
          {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className={`p-4 rounded-2xl ${color}`}>
          <Icon size={24} className="text-white" />
        </div>
      </div>
    </div>
  ));

  const CategoryCard = React.memo(({ category, onEdit, onDelete }) => (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow duration-200">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-50 rounded-xl">
              <Folder className="text-indigo-600" size={24} />
            </div>
            <div>
              <h3 className="font-bold text-lg text-gray-900">{category.name}</h3>
              <p className="text-sm text-gray-500">ID: {category.id}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
          <div>
            <p className="text-gray-600">Ngày tạo:</p>
            <p className="font-medium">{new Date(category.createdAt).toLocaleDateString('vi-VN')}</p>
          </div>
          <div>
            <p className="text-gray-600">Cập nhật:</p>
            <p className="font-medium">{new Date(category.updatedAt).toLocaleDateString('vi-VN')}</p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => onEdit(category)}
            className="flex-1 flex items-center justify-center gap-2 bg-green-50 text-green-700 py-2 px-3 rounded-lg hover:bg-green-100 transition-colors text-sm font-medium"
          >
            <Edit size={16} />
            Sửa
          </button>
          <button
            onClick={() => onDelete(category.id, category.name)}
            className="flex items-center justify-center gap-2 bg-red-50 text-red-700 py-2 px-3 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  ));

  const Modal = React.memo(() => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {isEditing ? 'Chỉnh Sửa Danh Mục' : 'Tạo Danh Mục Mới'}
          </h2>
          <button
            onClick={handleCloseModal}
            className="text-gray-400 hover:text-gray-600"
            type="button"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tên danh mục *
            </label>
            <input
              type="text"
              value={name}
              onChange={handleNameChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="VD: Áo thun, Quần jeans..."
              required
              autoFocus
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleCloseModal}
              className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="flex-1 bg-indigo-600 text-white py-3 px-4 rounded-lg hover:bg-indigo-700 transition-colors font-medium flex items-center justify-center gap-2"
            >
              <Save size={18} />
              {isEditing ? 'Cập nhật' : 'Tạo mới'}
            </button>
          </div>
        </form>
      </div>
    </div>
  ));

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-xl font-semibold text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center text-red-600 bg-white rounded-2xl shadow-sm p-8">
          <AlertTriangle size={48} className="mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Không có quyền truy cập</h2>
          <p>Bạn cần đăng nhập với tài khoản admin để truy cập trang này.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Helmet>
        <title>Quản Lý Danh Mục - Thời Trang XYZ</title>
        <meta name="robots" content="noindex" />
      </Helmet>

      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Quản Lý Danh Mục</h1>
            <p className="text-gray-600 mt-1">Tạo và quản lý danh mục sản phẩm</p>
          </div>
          <div className="flex items-center gap-3 mt-4 lg:mt-0">
            <button
              onClick={fetchCategories}
              className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
              type="button"
            >
              <RefreshCw size={18} />
              Làm mới
            </button>
            <button
              onClick={handleOpenModal}
              className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
              type="button"
            >
              <Plus size={18} />
              Tạo Danh Mục
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={Folder}
            title="Tổng danh mục"
            value={stats.total}
            color="bg-indigo-500"
          />
          <StatCard
            icon={FolderPlus}
            title="Tạo tuần này"
            value={stats.recent}
            color="bg-green-500"
          />
          <StatCard
            icon={Package}
            title="Đang sử dụng"
            value={stats.total}
            color="bg-blue-500"
            subtitle="Có sản phẩm"
          />
          <StatCard
            icon={Tag}
            title="Trung bình"
            value="12"
            color="bg-purple-500"
            subtitle="SP/danh mục"
          />
        </div>

        {/* Search & Filters */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Tìm kiếm danh mục..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                <button
                  onClick={() => handleViewModeChange('grid')}
                  className={`p-3 ${viewMode === 'grid' ? 'bg-indigo-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'} transition-colors`}
                  type="button"
                >
                  <Grid size={18} />
                </button>
                <button
                  onClick={() => handleViewModeChange('list')}
                  className={`p-3 ${viewMode === 'list' ? 'bg-indigo-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'} transition-colors`}
                  type="button"
                >
                  <List size={18} />
                </button>
              </div>
              <button 
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                type="button"
              >
                <Download size={18} />
                Xuất Excel
              </button>
            </div>
          </div>
        </div>

        {/* Categories Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              Danh Sách Danh Mục ({filteredCategories.length})
            </h2>
          </div>

          {loadingData ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array(8).fill().map((_, index) => (
                <div key={index} className="bg-gray-100 rounded-2xl p-6 animate-pulse">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-gray-200 rounded-xl"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="h-3 bg-gray-200 rounded"></div>
                    <div className="h-3 bg-gray-200 rounded"></div>
                  </div>
                  <div className="flex gap-2">
                    <div className="h-8 bg-gray-200 rounded flex-1"></div>
                    <div className="h-8 bg-gray-200 rounded w-12"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredCategories.length === 0 ? (
            <div className="text-center py-12">
              {searchTerm ? (
                <>
                  <Folder size={48} className="mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Không tìm thấy danh mục nào</h3>
                  <p className="text-gray-600 mb-4">Thử thay đổi từ khóa tìm kiếm</p>
                </>
              ) : (
                <>
                  <FolderPlus size={48} className="mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có danh mục nào</h3>
                  <p className="text-gray-600 mb-4">Hãy tạo danh mục đầu tiên cho sản phẩm</p>
                  <button
                    onClick={handleOpenModal}
                    className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors"
                    type="button"
                  >
                    Tạo Danh Mục
                  </button>
                </>
              )}
            </div>
          ) : (
            <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1'}`}>
              {filteredCategories.map((category) => (
                <CategoryCard 
                  key={category.id} 
                  category={category} 
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && <Modal />}
    </div>
  );
};

export default ManageCategories;