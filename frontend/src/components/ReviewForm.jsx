import React, { useState } from 'react';
import { toast } from 'react-toastify';
import StarRating from './StarRating';
import { submitReview } from '../services/api';

const ReviewForm = ({ productId, onReviewSubmitted }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating < 1 || rating > 5) {
      toast.error('Vui lòng chọn số sao (1-5)');
      return;
    }

    setIsSubmitting(true);
    try {
      await submitReview({ productId, rating, comment });
      toast.success('Đánh giá thành công!');
      setRating(0);
      setComment('');
      onReviewSubmitted();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi khi gửi đánh giá');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-xl font-semibold mb-4">Viết Đánh Giá</h3>
      <div className="mb-4">
        <label className="block mb-2 text-gray-700 font-medium">Đánh giá của bạn:</label>
        <StarRating rating={rating} onRatingChange={setRating} />
      </div>
      <div className="mb-4">
        <label className="block mb-2 text-gray-700 font-medium">Bình luận:</label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows="4"
          placeholder="Viết bình luận của bạn..."
        />
      </div>
      <button
        type="submit"
        disabled={isSubmitting}
        className={`w-full p-3 rounded-lg text-white font-medium transition-colors ${
          isSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
        }`}
      >
        {isSubmitting ? 'Đang Gửi...' : 'Gửi Đánh Giá'}
      </button>
    </form>
  );
};

export default ReviewForm;