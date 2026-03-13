import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import UserLayout from './components/UserLayout';
import AdminLayout from './components/AdminLayout';
import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import About from './pages/About';
import Contact from './pages/Contact';
import OrderDetail from './pages/OrderDetail';
import Orders from './pages/Orders';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminStats from './pages/admin/AdminStats';
import AddProduct from './pages/admin/AddProduct';
import EditProduct from './pages/admin/EditProduct';
import ManageOrders from './pages/admin/ManageOrders';
import ManageCategories from './pages/admin/ManageCategories';
import ManageCoupons from './pages/admin/ManageCoupons';
import ManageUsers from './pages/admin/ManageUsers';
import ManagePosts from './pages/admin/ManagePosts';
import ImportStockPage from './pages/admin/ImportStockPage';
import TwoFactorSetup from './pages/admin/TwoFactorSetup'; 
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Wishlist from './pages/Wishlist';
import ReviewPage from './pages/ReviewPage';
import PostDetail from './pages/PostDetail';
import DiscountPage from './pages/DiscountPage';
import MoMoReturn from './pages/MoMoReturn';
import QRCodeGenerator from './pages/admin/QRCodeGenerator';
import VNPayReturn from './pages/VNPayReturn'; // Thêm import này
import NotificationsPage from './pages/NotificationsPage';
import AccountInfo from './pages/AccountInfo';
import UpdateInfo from './pages/UpdateInfo';
import { HelmetProvider } from 'react-helmet-async';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import AdminProductDetail from './pages/admin/AdminProductDetail';

const GOOGLE_CLIENT_ID = '741537137809-hr2g9hkvha16n049ruvrsbka63p0bt1g.apps.googleusercontent.com';

const App = () => {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <HelmetProvider>
        <AuthProvider>
          <CartProvider>
            <Router>
              <div className="flex flex-col min-h-screen">
                <Routes>
                  {/* Routes cho user */}
                  <Route element={<UserLayout />}>
                    <Route path="/" element={<Home />} />
                    <Route path="/san-pham" element={<Products />} />
                    <Route path="/san-pham/:id" element={<ProductDetail />} />
                    <Route path="/gio-hang" element={<Cart />} />
                    <Route path="/thanh-toan" element={<Checkout />} />
                    <Route path="/gioi-thieu" element={<About />} />
                    <Route path="/lien-he" element={<Contact />} />
                    <Route path="/don-hang" element={<Orders />} />
                    <Route path="/don-hang/:id" element={<OrderDetail />} />
                    <Route path="/danh-gia/:orderId" element={<ReviewPage />} />
                    <Route path="/yeu-thich" element={<Wishlist />} />
                    <Route path="/bai-viet/:id" element={<PostDetail />} />
                    <Route path="/thanh-toan/momo-return" element={<MoMoReturn />} />
                    <Route path="/thanh-toan/vnpay-return" element={<VNPayReturn />} />
                    <Route path="/ma-giam-gia" element={<DiscountPage />} />
                    <Route path="/thong-bao" element={<NotificationsPage />} />
                    <Route path="/thong-tin-tai-khoan" element={<AccountInfo />} />
                    {/* <Route path="/cap-nhat-thong-tin" element={<UpdateInfo />} /> */}
                  </Route>

                  {/* Routes cho admin */}
                  <Route element={<AdminLayout />}>
                    <Route path="/admin" element={<AdminDashboard />} />
                    <Route path="/admin/thong-ke" element={<AdminStats />} />
                    <Route path="/admin/them-san-pham" element={<AddProduct />} />
                    <Route path="/admin/sua-san-pham/:id" element={<EditProduct />} />
                    <Route path="/admin/quan-ly-don-hang" element={<ManageOrders />} />
                    <Route path="/admin/quan-ly-danh-muc" element={<ManageCategories />} />
                    <Route path="/admin/quan-ly-ma-giam-gia" element={<ManageCoupons />} />
                    <Route path="/admin/quan-ly-nguoi-dung" element={<ManageUsers />} />
                    <Route path="/admin/quan-ly-bai-viet" element={<ManagePosts />} />
                    <Route path="/admin/thong-bao" element={<NotificationsPage />} />
                    <Route path="/admin/import-stock" element={<ImportStockPage />} />
                    <Route path="/admin/xac-thuc-hai-lop" element={<TwoFactorSetup />} />
                    <Route path="/admin/san-pham/:id" element={<AdminProductDetail />} />
                    <Route path="/admin/tao-qr" element={<QRCodeGenerator />} />
                  </Route>

                  {/* Routes không cần layout */}
                  <Route path="/dang-nhap" element={<Login />} />
                  <Route path="/dang-ky" element={<Register />} />
                  <Route path="/quen-mat-khau" element={<ForgotPassword />} />
                </Routes>
                <ToastContainer />
              </div>
            </Router>
          </CartProvider>
        </AuthProvider>
      </HelmetProvider>
    </GoogleOAuthProvider>
  );
};

export default App;