import React from 'react';
import { FaStar, FaStarHalfAlt, FaRegStar } from 'react-icons/fa';

/** Component hiển thị rating dạng ⭐⭐⭐⭐☆ và cho phép chọn rating nếu không readOnly */
const StarRating = ({ rating, onRatingChange, readOnly = false }) => {

  /** Tạo mảng 5 ngôi sao tương ứng với giá trị rating */
  const stars = Array(5).fill(0).map((_, index) => {
    const starValue = index + 1;

    if (rating >= starValue) {
      return <FaStar key={index} className="text-yellow-400" />; // full star
    } else if (rating >= starValue - 0.5) {
      return <FaStarHalfAlt key={index} className="text-yellow-400" />; // half star
    } else {
      return <FaRegStar key={index} className="text-gray-300" />; // empty star
    }
  });

  /** Render component StarRating */
  return (
    <div className="flex">
      {stars.map((star, index) => (
        <span
          key={index}
          onClick={() => !readOnly && onRatingChange(index + 1)} // xử lý click chọn rating mới
          className={readOnly ? '' : 'cursor-pointer'}
        >
          {star}
        </span>
      ))}
    </div>
  );
};

export default StarRating;