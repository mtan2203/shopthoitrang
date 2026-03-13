import React, { useEffect, useContext } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import { toast } from 'react-toastify';

const VNPayReturn = () => {
  const navigate = useNavigate();
  const { orderId } = useParams();
  const [searchParams] = useSearchParams();
  const { clearCart } = useContext(CartContext);

  useEffect(() => {
    const payment = searchParams.get('payment');
    const responseCode = searchParams.get('vnp_ResponseCode');
    
    if (payment === 'success' || responseCode === '00') {
      toast.success('Thanh toán VNPay thành công!');
      clearCart();
      if (orderId) {
        navigate(`/don-hang/${orderId}`);
      } else {
        navigate('/');
      }
    } else {
      toast.error('Thanh toán VNPay thất bại');
      navigate('/thanh-toan?status=error&message=Thanh toán VNPay thất bại');
    }
  }, [searchParams, navigate, clearCart, orderId]);

  return (
    <div className="container mx-auto py-12 text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <p>Đang xử lý kết quả thanh toán...</p>
    </div>
  );
};

export default VNPayReturn;