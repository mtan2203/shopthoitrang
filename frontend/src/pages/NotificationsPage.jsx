import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Helmet } from 'react-helmet-async';
import { Bell, CheckCircle, Trash2, ChevronLeft, ChevronRight, CheckSquare } from 'lucide-react';
import { getNotifications, markNotificationAsRead, deleteNotification } from '../services/api';

const NotificationsPage = () => {
  const { user } = useContext(AuthContext);
  const [notifications, setNotifications] = useState([]);
  const [filteredNotifications, setFilteredNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // Thêm 'order' vào bộ lọc
  const [page, setPage] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    if (user) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  useEffect(() => {
    let filtered = notifications;
    if (filter !== 'all') {
      filtered = notifications.filter((notif) => {
        if (filter === 'coupon') return notif.title.includes('Mã giảm giá mới');
        if (filter === 'post') return notif.title.includes('Bài viết mới');
        if (filter === 'product') return notif.title.includes('Sản phẩm mới');
        if (filter === 'comment') return notif.title.includes('Bình luận mới') || notif.title.includes('Phản hồi mới');
        if (filter === 'order') return notif.title.includes('Đơn hàng mới');
        return true;
      });
    }
    setFilteredNotifications(filtered);
    setPage(1);
  }, [notifications, filter]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getNotifications();
      setNotifications(response.data);
    } catch (err) {
      setError('Không thể tải thông báo. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await markNotificationAsRead(id);
      setNotifications(notifications.map(notif => 
        notif.id === id ? { ...notif, isRead: 1 } : notif
      ));
    } catch (err) {
      setError('Không thể đánh dấu đã đọc. Vui lòng thử lại.');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const unreadNotifs = filteredNotifications.filter(notif => !notif.isRead);
      for (const notif of unreadNotifs) {
        await markNotificationAsRead(notif.id);
      }
      setNotifications(notifications.map(notif => 
        unreadNotifs.find(n => n.id === notif.id) ? { ...notif, isRead: 1 } : notif
      ));
    } catch (err) {
      setError('Không thể đánh dấu tất cả đã đọc. Vui lòng thử lại.');
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteNotification(id);
      setNotifications(notifications.filter(notif => notif.id !== id));
    } catch (err) {
      setError('Không thể xóa thông báo. Vui lòng thử lại.');
    }
  };

  // Cập nhật hàm getAdjustedLink để khớp với route thực tế
  const getAdjustedLink = (notif) => {
    if (user.role !== 'admin') {
      return notif.link; // User giữ nguyên link
    }

    // Admin: Điều chỉnh link dựa trên loại thông báo
    if (notif.title.includes('Mã giảm giá mới')) {
      return '/admin/quan-ly-ma-giam-gia';
    }
    if (notif.title.includes('Sản phẩm mới')) {
      const id = notif.link.split('/').pop(); // Lấy ID từ link gốc (VD: /san-pham/123 → 123)
      return `/admin/sua-san-pham/${id}`; // Sửa thành route thực tế
    }
    if (notif.title.includes('Bài viết mới') || notif.title.includes('Bình luận mới') || notif.title.includes('Phản hồi mới')) {
      return '/admin/quan-ly-bai-viet'; // Điều hướng đến danh sách bài viết
    }
    if (notif.title.includes('Đơn hàng mới')) {
      return '/admin/quan-ly-don-hang'; // Điều hướng đến danh sách đơn hàng
    }
    return notif.link; // Mặc định giữ nguyên nếu không khớp
  };

  const totalPages = Math.ceil(filteredNotifications.length / itemsPerPage);
  const paginatedNotifications = filteredNotifications.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center bg-red-50 p-8 rounded-lg shadow">
          <p className="text-xl text-red-600 font-medium">
            Vui lòng <Link to="/dang-nhap" className="text-blue-600 hover:underline">đăng nhập</Link> để xem thông báo.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xl font-semibold text-gray-700">Đang tải thông báo...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center bg-red-50 p-8 rounded-lg shadow">
          <p className="text-xl text-red-600 font-medium">{error}</p>
          <button 
            onClick={fetchNotifications}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 px-4">
      <Helmet>
        <title>Thông Báo - Thời Trang XYZ</title>
      </Helmet>

      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2 text-center">
          Thông Báo
        </h1>
        <p className="text-gray-600 text-center">
          Các thông báo mới nhất từ Thời Trang XYZ
        </p>
      </header>

      <div className="flex justify-between items-center mb-6">
        <div className="flex space-x-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg ${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'} hover:bg-blue-500 hover:text-white transition-colors`}
          >
            Tất cả
          </button>
          <button
            onClick={() => setFilter('coupon')}
            className={`px-4 py-2 rounded-lg ${filter === 'coupon' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'} hover:bg-blue-500 hover:text-white transition-colors`}
          >
            Mã giảm giá
          </button>
          <button
            onClick={() => setFilter('post')}
            className={`px-4 py-2 rounded-lg ${filter === 'post' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'} hover:bg-blue-500 hover:text-white transition-colors`}
          >
            Bài viết
          </button>
          <button
            onClick={() => setFilter('product')}
            className={`px-4 py-2 rounded-lg ${filter === 'product' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'} hover:bg-blue-500 hover:text-white transition-colors`}
          >
            Sản phẩm
          </button>
          <button
            onClick={() => setFilter('comment')}
            className={`px-4 py-2 rounded-lg ${filter === 'comment' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'} hover:bg-blue-500 hover:text-white transition-colors`}
          >
            Bình luận
          </button>
          <button
            onClick={() => setFilter('order')}
            className={`px-4 py-2 rounded-lg ${filter === 'order' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'} hover:bg-blue-500 hover:text-white transition-colors`}
          >
            Đơn hàng
          </button>
        </div>
        {filteredNotifications.some(notif => !notif.isRead) && (
          <button
            onClick={handleMarkAllAsRead}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <CheckSquare size={20} />
            <span>Đánh dấu tất cả đã đọc</span>
          </button>
        )}
      </div>

      {filteredNotifications.length === 0 ? (
        <div className="text-center bg-gray-50 p-8 rounded-lg shadow">
          <Bell className="mx-auto text-gray-400" size={48} />
          <p className="text-lg text-gray-600 mt-4">Bạn chưa có thông báo nào.</p>
          <Link to="/" className="text-blue-600 hover:underline mt-2 inline-block">
            Quay lại trang chủ
          </Link>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {paginatedNotifications.map((notif) => {
              console.log(`[NotificationsPage] Rendering notification:`, {
                id: notif.id,
                title: notif.title,
                link: notif.link,
                adjustedLink: getAdjustedLink(notif),
                userRole: user.role,
              });
              return (
                <div
                  key={notif.id}
                  className={`p-4 rounded-lg shadow flex items-start space-x-4 ${
                    notif.isRead ? 'bg-gray-100' : 'bg-white border-l-4 border-blue-500'
                  }`}
                >
                  <Bell className={`flex-shrink-0 ${notif.isRead ? 'text-gray-400' : 'text-blue-500'}`} size={24} />
                  <div className="flex-grow">
                    <h3 className={`font-semibold ${notif.isRead ? 'text-gray-600' : 'text-gray-800'}`}>
                      {notif.title}
                    </h3>
                    <p className="text-gray-600 mt-1">
                      {notif.message}
                      {notif.link && (
                        <Link to={getAdjustedLink(notif)} className="text-blue-600 hover:underline ml-1">
                          Xem ngay
                        </Link>
                      )}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      {new Date(notif.createdAt).toLocaleString('vi-VN')}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    {!notif.isRead && (
                      <button
                        onClick={() => handleMarkAsRead(notif.id)}
                        className="text-green-500 hover:text-green-700"
                        title="Đánh dấu đã đọc"
                      >
                        <CheckCircle size={20} />
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(notif.id)}
                      className="text-red-500 hover:text-red-700"
                      title="Xóa thông báo"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center items-center space-x-2 mt-6">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className="p-2 rounded-full bg-gray-200 text-gray-600 hover:bg-gray-300 disabled:opacity-50"
              >
                <ChevronLeft size={20} />
              </button>
              <span className="text-gray-700">
                Trang {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page === totalPages}
                className="p-2 rounded-full bg-gray-200 text-gray-600 hover:bg-gray-300 disabled:opacity-50"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default NotificationsPage;