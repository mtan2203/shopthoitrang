import React, { useState, useEffect, useContext } from 'react';
import { toast } from 'react-toastify';
import { getPublicCoupons, claimCoupon } from '../services/api';
import { AuthContext } from '../context/AuthContext';

const DiscountPage = () => {
  const { user } = useContext(AuthContext);
  const [coupons, setCoupons] = useState([]);
  const [selectedCoupon, setSelectedCoupon] = useState(null);
  const [loading, setLoading] = useState(true);
  const [claimedCoupons, setClaimedCoupons] = useState({});
  const [hasClaimedAny, setHasClaimedAny] = useState(false); 

  useEffect(() => {
    const fetchCoupons = async () => {
      try {
        setLoading(true);
        const res = await getPublicCoupons();
        if (res.data && res.data.coupons) {
          setCoupons(res.data.coupons);
          if (user && user.id) {
            const userClaims = await fetchUserClaims();
            const claimedMap = Object.fromEntries(userClaims.map(id => [id, true]));
            setClaimedCoupons(claimedMap);
          }
        } else {
          toast.error('Không có mã giảm giá hợp lệ');
          setCoupons([]);
        }
      } catch (err) {
        toast.error('Lỗi khi lấy mã giảm giá: ' + err.message);
        setCoupons([]);
      } finally {
        setLoading(false);
      }
    };
    fetchCoupons();
  }, [user]);

  const fetchUserClaims = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/coupons/user-claims', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      return data.claimedCoupons || [];
    } catch (err) {
      console.error('[DiscountPage] Lỗi khi lấy danh sách mã đã lấy:', err);
      return [];
    }
  };

  const handleClaimCoupon = async (couponId, code, usageLimit, timesUsed) => {
    if (!user) {
      toast.info('Vui lòng đăng nhập để lấy mã giảm giá');
      return;
    }

    try {
      const remainingUses = usageLimit - (timesUsed || 0);
      if (remainingUses <= 0) {
        toast.error('Mã giảm giá đã hết lượt sử dụng!');
        return;
      }

      const response = await claimCoupon(couponId, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      console.log('[DiscountPage] Phản hồi từ claimCoupon:', response);

      setCoupons(coupons.map(coupon =>
        coupon.id === couponId ? { ...coupon, times_used: (coupon.times_used || 0) + 1 } : coupon
      ));

      await navigator.clipboard.writeText(code);
      toast.success(`Đã copy mã giảm giá: ${code}`);

      setClaimedCoupons(prev => ({ ...prev, [couponId]: true }));
      setHasClaimedAny(true); // ✅ Đánh dấu đã lấy mã
      setSelectedCoupon(code);
    } catch (err) {
      console.error('[DiscountPage] Lỗi khi lấy mã:', err.response?.data?.message || err.message);
      toast.error(err.response?.data?.message || 'Lỗi khi lấy mã: ' + err.message);
    }
  };

  if (loading) {
    return <p className="text-center py-12 text-gray-600">Đang tải mã giảm giá...</p>;
  }

  return (
    <div className="container mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">Mã Giảm Giá</h1>
      {coupons.length === 0 ? (
        <p className="text-center text-gray-600">Hiện tại không có mã giảm giá nào.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {coupons.map(coupon => {
            const remainingUses = coupon.usage_limit - (coupon.times_used || 0);
            const isExpired = new Date(coupon.expiry_date) < new Date();
            const isClaimed = claimedCoupons[coupon.id] || false;

            // ✅ Nếu user đã lấy bất kỳ mã nào → disable tất cả mã còn lại
            const disableButton = isClaimed;
            return (
              <div
                key={coupon.id}
                className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 border border-gray-200 flex flex-col"
              >
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-800">{coupon.code}</h2>
                  <span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
                    {remainingUses}/{coupon.usage_limit}
                  </span>
                </div>
                <p className="text-gray-600 mb-2">
                  Giảm: {coupon.discount_type === 'percentage' ? `${coupon.discount_value}%` : `${coupon.discount_value.toLocaleString()} VNĐ`}
                </p>
                {coupon.discount_type === 'percentage' && coupon.max_discount_amount && (
                  <p className="text-gray-600 mb-2">
                    Giảm tối đa: {coupon.max_discount_amount.toLocaleString()} VNĐ
                  </p>
                )}
                <p className="text-gray-600 mb-2">
                  Đơn tối thiểu: {coupon.min_purchase_amount ? coupon.min_purchase_amount.toLocaleString() : 0} VNĐ
                </p>
                <p className="text-gray-500 text-sm mb-4">
                  Hết hạn: {new Date(coupon.expiry_date).toLocaleDateString('vi-VN')}
                </p>
                <button
                  onClick={() => handleClaimCoupon(coupon.id, coupon.code, coupon.usage_limit, coupon.times_used)}
                  disabled={remainingUses <= 0 || isExpired || !coupon.is_active || disableButton}
                  className={`w-full py-2 mt-auto rounded-lg text-center font-semibold text-sm transition-all duration-300 transform ${
                    remainingUses <= 0 || isExpired || !coupon.is_active || disableButton
                      ? 'bg-gray-400 cursor-not-allowed'
                      : isClaimed
                      ? 'bg-green-500 text-white cursor-default'
                      : 'bg-blue-600 hover:bg-blue-700 text-white hover:scale-105'
                  }`}
                >
                  {remainingUses <= 0
                    ? 'Hết mã'
                    : isExpired
                    ? 'Đã hết hạn'
                    : isClaimed
                    ? 'Đã lấy mã'                
                    : 'Lấy mã'}
                </button>
              </div>
            );
          })}
        </div>
      )}
      {selectedCoupon && (
        <div className="mt-8 text-center">
          <p className="text-lg text-gray-700">
            Mã giảm giá đã chọn: <span className="font-semibold text-blue-600">{selectedCoupon}</span>
          </p>
          <p className="text-gray-600">Hãy áp dụng mã này khi thanh toán!</p>
        </div>
      )}
    </div>
  );
};

export default DiscountPage;
