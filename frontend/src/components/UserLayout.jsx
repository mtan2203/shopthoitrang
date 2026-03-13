import React, { useContext, useState, useRef, useEffect } from 'react';
import { Outlet, Navigate, Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { CartContext } from '../context/CartContext';
import { Search, Bell, ShoppingCart, Heart, User, LogOut, Menu, X, Settings } from 'lucide-react';
import { getNotifications } from '../services/api';
import ChatGPTWidget from './ChatGPTWidget';

const UserLayout = () => {
  const { user, logout, loading } = useContext(AuthContext);
  const { cart, removeFromCart } = useContext(CartContext);
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [miniCartOpen, setMiniCartOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const miniCartRef = useRef(null);
  const timeoutRef = useRef(null);

  useEffect(() => {
    if (user) {
      fetchUnreadNotifications();
    }
  }, [user]);

  const fetchUnreadNotifications = async () => {
    try {
      const response = await getNotifications();
      const unread = response.data.filter(notif => !notif.isRead).length;
      setUnreadCount(unread);
    } catch (err) {
      console.error('Lỗi lấy thông báo:', err);
    }
  };

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (miniCartRef.current && !miniCartRef.current.contains(event.target)) {
        setMiniCartOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setMiniCartOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setMiniCartOpen(false);
    }, 200);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-600"></div>
      </div>
    );
  }

  if (user && user.role === 'admin') {
    return <Navigate to="/admin" />;
  }

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/san-pham?search=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
      setIsMenuOpen(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/dang-nhap');
    setIsMenuOpen(false);
    setIsUserMenuOpen(false);
  };

  const handleRemoveFromCart = (productId, size, color) => {
    removeFromCart(productId, size, color);
  };

  const MiniCart = () => {
    if (!user || cart.length === 0) {
      return (
        <div className="p-4 text-center">
          {!user ? (
            <p>Vui lòng <Link to="/dang-nhap" className="text-blue-600 hover:underline" onClick={() => setMiniCartOpen(false)}>đăng nhập</Link> để xem giỏ hàng.</p>
          ) : (
            <p>Giỏ hàng trống. <Link to="/san-pham" className="text-blue-600 hover:underline" onClick={() => setMiniCartOpen(false)}>Mua sắm ngay!</Link></p>
          )}
        </div>
      );
    }

    return (
      <>
        <div className="max-h-64 overflow-y-auto">
          {cart.map((item) => (
            <div key={`mini-${item.productId}-${item.size}-${item.color}`} className="flex items-center p-2 border-b">
              <img src={item.image} alt={item.name} className="w-12 h-12 object-cover mr-2" />
              <div className="flex-grow">
                <p className="text-sm font-medium truncate">{item.name}</p>
                <p className="text-xs text-gray-500">Size: {item.size}, Màu: {item.color}</p>
                <div className="flex justify-between">
                  <span className="text-xs">{item.quantity} x {item.price.toLocaleString()} VNĐ</span>
                  <button 
                    onClick={() => handleRemoveFromCart(item.productId, item.size, item.color)}
                    className="text-red-500 hover:text-red-700 text-xs"
                  >
                    Xóa
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="p-3 border-t">
          <div className="flex justify-between font-medium mb-3">
            <span>Tổng cộng:</span>
            <span>{total.toLocaleString()} VNĐ</span>
          </div>
          <div className="flex gap-2">
            <Link 
              to="/gio-hang" 
              className="block w-full text-center bg-gray-200 hover:bg-gray-300 text-gray-800 px-3 py-2 rounded text-sm"
              onClick={() => setMiniCartOpen(false)}
            >
              Xem giỏ hàng
            </Link>
            <Link 
              to="/thanh-toan" 
              className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm"
              onClick={() => setMiniCartOpen(false)}
            >
              Thanh toán
            </Link>
          </div>
        </div>
      </>
    );
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Navbar */}
      <nav className="bg-blue-600 text-white shadow-lg sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="text-2xl font-bold">Thời Trang XYZ</Link>

          <div className="hidden md:flex items-center space-x-6">
            <Link to="/" className="hover:text-gray-200 transition">Trang chủ</Link>
            <Link to="/san-pham" className="hover:text-gray-200 transition">Sản phẩm</Link>
            <Link to="/ma-giam-gia" className="hover:text-gray-200 transition">Mã giảm giá</Link>
            <Link to="/gioi-thieu" className="hover:text-gray-200 transition">Giới thiệu</Link>
            <Link to="/lien-he" className="hover:text-gray-200 transition">Liên hệ</Link>
          </div>

          <div className="hidden md:flex items-center space-x-4">
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm sản phẩm..."
                className="pl-10 pr-4 py-2 rounded-full bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <Search className="absolute left-3 top-2.5 text-gray-500" size={20} />
            </form>
            <Link to="/thong-bao" className="relative hover:text-gray-200">
              <Bell size={24} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full px-1.5 text-xs">{unreadCount}</span>
              )}
            </Link>

            <div 
              className="relative" 
              ref={miniCartRef} 
              onMouseEnter={handleMouseEnter} 
              onMouseLeave={handleMouseLeave}
            >
              <button className="relative hover:text-gray-200">
                <ShoppingCart size={24} />
                {cartItemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full px-1.5 text-xs">{cartItemCount}</span>
                )}
              </button>
              
              {miniCartOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white text-gray-800 rounded-lg shadow-lg z-50">
                  <div className="p-3 border-b bg-gray-100 flex justify-between items-center">
                    <h3 className="font-medium">Giỏ Hàng ({cartItemCount})</h3>
                    <button onClick={() => setMiniCartOpen(false)} className="text-gray-500 hover:text-gray-700">
                      <X size={18} />
                    </button>
                  </div>
                  <MiniCart />
                </div>
              )}
            </div>

            <Link to="/yeu-thich" className="hover:text-gray-200">
              <Heart size={24} />
            </Link>

            {user ? (
              <div className="relative">
                <button 
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center space-x-2 hover:text-gray-200"
                >
                  <User size={24} />
                  <span>{user.username}</span>
                </button>
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white text-gray-800 rounded-lg shadow-lg transition-opacity duration-300">
                    <Link 
                      to="/thong-tin-tai-khoan" 
                      className="block px-4 py-2 hover:bg-gray-100"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      Thông tin tài khoản
                    </Link>
                    <Link 
                      to="/don-hang" 
                      className="block px-4 py-2 hover:bg-gray-100"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      Đơn hàng
                    </Link>
                    <Link 
                      to="/thong-bao" 
                      className="block px-4 py-2 hover:bg-gray-100"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      Thông báo
                    </Link>
                    <button 
                      onClick={handleLogout} 
                      className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center space-x-2"
                    >
                      <LogOut size={16} />
                      <span>Đăng xuất</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link to="/dang-nhap" className="hover:text-gray-200">Đăng nhập</Link>
                <Link to="/dang-ky" className="hover:text-gray-200">Đăng ký</Link>
              </>
            )}
          </div>

          <button className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {isMenuOpen && (
          <div className="md:hidden bg-blue-700 px-4 py-4">
            <div className="flex flex-col space-y-2">
              <Link to="/" className="hover:text-gray-200 py-2" onClick={() => setIsMenuOpen(false)}>Trang chủ</Link>
              <Link to="/san-pham" className="hover:text-gray-200 py-2" onClick={() => setIsMenuOpen(false)}>Sản phẩm</Link>
              <Link to="/ma-giam-gia" className="hover:text-gray-200 py-2" onClick={() => setIsMenuOpen(false)}>Mã giảm giá</Link>
              <Link to="/gioi-thieu" className="hover:text-gray-200 py-2" onClick={() => setIsMenuOpen(false)}>Giới thiệu</Link>
              <Link to="/lien-he" className="hover:text-gray-200 py-2" onClick={() => setIsMenuOpen(false)}>Liên hệ</Link>
              <form onSubmit={handleSearch} className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm kiếm sản phẩm..."
                  className="w-full pl-10 pr-4 py-2 rounded-full bg-white text-gray-800 focus:outline-none"
                />
                <Search className="absolute left-3 top-2.5 text-gray-500" size={20} />
              </form>
              <Link to="/thong-bao" className="relative text-left hover:text-gray-200 py-2 flex items-center space-x-2" onClick={() => setIsMenuOpen(false)}>
                <Bell size={20} />
                <span>Thông báo</span>
                {unreadCount > 0 && (
                  <span className="bg-red-500 text-white rounded-full px-1.5 text-xs">{unreadCount}</span>
                )}
              </Link>
              <Link to="/gio-hang" className="hover:text-gray-200 py-2 flex items-center space-x-2" onClick={() => setIsMenuOpen(false)}>
                <ShoppingCart size={20} />
                <span>Giỏ hàng</span>
                {cartItemCount > 0 && (
                  <span className="bg-red-500 text-white rounded-full px-1.5 text-xs">{cartItemCount}</span>
                )}
              </Link>
              <Link to="/yeu-thich" className="hover:text-gray-200 py-2 flex items-center space-x-2" onClick={() => setIsMenuOpen(false)}>
                <Heart size={20} />
                <span>Yêu thích</span>
              </Link>
              {user ? (
                <>
                  <Link to="/thong-tin-tai-khoan" className="hover:text-gray-200 py-2" onClick={() => setIsMenuOpen(false)}>Thông tin tài khoản</Link>
                  <Link to="/don-hang" className="hover:text-gray-200 py-2" onClick={() => setIsMenuOpen(false)}>Đơn hàng</Link>
                  <Link to="/thong-bao" className="hover:text-gray-200 py-2" onClick={() => setIsMenuOpen(false)}>Thông báo</Link>
                  <button onClick={handleLogout} className="text-left hover:text-gray-200 py-2 flex items-center space-x-2">
                    <LogOut size={20} />
                    <span>Đăng xuất</span>
                  </button>
                </>
              ) : (
                <>
                  <Link to="/dang-nhap" className="hover:text-gray-200 py-2" onClick={() => setIsMenuOpen(false)}>Đăng nhập</Link>
                  <Link to="/dang-ky" className="hover:text-gray-200 py-2" onClick={() => setIsMenuOpen(false)}>Đăng ký</Link>
                </>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Main content */}
      <main className="flex-grow">
        <Outlet />
      </main>
      <ChatGPTWidget />
    </div>
  );
};

export default UserLayout;