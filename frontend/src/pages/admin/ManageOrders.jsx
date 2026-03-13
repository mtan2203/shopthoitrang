import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { getOrders, updateOrderStatus, updateTrackingOrder, getOrderStatusGHTK } from '../../services/api';
import { Helmet } from 'react-helmet-async';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import axios from 'axios';
import {
  ShoppingCart,
  Package,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  RefreshCw,
  Download,
  Calendar,
  DollarSign,
  User,
  MapPin,
  Phone,
  Mail,
  FileText,
  AlertTriangle,
  Save,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

const ManageOrders = () => {
  const { user, logout } = useContext(AuthContext);
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteOrderId, setDeleteOrderId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [editingTrackingOrder, setEditingTrackingOrder] = useState(null);
  const [trackingOrderInput, setTrackingOrderInput] = useState('');
  const ordersPerPage = 12;

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchOrders();
    }
  }, [user]);

  useEffect(() => {
    filterOrders();
  }, [orders, searchTerm, statusFilter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await getOrders();
      const fetchedOrders = res.data.orders || [];
      
      // Kiểm tra và cập nhật trạng thái từ GHTK
      const updatedOrders = await Promise.all(fetchedOrders.map(async (order) => {
        if (order.tracking_order) {
          try {
            const ghtkResponse = await getOrderStatusGHTK(order.tracking_order);
            if (ghtkResponse.success) {
              const ghtkStatus = ghtkResponse.order.status_text.toLowerCase();
              const statusMapping = {
                'chưa tiếp nhận': 'pending',
                'đã tiếp nhận': 'processing',
                'đang giao': 'shipped',
                'đã giao': 'delivered',
                'đã hủy': 'cancelled'
              };
              const mappedStatus = statusMapping[ghtkStatus] || order.status;

              if (mappedStatus !== order.status) {
                await updateOrderStatus(order.id, mappedStatus);
                return { ...order, status: mappedStatus };
              }
            }
          } catch (ghtkErr) {
            console.error(`Lỗi lấy trạng thái GHTK cho đơn ${order.id}:`, ghtkErr.message);
          }
        }
        return order;
      }));

      setOrders(updatedOrders);
    } catch (err) {
      setError('Lỗi khi lấy danh sách đơn hàng. Vui lòng thử lại.');
      console.error('Lỗi lấy đơn hàng:', err.response?.data || err);
    } finally {
      setLoading(false);
    }
  };

  const filterOrders = () => {
    let filtered = orders;
    
    if (searchTerm) {
      filtered = filtered.filter(
        (order) =>
          order.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.id.toString().includes(searchTerm) ||
          order.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (statusFilter) {
      filtered = filtered.filter((order) => order.status === statusFilter);
    }
    
    setFilteredOrders(filtered);
    setCurrentPage(1);
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      if (!user) {
        throw new Error('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
      }
      await updateOrderStatus(orderId, newStatus);
      toast.success(`Cập nhật trạng thái đơn hàng #${orderId} thành công!`);
      fetchOrders();
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Lỗi khi cập nhật trạng thái đơn hàng.';
      setError(errorMessage);
      toast.error(errorMessage);
      if (errorMessage.includes('Phiên đăng nhập hết hạn')) {
        setTimeout(() => {
          logout();
          window.location.href = '/dang-nhap';
        }, 2000);
      }
    }
  };

  const handleDeleteOrder = async () => {
    try {
      if (!user) {
        throw new Error('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
      }
      await axios.delete(`http://localhost:5000/api/orders/${deleteOrderId}`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      toast.success(`Xóa đơn hàng #${deleteOrderId} thành công!`);
      fetchOrders();
      setShowDeleteModal(false);
      setDeleteOrderId(null);
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Lỗi khi xóa đơn hàng.';
      setError(errorMessage);
      toast.error(errorMessage);
      if (errorMessage.includes('Phiên đăng nhập hết hạn')) {
        setTimeout(() => {
          logout();
          window.location.href = '/dang-nhap';
        }, 2000);
      }
    }
  };

  const handleUpdateTrackingOrder = async (orderId) => {
    try {
      await updateTrackingOrder(orderId, trackingOrderInput);
      toast.success(`Cập nhật mã vận đơn cho đơn hàng #${orderId} thành công!`);
      setEditingTrackingOrder(null);
      setTrackingOrderInput('');
      fetchOrders();
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Lỗi khi cập nhật mã vận đơn.';
      toast.error(errorMessage);
    }
  };

  const viewOrderDetails = async (order) => {
    try {
      const res = await axios.get(`http://localhost:5000/api/orders/${order.id}`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      setSelectedOrder(res.data);
      setShowDetailModal(true);
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Lỗi khi lấy chi tiết đơn hàng.';
      toast.error(errorMessage);
      if (errorMessage.includes('Phiên đăng nhập hết hạn')) {
        setTimeout(() => {
          logout();
          window.location.href = '/dang-nhap';
        }, 2000);
      }
    }
  };

  const getStatusInfo = (status) => {
    const statusMap = {
      pending: { text: 'Đang chờ', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      processing: { text: 'Đang xử lý', color: 'bg-blue-100 text-blue-800', icon: Package },
      shipped: { text: 'Đã giao', color: 'bg-purple-100 text-purple-800', icon: Truck },
      delivered: { text: 'Hoàn thành', color: 'bg-green-100 text-green-800', icon: CheckCircle },
      cancelled: { text: 'Đã hủy', color: 'bg-red-100 text-red-800', icon: XCircle },
    };
    return statusMap[status] || { text: status, color: 'bg-gray-100 text-gray-800', icon: AlertTriangle };
  };

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    processing: orders.filter(o => o.status === 'processing').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    totalRevenue: orders.reduce((sum, o) => sum + (o.total || 0), 0)
  };

  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = filteredOrders.slice(indexOfFirstOrder, indexOfLastOrder);
  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);

  if (!user || user?.role !== 'admin') {
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
        <title>Quản Lý Đơn Hàng - Thời Trang XYZ</title>
        <meta name="robots" content="noindex" />
      </Helmet>

      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Quản Lý Đơn Hàng</h1>
            <p className="text-gray-600 mt-1">Theo dõi và xử lý đơn hàng từ khách hàng</p>
          </div>
          <div className="flex items-center gap-3 mt-4 lg:mt-0">
            <button
              onClick={fetchOrders}
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

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tổng đơn hàng</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total}</p>
              </div>
              <div className="p-4 rounded-2xl bg-blue-500">
                <ShoppingCart size={24} className="text-white" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Đang chờ</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.pending}</p>
              </div>
              <div className="p-4 rounded-2xl bg-yellow-500">
                <Clock size={24} className="text-white" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Đang xử lý</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.processing}</p>
              </div>
              <div className="p-4 rounded-2xl bg-purple-500">
                <Package size={24} className="text-white" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Hoàn thành</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.delivered}</p>
              </div>
              <div className="p-4 rounded-2xl bg-green-500">
                <CheckCircle size={24} className="text-white" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Doanh thu</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{`${(stats.totalRevenue / 1000000).toFixed(1)}M`}</p>
                <p className="text-sm text-gray-500 mt-1">VNĐ</p>
              </div>
              <div className="p-4 rounded-2xl bg-indigo-500">
                <DollarSign size={24} className="text-white" />
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
                placeholder="Tìm theo mã đơn, khách hàng hoặc email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div className="flex items-center gap-3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Tất cả trạng thái</option>
                <option value="pending">Đang chờ</option>
                <option value="processing">Đang xử lý</option>
                <option value="shipped">Đã giao</option>
                <option value="delivered">Hoàn thành</option>
                <option value="cancelled">Đã hủy</option>
              </select>
            </div>
          </div>
        </div>

        {/* Orders Grid */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              Danh Sách Đơn Hàng ({filteredOrders.length})
            </h2>
          </div>

          {filteredOrders.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm || statusFilter ? 'Không tìm thấy đơn hàng nào' : 'Chưa có đơn hàng nào'}
              </h3>
              <p className="text-gray-600">
                {searchTerm || statusFilter ? 'Thử thay đổi bộ lọc tìm kiếm' : 'Đơn hàng sẽ xuất hiện khi khách hàng đặt mua'}
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {currentOrders.map((order) => {
                  const statusInfo = getStatusInfo(order.status);
                  const StatusIcon = statusInfo.icon;

                  return (
                    <motion.div
                      key={order.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300"
                    >
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="font-bold text-lg text-gray-900">Đơn hàng #{order.id}</h3>
                            <p className="text-sm text-gray-600">{order.customerName || 'Khách hàng'}</p>
                          </div>
                          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
                            <StatusIcon size={12} />
                            {statusInfo.text}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                          <div>
                            <p className="text-gray-600">Tổng tiền:</p>
                            <p className="font-bold text-lg text-green-600">
                              {(order.total || 0).toLocaleString()} VNĐ
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-600">Ngày đặt:</p>
                            <p className="font-medium">
                              {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                            </p>
                          </div>
                        </div>

                        <div className="mb-4">
                          <p className="text-gray-600 text-sm mb-1">Mã vận đơn:</p>
                          {editingTrackingOrder === order.id ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                value={trackingOrderInput}
                                onChange={(e) => setTrackingOrderInput(e.target.value)}
                                placeholder="Nhập mã vận đơn"
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                              />
                              <button
                                onClick={() => handleUpdateTrackingOrder(order.id)}
                                className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                              >
                                <Save size={16} />
                              </button>
                              <button
                                onClick={() => setEditingTrackingOrder(null)}
                                className="p-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                              >
                                <X size={16} />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">
                                {order.tracking_order || 'Chưa có'}
                              </span>
                              <button
                                onClick={() => {
                                  setEditingTrackingOrder(order.id);
                                  setTrackingOrderInput(order.tracking_order || '');
                                }}
                                className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                              >
                                <Edit size={16} />
                              </button>
                            </div>
                          )}
                        </div>

                        <div className="mb-4">
                          <p className="text-gray-600 text-sm mb-2">Trạng thái:</p>
                          {order.status === 'cancelled' ? (
                            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg text-sm font-medium ${statusInfo.color}`}>
                              <StatusIcon size={16} />
                              {statusInfo.text}
                            </span>
                          ) : (
                            <select
                              value={order.status || 'pending'}
                              onChange={(e) => handleStatusChange(order.id, e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            >
                              <option value="pending">Đang chờ</option>
                              <option value="processing">Đang xử lý</option>
                              <option value="shipped">Đã giao</option>
                              <option value="delivered">Hoàn thành</option>
                            </select>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => viewOrderDetails(order)}
                            className="flex-1 flex items-center justify-center gap-2 bg-blue-50 text-blue-700 py-2 px-3 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
                          >
                            <Eye size={16} />
                            Chi tiết
                          </button>
                          <button
                            onClick={() => {
                              setDeleteOrderId(order.id);
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

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  
                  <div className="flex gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const page = i + Math.max(1, currentPage - 2);
                      if (page > totalPages) return null;
                      
                      return (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`px-4 py-2 rounded-lg transition-colors ${
                            currentPage === page
                              ? 'bg-blue-600 text-white'
                              : 'border border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    })}
                  </div>
                  
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Chi Tiết Đơn Hàng #{selectedOrder?.id}
              </h2>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Customer Info */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <User size={20} />
                  Thông Tin Khách Hàng
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Mail size={16} className="text-gray-500" />
                    <span>{selectedOrder?.email || 'Không có'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone size={16} className="text-gray-500" />
                    <span>{selectedOrder?.phone || 'Không có'}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin size={16} className="text-gray-500 mt-0.5" />
                    <span>{selectedOrder?.address || 'Không có'}</span>
                  </div>
                </div>
              </div>
              {/* Order Info */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <ShoppingCart size={20} />
                  Thông Tin Đơn Hàng
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Ngày đặt:</span>
                    <span>{new Date(selectedOrder?.createdAt).toLocaleString('vi-VN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Trạng thái:</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusInfo(selectedOrder?.status).color}`}>
                      {getStatusInfo(selectedOrder?.status).text}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Mã vận đơn:</span>
                    <span>{selectedOrder?.tracking_order || 'Chưa có'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Mã giảm giá:</span>
                    <span>{selectedOrder?.coupon_code || 'Không áp dụng'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <DollarSign size={20} />
                Tóm Tắt Đơn Hàng
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Tổng phụ:</span>
                  <p className="font-bold">{(selectedOrder?.subtotal || 0).toLocaleString()} VNĐ</p>
                </div>
                <div>
                  <span className="text-gray-600">Phí ship:</span>
                  <p className="font-bold">{(selectedOrder?.shipping_fee || 0).toLocaleString()} VNĐ</p>
                </div>
                <div>
                  <span className="text-gray-600">Giảm giá:</span>
                  <p className="font-bold text-red-600">-{(selectedOrder?.discount_amount || 0).toLocaleString()} VNĐ</p>
                </div>
                <div>
                  <span className="text-gray-600">Tổng cộng:</span>
                  <p className="font-bold text-xl text-green-600">{(selectedOrder?.total || 0).toLocaleString()} VNĐ</p>
                </div>
              </div>
              {selectedOrder?.notes && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <span className="text-gray-600 text-sm">Ghi chú:</span>
                  <p className="mt-1">{selectedOrder.notes}</p>
                </div>
              )}
            </div>

            {/* Products */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Package size={20} />
                Sản Phẩm Đã Đặt
              </h3>
              {selectedOrder?.items && selectedOrder.items.length > 0 ? (
                <div className="space-y-4">
                  {selectedOrder.items.map((item, index) => (
                    <div key={index} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                      <div className="w-16 h-16 bg-white rounded-lg overflow-hidden flex-shrink-0">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.name || 'Sản phẩm'}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-200">
                            <Package size={20} className="text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{item.name || 'Sản phẩm'}</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-1 text-sm text-gray-600">
                          <span>SL: {item.quantity}</span>
                          <span>Size: {item.size}</span>
                          <span>Màu: {item.color}</span>
                          <span className="font-medium">{(item.price || 0).toLocaleString()} VNĐ</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg">
                          {(item.price * item.quantity || 0).toLocaleString()} VNĐ
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-red-50 rounded-xl">
                  <AlertTriangle size={48} className="mx-auto text-red-500 mb-4" />
                  <p className="text-red-600 font-medium">Lỗi: Đơn hàng không có sản phẩm</p>
                  <p className="text-red-500 text-sm">Đây là dữ liệu không hợp lệ. Vui lòng xóa đơn hàng này.</p>
                </div>
              )}
            </div>

            <div className="flex justify-end mt-6 pt-4 border-t border-gray-200">
              <button
                onClick={() => setShowDetailModal(false)}
                className="bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                Đóng
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
                Bạn có chắc muốn xóa đơn hàng #{deleteOrderId}? Hành động này không thể hoàn tác.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  Hủy
                </button>
                <button
                  onClick={handleDeleteOrder}
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

export default ManageOrders;