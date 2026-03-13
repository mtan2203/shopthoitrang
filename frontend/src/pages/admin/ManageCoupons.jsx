import React, { useState, useEffect, useContext, useCallback, useMemo } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { getCoupons, createCoupon, updateCoupon, deleteCoupon } from '../../services/api';
import { toast } from 'react-toastify';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  Calendar,
  Percent,
  DollarSign,
  Users,
  Crown,
  CheckCircle,
  XCircle,
  RefreshCw,
  Download,
  Eye,
  EyeOff,
  X,
  Save,
  Tag
} from 'lucide-react';

// Quản lý mã giảm giá
const ManageCoupons = () => { 
  const { user } = useContext(AuthContext);
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);
  
  const [form, setForm] = useState({
    id: null,
    code: '',
    discount_type: 'percentage',
    discount_value: '',
    min_purchase_amount: '',
    max_discount_amount: '',
    start_date: '',
    expiry_date: '',
    usage_limit: '',
    is_active: true,
    is_for_vip: false,
  });
  // Hàm để lấy danh sách mã giảm giá từ API
  const fetchCoupons = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getCoupons();
      
      if (response.data && response.data.coupons) {
        setCoupons(response.data.coupons);
      } else {
        setError('Định dạng dữ liệu không đúng');
        setCoupons([]);
      }
    } catch (err) {
      console.error('Lỗi:', err.response?.data?.message || err.message);
      toast.error(err.response?.data?.message || 'Lỗi tải mã giảm giá');
      setError(err.response?.data?.message || err.message);
      setCoupons([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Chỉ gọi fetchCoupons khi người dùng là admin và chưa khởi tạo
  useEffect(() => {
    if (user?.role === 'admin' && !hasInitialized) {
      fetchCoupons();
      setHasInitialized(true);
    } else if (!user || user?.role !== 'admin') {
      setLoading(false);
    }
  }, [user, fetchCoupons, hasInitialized]);
  // Xử lý submit form tạo/sửa mã giảm giá
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    try {
      if (form.id) {
        await updateCoupon(form.id, form);
        toast.success('Cập nhật mã giảm giá thành công');
      } else {
        await createCoupon(form);
        toast.success('Tạo mã giảm giá thành công');
      }
      fetchCoupons();
      resetForm();
      setShowModal(false);
    } catch (err) {
      console.error('Lỗi submit:', err.response?.data?.message || err.message);
      toast.error(err.response?.data?.message || 'Lỗi khi lưu mã giảm giá');
    }
  }, [form, fetchCoupons]);
  // Hàm để chỉnh sửa mã giảm giá
  const handleEdit = useCallback((coupon) => {
    const startDate = coupon.start_date.slice(0, 16);
    const expiryDate = coupon.expiry_date.slice(0, 16);
    
    setForm({
      id: coupon.id,
      code: coupon.code,
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value,
      min_purchase_amount: coupon.min_purchase_amount || 0,
      max_discount_amount: coupon.max_discount_amount || '',
      start_date: startDate,
      expiry_date: expiryDate,
      usage_limit: coupon.usage_limit || '',
      is_active: coupon.is_active === 1 || coupon.is_active === true,
      is_for_vip: coupon.is_for_vip === 1 || coupon.is_for_vip === true,
    });
    setIsEditing(true);
    setShowModal(true);
  }, []);
  // Hàm để xóa mã giảm giá
  const handleDelete = useCallback(async (id, code) => {
    if (window.confirm(`Bạn có chắc muốn xóa mã giảm giá "${code}"?`)) {
      try {
        await deleteCoupon(id);
        toast.success('Xóa mã giảm giá thành công');
        fetchCoupons();
      } catch (err) {
        console.error('Lỗi xóa:', err.response?.data?.message || err.message);
        toast.error(err.response?.data?.message || 'Lỗi khi xóa mã giảm giá');
      }
    }
  }, [fetchCoupons]);
  // Hàm để reset form về trạng thái ban đầu
  const resetForm = useCallback(() => {
    setForm({
      id: null,
      code: '',
      discount_type: 'percentage',
      discount_value: '',
      min_purchase_amount: '',
      max_discount_amount: '',
      start_date: '',
      expiry_date: '',
      usage_limit: '',
      is_active: true,
      is_for_vip: false,
    });
    setIsEditing(false);
  }, []);
  
  const handleOpenModal = useCallback(() => {
    resetForm();
    setShowModal(true);
  }, [resetForm]);

  const handleCloseModal = useCallback(() => {
    setShowModal(false);
    resetForm();
  }, [resetForm]);
  // Hàm để định dạng ngày giờ
  const formatDateTime = useCallback((dateString) => {
    try {
      return new Date(dateString).toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Lỗi định dạng ngày:', error);
      return dateString;
    }
  }, []);
  // Hàm để lấy màu sắc và trạng thái của mã giảm giá
  const getStatusColor = useCallback((isActive, expiryDate) => {
    if (!isActive) return 'bg-red-100 text-red-800';
    if (new Date(expiryDate) < new Date()) return 'bg-gray-100 text-gray-800';
    return 'bg-green-100 text-green-800';
  }, []);
  
  const getStatusText = useCallback((isActive, expiryDate) => {
    if (!isActive) return 'Tắt';
    if (new Date(expiryDate) < new Date()) return 'Hết hạn';
    return 'Hoạt động';
  }, []);
  // Hàm để lọc và hiển thị danh sách mã giảm giá
  const filteredCoupons = useMemo(() => {
    return coupons.filter(coupon => {
      const matchesSearch = coupon.code?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === 'all' || coupon.discount_type === filterType;
      const matchesStatus = filterStatus === 'all' || 
                           (filterStatus === 'active' && coupon.is_active && new Date(coupon.expiry_date) >= new Date()) ||
                           (filterStatus === 'inactive' && !coupon.is_active) ||
                           (filterStatus === 'expired' && new Date(coupon.expiry_date) < new Date());
      
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [coupons, searchTerm, filterType, filterStatus]);
  // Tính toán thống kê mã giảm giá
  const stats = useMemo(() => ({
    total: coupons.length,
    active: coupons.filter(c => c.is_active && new Date(c.expiry_date) >= new Date()).length,
    expired: coupons.filter(c => new Date(c.expiry_date) < new Date()).length,
    vip: coupons.filter(c => c.is_for_vip).length
  }), [coupons]);

  if (!user || user?.role !== 'admin') {
    return (
      <div className="text-center text-red-600 py-12 bg-white rounded-2xl shadow-sm p-6">
        Bạn không có quyền truy cập trang này.
      </div>
    );
  }

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

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white rounded-2xl shadow-sm p-8">
          <p className="text-xl font-semibold text-red-600 mb-4">Lỗi: {error}</p>
          <button 
            onClick={fetchCoupons} 
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            type="button"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Helmet>
        <title>Quản Lý Mã Giảm Giá - Thời Trang XYZ</title>
        <meta name="robots" content="noindex" />
      </Helmet>

      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Quản Lý Mã Giảm Giá</h1>
            <p className="text-gray-600 mt-1">Tạo và quản lý các mã giảm giá cho khách hàng</p>
          </div>
          <div className="flex items-center gap-3 mt-4 lg:mt-0">
            <button
              onClick={fetchCoupons}
              className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
              type="button"
            >
              <RefreshCw size={18} />
              Làm mới
            </button>
            <button
              onClick={handleOpenModal}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              type="button"
            >
              <Plus size={18} />
              Tạo Mã Giảm Giá
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tổng mã giảm giá</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total}</p>
              </div>
              <div className="p-4 rounded-2xl bg-blue-500">
                <Tag size={24} className="text-white" />
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
                <CheckCircle size={24} className="text-white" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Đã hết hạn</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.expired}</p>
              </div>
              <div className="p-4 rounded-2xl bg-red-500">
                <XCircle size={24} className="text-white" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Dành cho VIP</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.vip}</p>
              </div>
              <div className="p-4 rounded-2xl bg-purple-500">
                <Crown size={24} className="text-white" />
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
                placeholder="Tìm kiếm mã giảm giá..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div className="flex items-center gap-3">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Tất cả loại</option>
                <option value="percentage">Phần trăm</option>
                <option value="fixed_amount">Cố định</option>
              </select>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="active">Đang hoạt động</option>
                <option value="inactive">Đã tắt</option>
                <option value="expired">Hết hạn</option>
              </select>
            </div>
          </div>
        </div>

        {/* Coupons Grid */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              Danh Sách Mã Giảm Giá ({filteredCoupons.length})
            </h2>
            <button 
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
              type="button"
            >
              <Download size={18} />
              Xuất Excel
            </button>
          </div>

          {filteredCoupons.length === 0 ? (
            <div className="text-center py-12">
              <Tag size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Không có mã giảm giá nào</h3>
              <p className="text-gray-600 mb-4">Hãy tạo mã giảm giá đầu tiên của bạn</p>
              <button
                onClick={handleOpenModal}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                type="button"
              >
                Tạo Mã Giảm Giá
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCoupons.map((coupon) => (
                <div key={coupon.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow duration-200">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-blue-50 rounded-xl">
                          <Tag className="text-blue-600" size={20} />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg text-gray-900">{coupon.code}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(coupon.is_active, coupon.expiry_date)}`}>
                              {coupon.is_active && new Date(coupon.expiry_date) >= new Date() ? 
                                <CheckCircle size={12} /> : <XCircle size={12} />
                              }
                              {getStatusText(coupon.is_active, coupon.expiry_date)}
                            </span>
                            {coupon.is_for_vip && (
                              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                <Crown size={12} />
                                VIP
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-blue-600">
                          {coupon.discount_value}
                          {coupon.discount_type === 'percentage' ? '%' : ' VNĐ'}
                        </p>
                        <p className="text-sm text-gray-500">
                          {coupon.discount_type === 'percentage' ? 'Giảm %' : 'Giảm cố định'}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                      <div>
                        <p className="text-gray-600">Đơn tối thiểu:</p>
                        <p className="font-medium">{(coupon.min_purchase_amount || 0).toLocaleString()} VNĐ</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Đã dùng:</p>
                        <p className="font-medium">{coupon.times_used || 0}/{coupon.usage_limit || '∞'}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Bắt đầu:</p>
                        <p className="font-medium">{formatDateTime(coupon.start_date)}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Hết hạn:</p>
                        <p className="font-medium">{formatDateTime(coupon.expiry_date)}</p>
                      </div>
                    </div>

                    {coupon.max_discount_amount && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                        <p className="text-sm text-yellow-700">
                          <strong>Giảm tối đa:</strong> {coupon.max_discount_amount.toLocaleString()} VNĐ
                        </p>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(coupon)}
                        className="flex-1 flex items-center justify-center gap-2 bg-green-50 text-green-700 py-2 px-3 rounded-lg hover:bg-green-100 transition-colors text-sm font-medium"
                      >
                        <Edit size={16} />
                        Sửa
                      </button>
                      <button
                        onClick={() => handleDelete(coupon.id, coupon.code)}
                        className="flex items-center justify-center gap-2 bg-red-50 text-red-700 py-2 px-3 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {isEditing ? 'Chỉnh Sửa Mã Giảm Giá' : 'Tạo Mã Giảm Giá Mới'}
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mã giảm giá *
                  </label>
                  <input
                    type="text"
                    name="code"
                    value={form.code}
                    onChange={(e) => setForm(prev => ({ ...prev, code: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="VD: SUMMER2024"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Loại giảm giá
                  </label>
                  <select
                    name="discount_type"
                    value={form.discount_type}
                    onChange={(e) => setForm(prev => ({ ...prev, discount_type: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="percentage">Phần trăm (%)</option>
                    <option value="fixed_amount">Số tiền cố định (VNĐ)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Giá trị giảm *
                  </label>
                  <input
                    type="number"
                    name="discount_value"
                    value={form.discount_value}
                    onChange={(e) => setForm(prev => ({ ...prev, discount_value: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={form.discount_type === 'percentage' ? '10' : '50000'}
                    min="0"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Đơn hàng tối thiểu
                  </label>
                  <input
                    type="number"
                    name="min_purchase_amount"
                    value={form.min_purchase_amount}
                    onChange={(e) => setForm(prev => ({ ...prev, min_purchase_amount: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                    min="0"
                  />
                </div>

                {form.discount_type === 'percentage' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Giảm tối đa (VNĐ)
                    </label>
                    <input
                      type="number"
                      name="max_discount_amount"
                      value={form.max_discount_amount}
                      onChange={(e) => setForm(prev => ({ ...prev, max_discount_amount: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="100000"
                      min="0"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Giới hạn sử dụng
                  </label>
                  <input
                    type="number"
                    name="usage_limit"
                    value={form.usage_limit}
                    onChange={(e) => setForm(prev => ({ ...prev, usage_limit: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Không giới hạn"
                    min="1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ngày bắt đầu *
                  </label>
                  <input
                    type="datetime-local"
                    name="start_date"
                    value={form.start_date}
                    onChange={(e) => setForm(prev => ({ ...prev, start_date: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ngày hết hạn *
                  </label>
                  <input
                    type="datetime-local"
                    name="expiry_date"
                    value={form.expiry_date}
                    onChange={(e) => setForm(prev => ({ ...prev, expiry_date: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
              <div className="flex gap-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={form.is_active}
                    onChange={(e) => setForm(prev => ({ ...prev, is_active: e.target.checked }))}
                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Kích hoạt mã giảm giá</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="is_for_vip"
                    checked={form.is_for_vip}
                    onChange={(e) => setForm(prev => ({ ...prev, is_for_vip: e.target.checked }))}
                    className="w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Dành riêng cho khách hàng VIP</span>
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2"
                >
                  <Save size={18} />
                  {isEditing ? 'Cập nhật' : 'Tạo mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageCoupons;