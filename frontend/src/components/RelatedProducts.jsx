import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getRelatedProducts } from '../services/api';

const RelatedProducts = ({ productId }) => {
  const [relatedProducts, setRelatedProducts] = useState([]);

  useEffect(() => {
    const fetchRelatedProducts = async () => {
      try {
        const response = await getRelatedProducts(productId);
        setRelatedProducts(response.data.relatedProducts);
      } catch (err) {
        console.error('Lỗi khi lấy sản phẩm liên quan:', err);
      }
    };
    fetchRelatedProducts();
  }, [productId]);

  if (!relatedProducts.length) return null;

  return (
    <div className="mt-12">
      <h2 className="text-2xl font-semibold mb-6">Sản Phẩm Liên Quan</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {relatedProducts.map((product) => (
          <Link
            key={product.id}
            to={`/san-pham/${product.id}`}
            className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
          >
            <img
              src={product.image || 'https://via.placeholder.com/300x200'}
              alt={product.name}
              className="w-full h-48 object-cover rounded-t-lg"
              loading="lazy"
            />
            <div className="p-4">
              <h3 className="text-lg font-semibold">{product.name}</h3>
              <p className="text-gray-600">{product.price.toLocaleString()} VNĐ</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default RelatedProducts;