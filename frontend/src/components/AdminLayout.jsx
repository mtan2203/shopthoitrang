import React, { useContext, useState, useEffect } from 'react';
import { Outlet, Navigate, Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { 
  Search, 
  Bell, 
  LogOut, 
  Menu, 
  X, 
  Home, 
  Package, 
  ShoppingBag, 
  Users, 
  Tag, 
  FileText, 
  BarChart2, 
  Layers,
  ChevronRight,
  ChevronDown,
  HelpCircle,
  Plus,
  Upload,
  Lock // Thêm icon Lock
} from 'lucide-react';
import { getNotifications } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';

const AdminLayout = () => {
  const { user, logout, loading } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [productMenuOpen, setProductMenuOpen] = useState(false);

  useEffect(() => {
    if (user) {
      fetchUnreadNotifications();
    }
    
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };
    
    window.addEventListener('resize', handleResize);
    handleResize();
    
    return () => window.removeEventListener('resize', handleResize);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-600"></div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return <Navigate to="/" />;
  }

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/admin/quan-ly-don-hang?search=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
      setIsMenuOpen(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/dang-nhap');
    setIsMenuOpen(false);
  };

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  const navItems = [
    { path: '/admin', label: 'Bảng điều khiển', icon: <Home size={20} /> },
    { path: '/admin/them-san-pham', label: 'Thêm Sản phẩm', icon: <Package size={20} />,},
    { path: '/admin/thong-ke', label: 'Thống kê', icon: <BarChart2 size={20} /> },
    { path: '/admin/quan-ly-danh-muc', label: 'Danh mục', icon: <Layers size={20} /> },
    { path: '/admin/quan-ly-don-hang', label: 'Đơn hàng', icon: <ShoppingBag size={20} /> }, 
    { path: '/admin/quan-ly-nguoi-dung', label: 'Người dùng', icon: <Users size={20} /> },
    { path: '/admin/quan-ly-ma-giam-gia', label: 'Mã giảm giá', icon: <Tag size={20} /> },
    { path: '/admin/quan-ly-bai-viet', label: 'Bài viết', icon: <FileText size={20} /> },
    { path: '/admin/import-stock', label: 'Import Số Lượng Tồn', icon: <Upload size={20} /> },
    { path: '/admin/xac-thuc-hai-lop', label: 'Bảo mật hai lớp', icon: <Lock size={20} /> }, // Thêm menu mới
    { path: '/admin/tao-qr', label: 'Tạo mã QR', icon: <Plus size={20} /> },
  ];

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-indigo-50">
      {/* Backdrop overlay for mobile */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-gray-800 bg-opacity-50 z-10 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar for desktop */}
      <motion.aside
        initial={{ x: -280 }}
        animate={{ x: sidebarOpen ? 0 : -280 }}
        transition={{ duration: 0.3 }}
        className={`bg-gradient-to-b from-indigo-900 via-indigo-800 to-blue-900 fixed z-20 inset-y-0 left-0 lg:relative shadow-xl flex flex-col`} 
        style={{ width: '280px' }}
      >
        {/* Logo and brand */}
        <div className="px-6 py-6 flex items-center justify-between border-b border-indigo-700">
          <Link to="/admin" className="flex items-center space-x-2 group">
            <motion.div
              whileHover={{ scale: 1.05, rotate: 5 }}
              className="w-10 h-10 rounded-lg bg-white flex items-center justify-center shadow-lg"
            >
              <span className="text-indigo-700 font-bold text-xl">X</span>
            </motion.div>
            <span className="text-xl font-bold text-white">XYZ Admin</span>
          </Link>
          <button 
            className="lg:hidden text-white hover:text-indigo-200 transition-colors" 
            onClick={() => setSidebarOpen(false)}
          >
            <X size={24} />
          </button>
        </div>

        {/* User info */}
        <div className="px-6 py-5 border-b border-indigo-700">
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="flex items-center space-x-3"
          >
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-indigo-500 to-blue-500 flex items-center justify-center shadow-md">
              <span className="text-white font-medium text-lg">{user?.name?.charAt(0) || 'A'}</span>
            </div>
            <div>
              <p className="font-medium text-white">{user?.name || 'Admin'}</p>
              <p className="text-xs text-indigo-200">{user?.email || 'admin@example.com'}</p>
            </div>
          </motion.div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 overflow-y-auto scrollbar-thin scrollbar-thumb-indigo-600 scrollbar-track-transparent">
          <ul className="space-y-2">
            {navItems.map((item) => (
              <li key={item.path}>
                {item.submenu ? (
                  <>
                    <button
                      onClick={() => setProductMenuOpen(!productMenuOpen)}
                      className={`flex items-center w-full space-x-3 px-4 py-3.5 rounded-xl transition-all duration-200 ${
                        isActive(item.path) || item.submenu.some(sub => isActive(sub.path))
                          ? 'bg-indigo-500 text-white shadow-lg transform translate-x-1'
                          : 'text-indigo-100 hover:bg-indigo-700 hover:text-white'
                      }`}
                    >
                      <span className="text-indigo-300">{item.icon}</span>
                      <span>{item.label}</span>
                      <motion.span
                        animate={{ rotate: productMenuOpen ? 90 : 0 }}
                        transition={{ duration: 0.2 }}
                        className="ml-auto"
                      >
                        <ChevronRight size={16} className="text-white" />
                      </motion.span>
                    </button>
                    <AnimatePresence>
                      {productMenuOpen && (
                        <motion.ul
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="ml-8 mt-2 space-y-1"
                        >
                          {item.submenu.map((subItem) => (
                            <li key={subItem.path}>
                              <Link
                                to={subItem.path}
                                className={`flex items-center space-x-3 px-4 py-2 rounded-xl transition-all duration-200 ${
                                  isActive(subItem.path)
                                    ? 'bg-indigo-500 text-white shadow-sm'
                                    : 'text-indigo-200 hover:bg-indigo-600 hover:text-white'
                                }`}
                              >
                                <span className="text-indigo-300">{subItem.icon}</span>
                                <span>{subItem.label}</span>
                              </Link>
                            </li>
                          ))}
                        </motion.ul>
                      )}
                    </AnimatePresence>
                  </>
                ) : (
                  <Link
                    to={item.path}
                    className={`flex items-center space-x-3 px-4 py-3.5 rounded-xl transition-all duration-200 ${
                      isActive(item.path)
                        ? 'bg-indigo-500 text-white shadow-lg transform translate-x-1'
                        : 'text-indigo-100 hover:bg-indigo-700 hover:text-white'
                    }`}
                  >
                    <span className="text-indigo-300">{item.icon}</span>
                    <span>{item.label}</span>
                    {isActive(item.path) && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="ml-auto"
                      >
                        <ChevronRight size={16} className="text-white" />
                      </motion.span>
                    )}
                  </Link>
                )}
              </li>
            ))}
          </ul>

          <div className="mt-12 pt-6 border-t border-indigo-700/50">
            <Link 
              to="/admin/huong-dan" 
              className="flex items-center space-x-3 px-4 py-3.5 rounded-xl text-indigo-100 hover:bg-indigo-700 hover:text-white transition-all duration-200 hover:translate-x-1"
            >
              <HelpCircle size={20} className="text-indigo-300" />
              <span>Hướng dẫn</span>
            </Link>
            <button 
              onClick={handleLogout} 
              className="w-full mt-3 flex items-center space-x-3 px-4 py-3.5 rounded-xl text-indigo-100 hover:bg-indigo-700 hover:text-white transition-all duration-200 hover:translate-x-1"
            >
              <LogOut size={20} className="text-indigo-300" />
              <span>Đăng xuất</span>
            </button>
          </div>
        </nav>
      </motion.aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top navbar */}
        <header className="bg-white shadow-md z-10">
          <div className="px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
            <div className="flex items-center">
              <button 
                className="lg:hidden mr-4 text-indigo-700 hover:text-indigo-900 transition-colors"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                <Menu size={24} />
              </button>
              
              <h1 className="text-xl font-semibold text-gray-800 flex items-center">
                <span className="text-indigo-600 mr-2">
                  {navItems.find(item => isActive(item.path))?.icon || <BarChart2 size={24} />}
                </span>
                {navItems.find(item => isActive(item.path))?.label || 'Bảng điều khiển'}
              </h1>
            </div>
            
            <div className="flex items-center space-x-5">
              <form onSubmit={handleSearch} className="hidden md:block relative group">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm kiếm đơn hàng..."
                  className="pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 w-64 transition-all duration-300 group-hover:shadow-md"
                />
                <Search className="absolute left-3 top-2.5 text-gray-400 group-hover:text-indigo-500 transition-colors duration-300" size={20} />
              </form>
              
              <Link 
                to="/admin/thong-bao" 
                className="relative text-indigo-700 hover:text-indigo-900 transition-all duration-300 hover:scale-110"
              >
                <motion.div whileHover={{ rotate: 10 }}>
                  <Bell size={22} />
                </motion.div>
                {unreadCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs animate-pulse"
                  >
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </motion.span>
                )}
              </Link>
              
              <motion.div 
                whileHover={{ scale: 1.05 }}
                className="hidden md:flex items-center space-x-2"
              >
                <div className="w-9 h-9 rounded-full bg-gradient-to-r from-indigo-600 to-blue-500 flex items-center justify-center shadow-md">
                  <span className="text-white font-medium">{user?.name?.charAt(0) || 'A'}</span>
                </div>
                <span className="text-gray-700">{user?.name || 'Admin'}</span>
              </motion.div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-gradient-to-br from-indigo-50 to-blue-100 p-4 sm:p-6 lg:p-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-xl shadow-lg p-6 min-h-[calc(100%-2rem)]"
          >
            <Outlet />
          </motion.div>
        </main>
        
        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 py-4">
          <div className="px-4 sm:px-6 lg:px-8 text-center">
            <p className="text-sm text-indigo-600">© {new Date().getFullYear()} Thời Trang XYZ. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default AdminLayout;