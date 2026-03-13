import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom'; // Thêm useParams
import { AuthContext } from '../context/AuthContext';
import { CartContext } from '../context/CartContext';
import { createOrder, createMoMoPayment, createVNPayPayment, calculateShippingGHTK } from '../services/api';
import { toast } from 'react-toastify';
import { Helmet } from 'react-helmet-async';
  //
const Checkout = () => {
  const { user } = useContext(AuthContext);
  const { cart, clearCart, couponCode, discountAmount, applyCoupon, removeCoupon } = useContext(CartContext);
  const navigate = useNavigate();
  const location = useLocation();//Kiểm tra từ trang nào tới checkout.
  const { orderId } = useParams(); // Thêm để xử lý return URL

  const [formData, setFormData] = useState({
    fullName: user?.username || '',
    phoneNumber: '',
    email: user?.email || '',
    address: '',
    city: '',
    district: '',
    ward: '',
    notes: '',
  });

  const [inputCouponCode, setInputCouponCode] = useState(couponCode || '');
  const [couponMessage, setCouponMessage] = useState('');
  const [couponMessageType, setCouponMessageType] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [shippingFee, setShippingFee] = useState(30000);
  const [isShippingCalculated, setIsShippingCalculated] = useState(false);
  // Tính toán tổng tiền đơn hàng chưa bao gồm phí vận chuyển và giảm giá
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  // Tính toán tổng tiền đơn hàng sau khi áp dụng giảm giá
  const finalTotal = subtotal + shippingFee - discountAmount;

  useEffect(() => {
    const query = new URLSearchParams(location.search);
    const status = query.get('status');
    const message = query.get('message');

    if (status === 'error') {
      toast.error(message || 'Thanh toán thất bại');
    } else if (status === 'success' && orderId) {
      toast.success('Thanh toán thành công!');
      clearCart();
      navigate(`/don-hang/${orderId}`);
    }

    if (cart.length === 0) {
      navigate('/gio-hang');
      toast.info('Giỏ hàng trống, vui lòng thêm sản phẩm trước khi thanh toán');
    }
    console.log('[Checkout] Cart state:', cart);
  }, [cart, navigate, location, orderId]);

  const calculateShippingFee = async () => {
    console.log('[Checkout] Bắt đầu tính phí vận chuyển');
    if (!formData.city || !formData.address) {
      setShippingFee(30000);
      setIsShippingCalculated(true);
      toast.error('Vui lòng nhập tỉnh/thành phố và địa chỉ để tính phí vận chuyển chính xác');
      return;
    }
    //
    try {
      const shippingData = {
        city: formData.city,
        district: formData.district,
        ward: formData.ward,
        address: formData.address,
        orderValue: subtotal,
      };

      console.log('[Checkout] Dữ liệu gửi đi:', shippingData);
      // Gọi API tính phí vận chuyển
      const response = await calculateShippingGHTK(shippingData);
      console.log('[Checkout] Phản hồi từ API:', response);

      if (response.success === false) {
        throw new Error(response.message || 'Không thể tính phí vận chuyển');
      }
      const fee = response.total || 30000;
      setShippingFee(Number(fee));
      setIsShippingCalculated(true);
      toast.success(`Phí vận chuyển: ${fee.toLocaleString()} VNĐ`);
    } catch (err) {
      console.error('[Checkout] Lỗi tính phí vận chuyển:', err.response?.data || err.message || err);
      setShippingFee(30000);
      setIsShippingCalculated(true);
      toast.error('Lỗi khi tính phí vận chuyển, sử dụng giá mặc định 30,000 VNĐ');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const newFormData = {
        ...prev,
        [name]: value,
      };
      console.log('[Checkout] Form data updated:', newFormData);
      return newFormData;
    });
    if (name === 'city' && isShippingCalculated) {
      calculateShippingFee();// Tính lại phí vận chuyển khi thay đổi tỉnh/thành phố
    }
  };
  // Hàm này sẽ được gọi khi người dùng nhập mã giảm giá
  const handleApplyCoupon = async () => {
    if (!inputCouponCode.trim()) {
      setCouponMessage('Vui lòng nhập mã giảm giá');
      setCouponMessageType('error');
      return;
    }

    try {
      console.log('[Checkout] Áp dụng mã giảm giá:', { code: inputCouponCode, cartTotal: subtotal });
      const response = await applyCoupon(inputCouponCode, subtotal);
      console.log('[Checkout] Kết quả áp mã:', response);
      if (response.valid) {
        setCouponMessage(`Mã giảm giá đã được áp dụng! Bạn tiết kiệm ${response.discount_amount.toLocaleString()} VNĐ`);
        setCouponMessageType('success');
        setInputCouponCode('');
      } else {
        setCouponMessage(response.message);
        setCouponMessageType('error');
        removeCoupon();
      }
    } catch (err) {
      console.error('[Checkout] Lỗi áp mã giảm giá:', err.response?.data || err.message);
      setCouponMessage(err.response?.data?.message || 'Lỗi khi kiểm tra mã giảm giá');
      setCouponMessageType('error');
      removeCoupon();
    }
  };

  const handleRemoveCoupon = () => {
    removeCoupon();
    setCouponMessage('Mã giảm giá đã được xóa');
    setCouponMessageType('info');
    setInputCouponCode('');
  };

  const validateForm = () => {
    const requiredFields = ['fullName', 'phoneNumber', 'email', 'address', 'city'];
    
    for (const field of requiredFields) {
      if (!formData[field]?.trim()) {
        toast.error(`Vui lòng nhập ${getFieldLabel(field)}`);
        return false;
      }
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error('Email không hợp lệ');
      return false;
    }

    const phoneRegex = /^(0|\+84)[3|5|7|8|9][0-9]{8}$/;
    if (!phoneRegex.test(formData.phoneNumber)) {
      toast.error('Số điện thoại không hợp lệ');
      return false;
    }

    return true;
  };
  //
  const getFieldLabel = (field) => {
    const labels = {
      fullName: 'họ tên',
      phoneNumber: 'số điện thoại',
      email: 'email',
      address: 'địa chỉ',
      city: 'tỉnh/thành phố',
      district: 'quận/huyện',
      ward: 'phường/xã',
    };
    return labels[field] || field;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Vui lòng đăng nhập để đặt hàng');
      navigate('/dang-nhap');
      return;
    }
    
    if (!validateForm()) {
      return;
    }

    const fullAddress = `${formData.address}, ${formData.ward}, ${formData.district}, ${formData.city}`;
    
    const items = cart.map((item) => ({
      productId: Number(item.productId || item.id),
      quantity: Number(item.quantity),
      size: item.size || '',
      color: item.color || '',
    }));

    try {
      setIsProcessing(true);
      
      const orderData = {
        items,
        address: fullAddress,
        phone: formData.phoneNumber,
        email: formData.email,
        couponCode: couponCode || undefined,
        notes: formData.notes || undefined,
        paymentMethod: paymentMethod,
        shippingFee: shippingFee,
      };
      // Nhân gửi API trả về kết quả
      console.log('[Checkout] Gửi dữ liệu đặt hàng:', orderData);
      const response = await createOrder(orderData);
      console.log('[Checkout] Kết quả đặt hàng:', response.data);
      
      if (paymentMethod === 'momo') {
        const momoResponse = await createMoMoPayment(response.data.orderId);
        console.log('[Checkout] MoMo payment response:', momoResponse);
        if (momoResponse.payUrl) {
          window.location.href = momoResponse.payUrl;
        } else {
          throw new Error('Không thể tạo yêu cầu thanh toán MoMo');
        }
      } else if (paymentMethod === 'vnpay') {
        try {
          console.log('[Checkout] Tạo thanh toán VNPay:', { finalTotal, orderId: response.data.orderId });
          
          const vnpayResponse = await createVNPayPayment(finalTotal, response.data.orderId);
          console.log('[Checkout] VNPay payment response:', vnpayResponse);
          
          const paymentUrl = vnpayResponse.paymentUrl;
          if (paymentUrl) {
            toast.info('Đang chuyển hướng đến trang thanh toán VNPay...');
            setTimeout(() => {
              window.location.href = paymentUrl;
            }, 1000);
          } else {
            throw new Error('Không thể tạo liên kết thanh toán VNPay');
          }
        } catch (vnpayError) {
          console.error('[Checkout] Lỗi VNPay:', vnpayError);
          toast.error(`Đặt hàng thành công nhưng không thể tạo liên kết thanh toán VNPay: ${vnpayError.message}`);
          toast.info('Bạn có thể thanh toán sau hoặc chọn phương thức thanh toán khác');
          clearCart();
          navigate(`/don-hang/${response.data.orderId}`);
        }
      } else {
        toast.success('Đặt hàng thành công!');
        clearCart();
        navigate(`/don-hang/${response.data.orderId}`);
      }
    } catch (err) {
      console.error('[Checkout] Lỗi đặt hàng:', err.response?.data || err.message);
      toast.error(err.response?.data?.message || 'Lỗi khi đặt hàng, vui lòng thử lại');
    } finally {
      setIsProcessing(false);
    }
  };

  if (cart.length === 0) {
    return <div className="container mx-auto py-12 text-center">Đang chuyển hướng...</div>;
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <Helmet>
        <title>Thanh Toán - Thời Trang XYZ</title>
        <meta name="description" content="Thanh toán đơn hàng của bạn" />
      </Helmet>
      
      <h1 className="text-3xl font-semibold mb-6 text-center">Thanh Toán</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-white border rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4 pb-2 border-b">Thông tin đặt hàng</h2>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-gray-700 mb-1">Họ tên <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    className="w-full p-2 border rounded focus:ring focus:ring-blue-200 focus:border-blue-400 transition"
                    placeholder="Nguyễn Văn A"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 mb-1">Số điện thoại <span className="text-red-500">*</span></label>
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    className="w-full p-2 border rounded focus:ring focus:ring-blue-200 focus:border-blue-400 transition"
                    placeholder="0912345678"
                  />
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 mb-1">Email <span className="text-red-500">*</span></label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full p-2 border rounded focus:ring focus:ring-blue-200 focus:border-blue-400 transition"
                  placeholder="example@email.com"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-gray-700 mb-1">Tỉnh/Thành phố <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    className="w-full p-2 border rounded focus:ring focus:ring-blue-200 focus:border-blue-400 transition"
                    placeholder="Hà Nội"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 mb-1">Quận/Huyện</label>
                  <input
                    type="text"
                    name="district"
                    value={formData.district}
                    onChange={handleChange}
                    className="w-full p-2 border rounded focus:ring focus:ring-blue-200 focus:border-blue-400 transition"
                    placeholder="Cầu Giấy"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 mb-1">Phường/Xã</label>
                  <input
                    type="text"
                    name="ward"
                    value={formData.ward}
                    onChange={handleChange}
                    className="w-full p-2 border rounded focus:ring focus:ring-blue-200 focus:border-blue-400 transition"
                    placeholder="Dịch Vọng"
                  />
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 mb-1">Địa chỉ chi tiết <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className="w-full p-2 border rounded focus:ring focus:ring-blue-200 focus:border-blue-400 transition"
                  placeholder="Số nhà, tên đường..."
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 mb-1">Ghi chú đơn hàng</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  className="w-full p-2 border rounded focus:ring focus:ring-blue-200 focus:border-blue-400 transition"
                  rows="3"
                  placeholder="Ghi chú về đơn hàng, ví dụ: thời gian hoặc địa điểm giao hàng chi tiết hơn."
                ></textarea>
              </div>

              <button
                type="button"
                onClick={calculateShippingFee}
                className="w-full mb-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
              >
                Tính phí vận chuyển
              </button>

              <div className="bg-white border rounded-lg shadow-sm p-6 mb-4">
                <h2 className="text-xl font-semibold mb-4 pb-2 border-b">Phương thức thanh toán</h2>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <input
                      id="cod"
                      type="radio"
                      name="paymentMethod"
                      value="cod"
                      checked={paymentMethod === 'cod'}
                      onChange={() => setPaymentMethod('cod')}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500"
                    />
                    <label htmlFor="cod" className="ml-2 block font-medium text-gray-700">
                      Thanh toán khi nhận hàng (COD)
                    </label>
                  </div>
                  <p className="text-gray-500 text-sm ml-6">Trả tiền mặt khi giao hàng</p>

                  <div className="flex items-center">
                    <input
                      id="momo"
                      type="radio"
                      name="paymentMethod"
                      value="momo"
                      checked={paymentMethod === 'momo'}
                      onChange={() => setPaymentMethod('momo')}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500"
                    />
                    <label htmlFor="momo" className="ml-2 block font-medium text-gray-700">
                      Thanh toán bằng MoMo
                    </label>
                  </div>
                  <p className="text-gray-500 text-sm ml-6">Thanh toán trực tuyến qua ví MoMo</p>

                  <div className="flex items-center">
                    <input
                      id="vnpay"
                      type="radio"
                      name="paymentMethod"
                      value="vnpay"
                      checked={paymentMethod === 'vnpay'}
                      onChange={() => setPaymentMethod('vnpay')}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500"
                    />
                    <label htmlFor="vnpay" className="ml-2 block font-medium text-gray-700">
                      Thanh toán bằng VNPay
                    </label>
                  </div>
                  <p className="text-gray-500 text-sm ml-6">Thanh toán trực tuyến qua VNPay</p>
                </div>
              </div>

              <button
                type="submit"
                disabled={isProcessing}
                className={`w-full ${isProcessing ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'} text-white px-4 py-3 rounded font-medium transition-colors duration-200`}
              >
                {isProcessing ? 'Đang xử lý...' : paymentMethod === 'momo' ? 'Thanh toán qua MoMo' : paymentMethod === 'vnpay' ? 'Thanh toán qua VNPay' : 'Đặt hàng'}
              </button>
            </form>
          </div>
        </div>
        
        <div className="lg:col-span-1">
          <div className="bg-white border rounded-lg shadow-sm p-6 sticky top-8">
            <h2 className="text-xl font-semibold mb-4 pb-2 border-b">Đơn hàng của bạn</h2>
            {/* Phần giỏ hàng giữ nguyên */}
            <div className="space-y-4 mb-6">
              {cart.map((item) => (
                <div key={`${item.productId}-${item.size}-${item.color}`} className="flex items-center space-x-3 py-2 border-b">
                  <div className="w-16 h-16 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                    {item.image && (
                      <img 
                        src={item.image} 
                        alt={item.name} 
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-800">{item.name}</h3>
                    <div className="flex justify-between mt-1">
                      <span className="text-gray-600">SL: {item.quantity}</span>
                      <span className="font-medium">{(item.price * item.quantity).toLocaleString()} VNĐ</span>
                    </div>
                    <p className="text-gray-600 text-sm">Kích cỡ: {item.size}</p>
                    <p className="text-gray-600 text-sm">Màu sắc: {item.color}</p>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mb-6">
              <h3 className="font-medium mb-2">Mã giảm giá</h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputCouponCode}
                  onChange={(e) => setInputCouponCode(e.target.value)}
                  className="flex-1 p-2 border rounded focus:ring focus:ring-blue-200 focus:border-blue-400 transition"
                  placeholder="Nhập mã giảm giá"
                />
                <button
                  type="button"
                  onClick={handleApplyCoupon}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
                >
                  Áp dụng
                </button>
              </div>
              {couponCode && (
                <div className="mt-2 flex justify-between items-center bg-blue-50 p-2 rounded">
                  <span className="text-blue-700">Mã: <strong>{couponCode}</strong></span>
                  <button
                    type="button"
                    onClick={handleRemoveCoupon}
                    className="text-red-600 hover:text-red-800 transition"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                      <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/>
                    </svg>
                  </button>
                </div>
              )}
              {couponMessage && (
                <p className={`mt-2 text-sm ${couponMessageType === 'success' ? 'text-green-600' : couponMessageType === 'info' ? 'text-blue-600' : 'text-red-600'}`}>
                  {couponMessage}
                </p>
              )}
            </div>
            
            <div className="space-y-2 mb-6">
              <div className="flex justify-between py-1">
                <span className="text-gray-600">Tạm tính:</span>
                <span>{subtotal.toLocaleString()} VNĐ</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-gray-600">Phí vận chuyển:</span>
                <span>{shippingFee.toLocaleString()} VNĐ</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between py-1 text-green-600">
                  <span>Giảm giá:</span>
                  <span>-{discountAmount.toLocaleString()} VNĐ</span>
                </div>
              )}
              <div className="flex justify-between py-2 text-lg font-bold border-t border-gray-200 mt-2 pt-2">
                <span>Tổng cộng:</span>
                <span>{finalTotal.toLocaleString()} VNĐ</span>
              </div>
            </div>
            
            <button
              onClick={handleSubmit}
              disabled={isProcessing}
              className={`w-full ${isProcessing ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'} text-white px-4 py-3 rounded font-medium transition-colors duration-200`}
            >
              {isProcessing ? 'Đang xử lý...' : paymentMethod === 'momo' ? 'Thanh toán qua MoMo' : paymentMethod === 'vnpay' ? 'Thanh toán qua VNPay' : 'Đặt hàng'}
            </button>
            
            <p className="text-xs text-gray-500 mt-4 text-center">
              Bằng cách đặt hàng, bạn đồng ý với điều khoản dịch vụ và chính sách bảo mật của chúng tôi
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;