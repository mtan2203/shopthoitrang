import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import { Helmet } from 'react-helmet-async';
import { toast } from 'react-toastify';
import { Minus, Plus, X, ArrowLeft, ShoppingBag } from 'lucide-react';

const Cart = () => {
  const { cart, updateQuantity, removeFromCart, clearCart } = useContext(CartContext);
  const { user } = useContext(AuthContext);

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleUpdateQuantity = (productId, quantity, size, color) => {
    if (quantity < 1) {
      toast.error('Số lượng phải lớn hơn 0');
      return;
    }
    updateQuantity(productId, quantity, size, color);
  };

  const handleRemove = (productId, size, color) => {
    if (window.confirm('Bạn có chắc muốn xóa sản phẩm này khỏi giỏ hàng?')) {
      removeFromCart(productId, size, color);
    }
  };

  const handleClearCart = () => {
    if (window.confirm('Bạn có chắc muốn xóa toàn bộ giỏ hàng?')) {
      clearCart();
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <Helmet>
            <title>Giỏ Hàng - Thời Trang XYZ</title>
          </Helmet>
          <div className="max-w-md mx-auto bg-white rounded-2xl shadow-lg p-8 text-center">
            <ShoppingBag className="mx-auto mb-4 text-gray-400" size={64} />
            <h1 className="text-2xl font-bold text-gray-800 mb-4">Giỏ Hàng</h1>
            <p className="text-gray-600 mb-6">
              Vui lòng đăng nhập để xem giỏ hàng của bạn
            </p>
            <Link
              to="/dang-nhap"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Đăng Nhập
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <Helmet>
          <title>Giỏ Hàng - Thời Trang XYZ</title>
        </Helmet>

        {/* Header */}
        <div className="mb-8">
          <Link
            to="/san-pham"
            className="inline-flex items-center text-gray-600 hover:text-gray-800 mb-4 transition-colors"
          >
            <ArrowLeft size={20} className="mr-2" />
            Tiếp tục mua sắm
          </Link>
          <h1 className="text-3xl font-bold text-gray-800">Giỏ Hàng</h1>
          {cart.length > 0 && (
            <p className="text-gray-600 mt-2">{cart.length} sản phẩm</p>
          )}
        </div>

        {cart.length === 0 ? (
          <div className="max-w-md mx-auto bg-white rounded-2xl shadow-lg p-8 text-center">
            <ShoppingBag className="mx-auto mb-4 text-gray-400" size={64} />
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Giỏ hàng trống</h2>
            <p className="text-gray-600 mb-6">
              Hãy thêm một số sản phẩm vào giỏ hàng để bắt đầu mua sắm
            </p>
            <Link
              to="/san-pham"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Khám Phá Sản Phẩm
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold text-gray-800">Sản phẩm đã chọn</h2>
                    <button
                      onClick={handleClearCart}
                      className="text-red-600 hover:text-red-800 text-sm font-medium transition-colors"
                    >
                      Xóa tất cả
                    </button>
                  </div>
                </div>
                
                <div className="divide-y divide-gray-200">
                  {cart.map((item) => (
                    <div key={`${item.productId}-${item.size}-${item.color}`} className="p-6">
                      <div className="flex items-start space-x-4">
                        {/* Product Image */}
                        <div className="flex-shrink-0">
                          <img
                            src={item.image || 'https://via.placeholder.com/120x120'}
                            alt={item.name}
                            className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-lg"
                          />
                        </div>

                        {/* Product Details */}
                        <div className="flex-grow min-w-0">
                          <h3 className="text-lg font-semibold text-gray-800 mb-2 line-clamp-2">
                            {item.name}
                          </h3>
                          
                          <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-3">
                            <span className="bg-gray-100 px-2 py-1 rounded">
                              Kích cỡ: {item.size}
                            </span>
                            <span className="bg-gray-100 px-2 py-1 rounded">
                              Màu: {item.color}
                            </span>
                          </div>

                          <div className="flex items-center justify-between">
                            {/* Quantity Controls */}
                            <div className="flex items-center border border-gray-300 rounded-lg">
                              <button
                                onClick={() => handleUpdateQuantity(item.productId, item.quantity - 1, item.size, item.color)}
                                className="p-2 hover:bg-gray-100 transition-colors"
                                disabled={item.quantity <= 1}
                              >
                                <Minus size={16} className={item.quantity <= 1 ? 'text-gray-300' : 'text-gray-600'} />
                              </button>
                              <span className="px-4 py-2 min-w-[3rem] text-center font-medium">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => handleUpdateQuantity(item.productId, item.quantity + 1, item.size, item.color)}
                                className="p-2 hover:bg-gray-100 transition-colors"
                              >
                                <Plus size={16} className="text-gray-600" />
                              </button>
                            </div>

                            {/* Price */}
                            <div className="text-right">
                              <p className="text-lg font-semibold text-gray-800">
                                {(item.price * item.quantity).toLocaleString()} VNĐ
                              </p>
                              <p className="text-sm text-gray-500">
                                {item.price.toLocaleString()} VNĐ/sp
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Remove Button */}
                        <button
                          onClick={() => handleRemove(item.productId, item.size, item.color)}
                          className="flex-shrink-0 p-2 text-gray-400 hover:text-red-600 transition-colors"
                        >
                          <X size={20} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Cart Summary & Actions */}
            <div className="lg:col-span-1 space-y-6">
              {/* Order Summary */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-6">Tóm tắt giỏ hàng</h2>
                
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between text-gray-600">
                    <span>Số lượng sản phẩm</span>
                    <span className="font-semibold">{cart.length} sản phẩm</span>
                  </div>
                  
                  <div className="flex justify-between text-gray-600">
                    <span>Tổng số lượng</span>
                    <span className="font-semibold">{cart.reduce((sum, item) => sum + item.quantity, 0)} món</span>
                  </div>
                  
                  <div className="border-t border-gray-200 pt-4">
                    <div className="flex justify-between text-lg font-semibold text-gray-800">
                      <span>Tạm tính</span>
                      <span>{subtotal.toLocaleString()} VNĐ</span>
                    </div>
                  </div>
                </div>

                {/* Checkout Button */}
                <Link
                  to="/thanh-toan"
                  className="block w-full bg-blue-600 text-white text-center py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold text-lg mb-3"
                >
                  Tiến hành thanh toán
                </Link>
                
                <p className="text-xs text-gray-500 text-center">
                  Phí vận chuyển và thuế sẽ được tính ở trang thanh toán
                </p>
              </div>

              {/* Shopping Benefits */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Ưu đãi đặc biệt</h3>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">Miễn phí vận chuyển</p>
                      <p className="text-xs text-gray-600">Đơn hàng từ 500,000 VNĐ</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-3 h-3 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">Đổi trả trong 30 ngày</p>
                      <p className="text-xs text-gray-600">Miễn phí đổi trả toàn quốc</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-3 h-3 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">Tích điểm thành viên</p>
                      <p className="text-xs text-gray-600">Nhận điểm khi mua hàng</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;