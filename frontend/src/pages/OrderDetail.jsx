import React, { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getOrderById, cancelOrder } from '../services/api';
import { CartContext } from '../context/CartContext';
import { CheckCircle, Package, Truck, XCircle, Clock } from 'lucide-react';

const OrderDetail = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { clearCart } = useContext(CartContext);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const response = await getOrderById(id);
        console.log('[OrderDetail] Dữ liệu đơn hàng:', response.data);
        if (!response.data || !response.data.items) {
          throw new Error('Dữ liệu đơn hàng không hợp lệ hoặc không có sản phẩm');
        }
        setOrder(response.data);
        setLoading(false);
      } catch (error) {
        console.error('[OrderDetail] Lỗi khi tải đơn hàng:', error);
        setError(error.response?.data?.message || error.message || 'Lỗi không xác định');
        toast.error('Lỗi khi tải đơn hàng: ' + (error.response?.data?.message || error.message));
        setLoading(false);
      }
    };
    fetchOrder();
  }, [id]);

  const handleCancelOrder = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn hủy đơn hàng này?')) return;
    try {
      await cancelOrder(id);
      toast.success('Hủy đơn hàng thành công');
      setOrder((prev) => ({ ...prev, status: 'cancelled' }));
      clearCart();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Lỗi khi hủy đơn hàng');
    }
  };

  // Ánh xạ trạng thái từ API sang nhãn hiển thị và xác định các bước trong timeline
  const getStatusSteps = () => {
    const status = order.status.toLowerCase(); // Chuẩn hóa trạng thái từ API
    const steps = [
      { status: 'pending', label: 'Đang xử lý', icon: Clock },
      { status: 'processing', label: 'Đang chuẩn bị', icon: Package },
      { status: 'shipped', label: 'Đang giao', icon: Truck },
      { status: 'delivered', label: 'Đã giao', icon: CheckCircle },
    ];

    if (status === 'cancelled') {
      return [{ status: 'cancelled', label: 'Đã hủy', icon: XCircle }];
    }

    return steps.map((step, index) => ({
      ...step,
      isActive: status === step.status,
      isCompleted:
        steps.findIndex(s => s.status === status) >= index || status === 'delivered',
    }));
  };

  // Ánh xạ trạng thái để hiển thị trong thông tin đơn hàng
  const displayStatus = () => {
    const status = order.status.toLowerCase();
    switch (status) {
      case 'pending':
        return 'Đang xử lý';
      case 'processing':
        return 'Đang chuẩn bị';
      case 'shipped':
        return 'Đang giao';
      case 'delivered':
        return 'Đã giao';
      case 'cancelled':
        return 'Đã hủy';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xl font-semibold text-gray-700">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-xl text-red-600 mb-4">Lỗi: {error}</p>
        <Link to="/don-hang" className="text-blue-600 underline hover:text-blue-800">
          Quay lại danh sách đơn hàng
        </Link>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <p className="text-xl text-red-600 mb-4">Đơn hàng không tồn tại</p>
        <Link to="/don-hang" className="text-blue-600 underline hover:text-blue-800">
          Quay lại danh sách đơn hàng
        </Link>
      </div>
    );
  }

  const statusSteps = getStatusSteps();

  return (
    <div className="container mx-auto py-12 px-4 max-w-5xl">
      <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">
        Chi Tiết Đơn Hàng #{id}
      </h1>

      {/* Card chứa thông tin đơn hàng */}
      <div className="bg-white shadow-lg rounded-lg p-6 border border-gray-200">
        {/* Thông tin cơ bản */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <p className="text-gray-600 mb-2">
              <strong className="text-gray-800">Ngày đặt:</strong>{' '}
              {new Date(order.createdAt).toLocaleString('vi-VN')}
            </p>
            <p className="text-gray-600 mb-2">
              <strong className="text-gray-800">Tổng tiền:</strong>{' '}
              <span className="text-green-600 font-semibold">
                {order.total?.toLocaleString() || 0} VNĐ
              </span>
            </p>
            <p className="text-gray-600 mb-2">
              <strong className="text-gray-800">Phí vận chuyển:</strong>{' '}
              <span className="font-semibold">
                {order.shipping_fee?.toLocaleString() || 0} VNĐ
              </span>
            </p>
            {order.discount_amount > 0 && (
              <p className="text-gray-600 mb-2">
                <strong className="text-gray-800">Giảm giá:</strong>{' '}
                <span className="font-semibold">
                  -{order.discount_amount?.toLocaleString() || 0} VNĐ
                </span>
              </p>
            )}
            <p className="text-gray-600 mb-2">
              <strong className="text-gray-800">Địa chỉ:</strong> {order.address}
            </p>
            <p className="text-gray-600 mb-2">
              <strong className="text-gray-800">Số điện thoại:</strong>{' '}
              {order.phone || 'Không có'}
            </p>
            <p className="text-gray-600">
              <strong className="text-gray-800">Email:</strong>{' '}
              {order.email || 'Không có'}
            </p>
          </div>
          <div>
            <p className="text-gray-600 mb-2">
              <strong className="text-gray-800">Trạng thái:</strong>{' '}
              <span
                className={`font-semibold ${
                  order.status.toLowerCase() === 'cancelled'
                    ? 'text-red-600'
                    : order.status.toLowerCase() === 'delivered'
                    ? 'text-green-600'
                    : 'text-blue-600'
                }`}
              >
                {displayStatus()}
              </span>
            </p>
            {order.coupon_code && (
              <p className="text-gray-600 mb-2">
                <strong className="text-gray-800">Mã giảm giá:</strong>{' '}
                {order.coupon_code}
              </p>
            )}
            {order.status.toLowerCase() !== 'cancelled' &&
              order.status.toLowerCase() !== 'delivered' && (
                <p className="text-gray-600">
                  <strong className="text-gray-800">Dự kiến giao hàng:</strong>{' '}
                  {new Date(
                    new Date(order.createdAt).getTime() + 3 * 24 * 60 * 60 * 1000
                  ).toLocaleDateString('vi-VN')}{' '}
                  (ước tính 3 ngày)
                </p>
              )}
          </div>
        </div>

        {/* Timeline trạng thái đơn hàng */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Trạng Thái Đơn Hàng
          </h2>
          <div className="relative">
            {/* Thanh ngang của timeline */}
            <div className="absolute top-6 left-0 w-full h-1 bg-gray-200">
              <div
                className="h-full bg-green-500 transition-all duration-500"
                style={{
                  width:
                    order.status.toLowerCase() === 'cancelled'
                      ? '0%'
                      : order.status.toLowerCase() === 'pending'
                      ? '10%'
                      : order.status.toLowerCase() === 'processing'
                      ? '40%'
                      : order.status.toLowerCase() === 'shipped'
                      ? '70%'
                      : '100%',
                }}
              ></div>
            </div>

            {/* Các bước trong timeline */}
            <div className="flex justify-between relative z-10">
              {statusSteps.map((step, index) => {
                const Icon = step.icon;
                return (
                  <div key={index} className="flex flex-col items-center">
                    <div
                      className={`w-12 h-12 flex items-center justify-center rounded-full mb-2 transition-all duration-300 ${
                        step.isCompleted || step.isActive
                          ? 'bg-green-500 text-white'
                          : order.status.toLowerCase() === 'cancelled'
                          ? 'bg-red-500 text-white'
                          : 'bg-gray-200 text-gray-600'
                      } ${step.isActive ? 'scale-110 shadow-lg' : ''}`}
                    >
                      <Icon size={24} />
                    </div>
                    <p
                      className={`text-sm font-medium ${
                        step.isActive || step.isCompleted
                          ? 'text-green-600'
                          : order.status.toLowerCase() === 'cancelled'
                          ? 'text-red-600'
                          : 'text-gray-600'
                      }`}
                    >
                      {step.label}
                    </p>
                    {step.isActive && (
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(order.createdAt).toLocaleTimeString('vi-VN')}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Danh sách sản phẩm */}
        <div>
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Sản Phẩm Trong Đơn Hàng
          </h2>
          {order.items && order.items.length > 0 ? (
            order.items.map((item) => (
              <div
                key={item.id}
                className="flex items-center border rounded-lg p-4 hover:shadow-md transition-shadow duration-300 mb-4"
              >
                <img
                  src={item.image || 'https://via.placeholder.com/100'}
                  alt={item.name || 'Sản phẩm không xác định'}
                  className="w-20 h-20 object-cover rounded-lg mr-4"
                />
                <div className="flex-1">
                  <p className="text-lg font-semibold text-gray-800">
                    {item.name || 'Sản phẩm không xác định'}
                  </p>
                  <p className="text-gray-600">
                    Số lượng: <span className="font-medium">{item.quantity || 0}</span>
                  </p>
                  <p className="text-gray-600">
                    Giá:{' '}
                    <span className="font-medium">
                      {item.price?.toLocaleString() || 0} VNĐ
                    </span>
                  </p>
                  <p className="text-gray-600">
                    Kích cỡ: <span className="font-medium">{item.size || 'Không có'}</span>
                  </p>
                  <p className="text-gray-600">
                    Màu sắc: <span className="font-medium">{item.color || 'Không có'}</span>
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-600">Không có sản phẩm nào trong đơn hàng này.</p>
          )}
        </div>

        {/* Nút thao tác */}
        <div className="mt-6 flex flex-wrap gap-4">
          {order.status.toLowerCase() === 'pending' && (
            <button
              onClick={handleCancelOrder}
              className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <XCircle size={20} />
              <span>Hủy Đơn Hàng</span>
            </button>
          )}
          {order.status.toLowerCase() === 'delivered' && (
            <Link
              to={`/danh-gia/${id}`}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <span>Đánh Giá Đơn Hàng</span>
            </Link>
          )}
          {order.status.toLowerCase() !== 'delivered' &&
            order.status.toLowerCase() !== 'cancelled' && (
              <a
                href="mailto:support@thoitrangxyz.com?subject=Hỗ trợ đơn hàng"
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <span>Liên Hệ Hỗ Trợ</span>
              </a>
            )}
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;