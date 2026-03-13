import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getOrderById, submitReview, checkReviewStatus } from '../services/api';
import StarRating from '../components/StarRating';

const ReviewPage = () => {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [ratings, setRatings] = useState({});
  const [comments, setComments] = useState({});
  const [reviewedStatus, setReviewedStatus] = useState({}); // State để lưu trạng thái đã đánh giá
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOrderAndCheckReviews = async () => {
      try {
        const response = await getOrderById(orderId);
        const fetchedOrder = response.data;
        if (fetchedOrder.status !== 'delivered') {
          toast.error('Bạn chỉ có thể đánh giá đơn hàng đã hoàn thành.');
          navigate(`/don-hang/${orderId}`);
          return;
        }
        setOrder(fetchedOrder);

        // Kiểm tra trạng thái đánh giá cho từng sản phẩm
        const reviewStatus = {};
        for (const item of fetchedOrder.items) {
          const reviewResponse = await checkReviewStatus(item.id);
          reviewStatus[item.id] = reviewResponse.data.hasReviewed;
        }
        setReviewedStatus(reviewStatus);
        setLoading(false);
      } catch (err) {
        toast.error('Lỗi khi tải đơn hàng: ' + (err.response?.data?.message || err.message));
        navigate('/don-hang');
      }
    };
    fetchOrderAndCheckReviews();
  }, [orderId, navigate]);

  const handleRatingChange = (productId, rating) => {
    setRatings((prev) => ({ ...prev, [productId]: rating }));
  };

  const handleCommentChange = (productId, comment) => {
    setComments((prev) => ({ ...prev, [productId]: comment }));
  };

  const handleSubmitReview = async (productId) => {
    const rating = ratings[productId] || 0;
    const comment = comments[productId] || '';

    if (rating < 1 || rating > 5) {
      toast.error('Vui lòng chọn số sao (1-5) cho sản phẩm #' + productId);
      return;
    }

    try {
      await submitReview({ productId, rating, comment });
      toast.success('Đánh giá sản phẩm #' + productId + ' thành công!');
      setRatings((prev) => ({ ...prev, [productId]: 0 }));
      setComments((prev) => ({ ...prev, [productId]: '' }));
      setReviewedStatus((prev) => ({ ...prev, [productId]: true })); // Cập nhật trạng thái đã đánh giá
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi khi gửi đánh giá');
    }
  };

  if (loading) return <div className="text-center py-12">Đang tải...</div>;
  if (!order) return <div className="text-center py-12">Đơn hàng không tồn tại</div>;

  return (
    <div className="container mx-auto py-12">
      <h1 className="text-3xl font-semibold mb-6">Đánh Giá Đơn Hàng #{orderId}</h1>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Sản phẩm trong đơn hàng</h2>
        {order.items.map((item) => (
          <div key={item.id} className="border-b py-4">
            <div className="flex items-center gap-4">
              <img
                src={item.image || 'https://via.placeholder.com/100'}
                alt={item.name}
                className="w-20 h-20 object-cover rounded"
              />
              <div>
                <h3 className="text-lg font-semibold">{item.name}</h3>
                <p className="text-gray-600">Số lượng: {item.quantity}</p>
                <p className="text-gray-600">Giá: {item.price.toLocaleString()} VNĐ</p>
              </div>
            </div>
            {reviewedStatus[item.id] ? (
              <p className="mt-4 text-green-600 font-semibold">Bạn đã đánh giá sản phẩm này</p>
            ) : (
              <>
                <div className="mt-4">
                  <label className="block mb-2 text-gray-700 font-medium">Đánh giá của bạn:</label>
                  <StarRating
                    rating={ratings[item.id] || 0}
                    onRatingChange={(rating) => handleRatingChange(item.id, rating)}
                  />
                </div>
                <div className="mt-4">
                  <label className="block mb-2 text-gray-700 font-medium">Bình luận:</label>
                  <textarea
                    value={comments[item.id] || ''}
                    onChange={(e) => handleCommentChange(item.id, e.target.value)}
                    className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows="3"
                    placeholder="Viết bình luận của bạn..."
                  />
                </div>
                <button
                  onClick={() => handleSubmitReview(item.id)}
                  className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  Gửi Đánh Giá
                </button>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReviewPage;