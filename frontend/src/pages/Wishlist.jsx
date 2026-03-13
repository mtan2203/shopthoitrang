// Import React và các hook cần dùng
import React, { useState, useEffect } from 'react';

// Helmet để đổi tiêu đề tab trình duyệt
import { Helmet } from 'react-helmet-async';

// Import 2 hàm gọi API: lấy danh sách yêu thích, xóa sản phẩm khỏi yêu thích
import { getWishlist, removeFromWishlist } from '../services/api';

// Toast để hiển thị thông báo popup (success, error)
import { toast } from 'react-toastify';

// Dùng để chuyển trang (navigate) và tạo link
import { useNavigate, Link } from 'react-router-dom';

// Icon trái tim
import { Heart } from 'lucide-react';

// Component chính của trang
const Wishlist = () => {
  // Khai báo state danh sách sản phẩm yêu thích
  const [wishlist, setWishlist] = useState([]);

  // State để biết đang loading hay chưa
  const [loading, setLoading] = useState(true);

  // Dùng để điều hướng trang (VD: chuyển sang đăng nhập nếu chưa đăng nhập)
  const navigate = useNavigate();

  // Khi component này được load lần đầu tiên
  useEffect(() => {
    // Lấy token từ localStorage
    const token = localStorage.getItem('token');

    // Nếu chưa có token, tức là chưa đăng nhập
    if (!token) {
      toast.error('Bạn cần đăng nhập để xem danh sách yêu thích');
      navigate('/dang-nhap'); // Chuyển về trang đăng nhập
      return;
    }

    // Nếu có token → gọi hàm lấy dữ liệu yêu thích
    fetchWishlist();
  }, [navigate]);

  // Hàm lấy dữ liệu danh sách yêu thích từ API
  const fetchWishlist = async () => {
    try {
      setLoading(true); // Đang tải dữ liệu

      const res = await getWishlist(); // Gọi API

      console.log('[Wishlist] Fetched wishlist:', res.data); // Log ra để debug

      // Lưu danh sách vào state
      setWishlist(res.data.wishlist);
    } catch (err) {
      // Nếu lỗi 401 (chưa đăng nhập), chuyển về trang đăng nhập
      if (err.response?.status === 401) {
        toast.error('Bạn cần đăng nhập để xem danh sách yêu thích');
        navigate('/dang-nhap');
      } else {
        // Lỗi khác → hiện thông báo
        console.error('[Wishlist] Error fetching wishlist:', err.response?.data?.message || err.message);
        toast.error('Không thể tải danh sách yêu thích');
      }
    } finally {
      setLoading(false); // Dừng loading
    }
  };

  // Xử lý khi người dùng muốn xóa 1 sản phẩm khỏi danh sách yêu thích
  const handleRemoveFromWishlist = async (productId) => {
    try {
      // Xóa tạm thời trên UI
      setWishlist((prev) => prev.filter((item) => item.id !== productId));

      // Gọi API để xóa thật
      await removeFromWishlist(productId);

      // Hiện thông báo thành công
      toast.success('Đã xóa khỏi danh sách yêu thích');
    } catch (err) {
      console.error('[Wishlist] Error removing from wishlist:', err.response?.data?.message || err.message);
      toast.error('Có lỗi xảy ra khi xóa khỏi yêu thích');

      // Nếu lỗi → tải lại danh sách
      fetchWishlist();
    }
  };

  // Component SkeletonCard hiển thị loading giả
  const SkeletonCard = () => (
    <div className="bg-white rounded-lg overflow-hidden shadow-sm animate-pulse">
      <div className="w-full h-72 bg-gray-200"></div>
      <div className="p-4 space-y-3">
        <div className="h-6 bg-gray-200 rounded w-3/4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        <div className="h-10 bg-gray-200 rounded"></div>
      </div>
    </div>
  );

  // Giao diện JSX trả về
  return (
    <div className="container mx-auto py-12 px-4">
      {/* Thay đổi tiêu đề trang */}
      <Helmet>
        <title>Danh sách yêu thích - Thời Trang XYZ</title>
        <meta name="description" content="Danh sách sản phẩm yêu thích của bạn tại XYZ" />
      </Helmet>

      <h1 className="text-3xl font-semibold mb-8 text-center">Danh sách yêu thích</h1>

      {/* Nếu đang loading → hiển thị khung giả */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {Array(4)
            .fill()
            .map((_, index) => (
              <SkeletonCard key={index} />
            ))}
        </div>
      ) : wishlist.length === 0 ? (
        // Nếu không có sản phẩm nào
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">Bạn chưa có sản phẩm nào trong danh sách yêu thích</p>
          <Link
            to="/san-pham"
            className="bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700"
          >
            Khám phá sản phẩm
          </Link>
        </div>
      ) : (
        // Nếu có danh sách → hiển thị sản phẩm yêu thích
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {wishlist.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300 border border-gray-100 relative group"
            >
              <div className="relative overflow-hidden">
                <img
                  src={item.image || '/images/product-placeholder.jpg'} // Ảnh sản phẩm
                  alt={item.name}
                  className="w-full h-72 object-cover object-center transition-transform duration-500 group-hover:scale-105"
                  onError={(e) => {
                    e.target.src = '/images/product-placeholder.jpg'; // Nếu ảnh lỗi thì dùng ảnh mặc định
                  }}
                />
                {/* Nút xóa khỏi yêu thích */}
                <button
                  onClick={() => handleRemoveFromWishlist(item.id)}
                  className="absolute top-3 right-3 p-2 rounded-full bg-white/80 backdrop-blur-sm shadow-md hover:bg-red-50 transition text-red-500"
                  aria-label="Xóa khỏi yêu thích"
                >
                  <Heart size={20} fill="currentColor" />
                </button>
              </div>

              {/* Thông tin sản phẩm */}
              <div className="p-4">
                <h3
                  className="font-medium text-gray-900 mb-1 line-clamp-2"
                  title={item.name}
                >
                  {item.name}
                </h3>

                {/* Hiển thị giá theo kiểu tiền tệ VN */}
                <p className="text-lg font-semibold text-gray-800 mb-3">
                  {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.price)}
                </p>

                {/* Nút xem chi tiết */}
                <Link
                  to={`/san-pham/${item.id}`}
                  className="w-full inline-block text-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors"
                >
                  Xem chi tiết
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Wishlist;
