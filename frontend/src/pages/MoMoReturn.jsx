import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Helmet } from 'react-helmet-async';

const MoMoReturn = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const query = new URLSearchParams(location.search);
    const status = query.get('status');
    const message = query.get('message');
    const orderId = query.get('orderId');

    if (status === 'error') {
      toast.error(message || 'Thanh toán MoMo thất bại');
      navigate('/thanh-toan');
    } else if (orderId) {
      toast.success('Thanh toán MoMo thành công!');
      navigate(`/don-hang/${orderId}`);
    } else {
      toast.error('Dữ liệu trả về không hợp lệ');
      navigate('/thanh-toan');
    }
  }, [navigate, location]);

  return (
    <div className="container mx-auto py-12 text-center">
      <Helmet>
        <title>Xử lý thanh toán - Thời Trang XYZ</title>
        <meta name="description" content="Xử lý kết quả thanh toán MoMo" />
      </Helmet>
      <p className="text-xl font-semibold text-gray-700">Đang xử lý...</p>
    </div>
  );
};

export default MoMoReturn;