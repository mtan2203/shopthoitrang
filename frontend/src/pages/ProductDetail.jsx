import React, { useEffect, useState, useContext, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getProductById, addToWishlist, removeFromWishlist, checkPurchaseStatus, getReviews, getAverageRating } from '../services/api';
import { CartContext } from '../context/CartContext';
import { Helmet } from 'react-helmet-async';
import { toast } from 'react-toastify';
import { Heart, Star, ChevronLeft, ChevronRight, Eye, EyeOff } from 'lucide-react';
import StarRating from '../components/StarRating';
import ReviewForm from '../components/ReviewForm';
import ThreeD3DViewer from '../components/ThreeD3DViewer';
import ProAIVirtualTryOn from '../components/ProAIVirtualTryOn';

const ProductDetail = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [availableColors, setAvailableColors] = useState([]);
  const [isInWishlist, setIsInWishlist] = useState(false);
  const { addToCart } = useContext(CartContext);
  const [loading, setLoading] = useState(true);
  const [averageRating, setAverageRating] = useState({ averageRating: 0, totalReviews: 0 });
  const [reviews, setReviews] = useState([]);
  const [canReview, setCanReview] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [activeTab, setActiveTab] = useState('description');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // States cho 3D viewer
  const [show3D, setShow3D] = useState(false);
  const [selected3DColor, setSelected3DColor] = useState('#ffffff');
  
  const navigate = useNavigate();
  const intervalRef = useRef(null);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await getProductById(id);
        setProduct(response.data);
        checkWishlistStatus(response.data.id);
        fetchAverageRating();
        fetchReviews();
        checkReviewEligibility();
        fetchRelatedProducts(response.data);
        setLoading(false);
      } catch (error) {
        console.error('[ProductDetail] Error fetching product:', error.response?.data || error.message);
        toast.error('Lỗi tải sản phẩm: ' + error.message);
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  useEffect(() => {
    if (selectedSize && product) {
      let colors = [];
      if (product.variants && product.variants.length > 0) {
        const variants = product.variants.filter(variant => variant.size === selectedSize);
        colors = [...new Set(variants.map(variant => variant.color))];
      }
      if (colors.length === 0 && product.colors && product.colors.length > 0) {
        colors = product.colors;
      }
      setAvailableColors(colors);
      setSelectedColor('');
    } else {
      setAvailableColors([]);
    }
  }, [selectedSize, product]);

  useEffect(() => {
    if (!product || !product.images || product.images.length === 0) return;

    const startInterval = () => {
      intervalRef.current = setInterval(() => {
        setCurrentImageIndex((prevIndex) =>
          prevIndex === product.images.length - 1 ? 0 : prevIndex + 1
        );
      }, 5000);
    };

    startInterval();
    return () => clearInterval(intervalRef.current);
  }, [product]);

  const checkWishlistStatus = async (productId) => {
    try {
      if (!localStorage.getItem('token')) return;
      const wishlistRes = await fetch('http://localhost:5000/api/wishlist/check/' + productId, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await wishlistRes.json();
      setIsInWishlist(data.isInWishlist);
    } catch (error) {
      console.error('[ProductDetail] Error checking wishlist:', error);
    }
  };

  const fetchAverageRating = async () => {
    try {
      const response = await getAverageRating(id);
      setAverageRating(response.data);
    } catch (err) {
      console.error('Lỗi khi lấy trung bình đánh giá:', err);
    }
  };

  const fetchReviews = async () => {
    try {
      const response = await getReviews(id);
      setReviews(response.data.reviews);
    } catch (err) {
      console.error('Lỗi khi lấy đánh giá:', err);
    }
  };

  const fetchRelatedProducts = async (currentProduct) => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/products/search?categoryId=${currentProduct.categoryId}`
      );
      const data = await response.json();
      const related = data.products
        .filter((p) => p.id !== parseInt(id))
        .slice(0, 4);
      setRelatedProducts(related);
    } catch (err) {
      console.error('Lỗi khi lấy sản phẩm liên quan:', err);
    }
  };

  const checkReviewEligibility = async () => {
    try {
      if (!localStorage.getItem('token')) return;
      const response = await checkPurchaseStatus(id);
      setCanReview(response.data.canReview);
    } catch (err) {
      console.error('Lỗi khi kiểm tra điều kiện đánh giá:', err);
    }
  };

  const handleWishlistToggle = async () => {
    try {
      if (!localStorage.getItem('token')) {
        toast.info('Bạn cần đăng nhập để thêm vào danh sách yêu thích');
        navigate('/dang-nhap');
        return;
      }
      if (isInWishlist) {
        await removeFromWishlist(product.id);
        toast.success(`Bạn đã xóa sản phẩm ${product.name} khỏi danh sách yêu thích!`);
        setIsInWishlist(false);
      } else {
        await addToWishlist(product.id);
        toast.success(`Bạn đã thêm sản phẩm ${product.name} vào danh sách yêu thích!`);
        setIsInWishlist(true);
      }
    } catch (error) {
      console.error('[ProductDetail] Error toggling wishlist:', error.response?.data || error.message);
      toast.error(error.response?.data?.message || 'Lỗi khi thao tác với danh sách yêu thích');
    }
  };

  const handleAddToCart = async () => {
    if (!product) {
      toast.error('Sản phẩm không tồn tại');
      return;
    }
    if (!selectedSize) {
      toast.error('Vui lòng chọn kích thước');
      return;
    }
    if (!selectedColor) {
      toast.error('Vui lòng chọn màu sắc');
      return;
    }
    if (quantity < 1 || !Number.isInteger(quantity)) {
      toast.error('Số lượng phải là số nguyên lớn hơn 0');
      return;
    }

    try {
      await addToCart(product, quantity, { size: selectedSize, color: selectedColor });
      toast.success(`Bạn đã thêm sản phẩm ${product.name} vào giỏ hàng!`);
    } catch (err) {
      console.error('[ProductDetail] Error adding to cart:', err.response?.data || err.message);
      toast.error(err.response?.data?.message || 'Lỗi thêm vào giỏ hàng');
    }
  };

  const handleBuyNow = async () => {
    await handleAddToCart();
    navigate('/gio-hang');
  };

  const handlePrevImage = () => {
    clearInterval(intervalRef.current);
    setCurrentImageIndex((prevIndex) =>
      prevIndex === 0 ? product.images.length - 1 : prevIndex - 1
    );
    startInterval();
  };

  const handleNextImage = () => {
    clearInterval(intervalRef.current);
    setCurrentImageIndex((prevIndex) =>
      prevIndex === product.images.length - 1 ? 0 : prevIndex + 1
    );
    startInterval();
  };

  const startInterval = () => {
    intervalRef.current = setInterval(() => {
      setCurrentImageIndex((prevIndex) =>
        prevIndex === product.images.length - 1 ? 0 : prevIndex + 1
      );
    }, 5000);
  };

  const handle3DToggle = () => {
    setShow3D(!show3D);
    if (!show3D) {
      clearInterval(intervalRef.current);
    } else {
      startInterval();
    }
  };

  const handle3DColorChange = (color) => {
    setSelected3DColor(color);
  };

  if (loading) return <div className="text-center py-12 text-gray-600">Đang tải...</div>;
  if (!product) return <div className="text-center py-12 text-gray-600">Sản phẩm không tồn tại</div>;

  const images = product.images && product.images.length > 0
    ? product.images
    : [product.image || 'https://via.placeholder.com/400x600'];

  return (
    <div className="container mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <Helmet>
        <title>{product.name} - Thời Trang XYZ</title>
        <meta name="description" content={product.description || 'Sản phẩm thời trang tại XYZ'} />
      </Helmet>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Image/3D Viewer Section */}
        <div className="space-y-4">
          {/* Toggle Button cho 3D */}
          {product.model3d && (
            <div className="flex justify-center mb-4">
              <button
                onClick={handle3DToggle}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 ${
                  show3D
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {show3D ? <EyeOff size={20} /> : <Eye size={20} />}
                {show3D ? 'Xem ảnh thường' : 'Xem 3D'}
              </button>
            </div>
          )}

          {/* 3D Viewer hoặc Image Gallery */}
          {show3D && product.model3d ? (
            <div className="w-full">
              <ThreeD3DViewer
                modelUrl={product.model3d}
                selectedColor={selected3DColor}
                onColorChange={handle3DColorChange}
                width="100%"
                height={500}
              />
            </div>
          ) : (
            <div
              className="relative overflow-hidden rounded-lg shadow-md group"
              onMouseEnter={() => clearInterval(intervalRef.current)}
              onMouseLeave={startInterval}
            >
              <img
                src={images[currentImageIndex]}
                alt={product.name}
                className="w-full h-[500px] object-cover object-center transition-opacity duration-500 group-hover:scale-105"
                loading="lazy"
              />
              <button
                onClick={handlePrevImage}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 p-2 rounded-full bg-white/80 backdrop-blur-sm shadow-md hover:bg-gray-100 transition"
                aria-label="Ảnh trước"
              >
                <ChevronLeft size={24} className="text-gray-600" />
              </button>
              <button
                onClick={handleNextImage}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 p-2 rounded-full bg-white/80 backdrop-blur-sm shadow-md hover:bg-gray-100 transition"
                aria-label="Ảnh sau"
              >
                <ChevronRight size={24} className="text-gray-600" />
              </button>
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                {images.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      clearInterval(intervalRef.current);
                      setCurrentImageIndex(index);
                      startInterval();
                    }}
                    className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                      currentImageIndex === index ? 'bg-blue-600 scale-125' : 'bg-gray-300'
                    }`}
                    aria-label={`Ảnh ${index + 1}`}
                  />
                ))}
              </div>
              <button
                onClick={handleWishlistToggle}
                className={`absolute top-4 right-4 p-2 rounded-full bg-white/80 backdrop-blur-sm shadow-md hover:bg-red-50 transition ${
                  isInWishlist ? 'text-red-500' : 'text-gray-400 hover:text-red-400'
                }`}
                aria-label={isInWishlist ? 'Xóa khỏi yêu thích' : 'Thêm vào yêu thích'}
              >
                <Heart size={24} fill={isInWishlist ? 'currentColor' : 'none'} />
              </button>
              {product.discount_price && (
                <span className="absolute top-4 left-4 bg-red-600 text-white text-sm font-bold px-3 py-1 rounded-lg">
                  Giảm {(100 * (product.price - product.discount_price) / product.price).toFixed(0)}%
                </span>
              )}
            </div>
          )}
        </div>

        {/* Product Info Section */}
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-4">{product.name}</h1>
          <div className="flex items-center mb-4">
            <StarRating rating={averageRating.averageRating} readOnly />
            <span className="ml-2 text-gray-600">
              ({averageRating.averageRating} / 5) - {averageRating.totalReviews} đánh giá
            </span>
          </div>
          <div className="flex items-center gap-2 mb-4">
            {product.discount_price ? (
              <>
                <p className="text-gray-500 line-through text-lg">{product.price.toLocaleString()} VNĐ</p>
                <p className="text-red-600 text-2xl font-bold">{product.discount_price.toLocaleString()} VNĐ</p>
              </>
            ) : (
              <p className="text-gray-800 text-2xl font-semibold">{product.price.toLocaleString()} VNĐ</p>
            )}
          </div>
          <p className="text-gray-600 mb-2">
            Tồn kho tổng: <span className="font-medium">{product.stock}</span>
          </p>

          {/* 3D Model Info */}
          {product.model3d && (
            <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-blue-700 text-sm">
                🎯 Sản phẩm này có mô hình 3D! Bấm nút "Xem 3D" để trải nghiệm sản phẩm với công nghệ 3D và thử nghiệm màu sắc.
              </p>
            </div>
          )}

          {/* Size Selection */}
          {product.sizes?.length > 0 ? (
            <div className="mb-4">
              <label className="block text-gray-600 mb-2">Kích cỡ:</label>
              <select
                value={selectedSize}
                onChange={(e) => setSelectedSize(e.target.value)}
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Chọn kích cỡ</option>
                {product.sizes.map((size) => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
            </div>
          ) : (
            <p className="text-gray-600 mb-4">Không có kích cỡ khả dụng</p>
          )}
          
          {/* Color Selection */}
          {product.colors?.length > 0 ? (
            <div className="mb-4">
              <label className="block text-gray-600 mb-2">Màu sắc:</label>
              <select
                value={selectedColor}
                onChange={(e) => setSelectedColor(e.target.value)}
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={!selectedSize || availableColors.length === 0}
              >
                <option value="">Chọn màu sắc</option>
                {availableColors.map((color) => (
                  <option key={color} value={color}>{color}</option>
                ))}
              </select>
              {!selectedSize && (
                <p className="text-sm text-gray-500 mt-1">Vui lòng chọn kích cỡ trước</p>
              )}
              {selectedSize && availableColors.length === 0 && (
                <p className="text-sm text-red-500 mt-1">Không có màu sắc khả dụng cho kích cỡ này</p>
              )}
            </div>
          ) : (
            <p className="text-gray-600 mb-4">Không có màu sắc khả dụng</p>
          )}
          
          {/* Quantity and Wishlist */}
          <div className="mb-4 flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-gray-600">Số lượng:</label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-20 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-12"
                min="1"
                disabled={!selectedSize || !selectedColor}
              />
            </div>
            <button
              onClick={handleWishlistToggle}
              className={`flex items-center gap-2 px-4 py-3 border rounded-lg transition-colors h-12 ${
                isInWishlist
                  ? 'border-red-500 text-red-500 bg-red-50 hover:bg-red-100'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Heart size={20} fill={isInWishlist ? 'currentColor' : 'none'} />
              {isInWishlist ? 'Đã yêu thích' : 'Thêm vào yêu thích'}
            </button>
          </div>
          
          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              onClick={handleAddToCart}
              className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              disabled={!selectedSize || !selectedColor}
            >
              Thêm vào Giỏ Hàng
            </button>
            <button
              onClick={handleBuyNow}
              className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
              disabled={!selectedSize || !selectedColor}
            >
              Mua Ngay
            </button>
          </div>
        </div>
      </div>
      
      {/* Tabs Section */}
      <div className="mt-12 bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="border-b">
          <div className="flex overflow-x-auto">
            <button 
              onClick={() => setActiveTab('description')}
              className={`px-8 py-4 text-sm font-medium whitespace-nowrap ${
                activeTab === 'description' 
                  ? 'text-blue-600 border-b-2 border-blue-600' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Chi tiết sản phẩm
            </button>
            <button 
              onClick={() => setActiveTab('virtual-tryon')}
              className={`px-8 py-4 text-sm font-medium whitespace-nowrap ${
                activeTab === 'virtual-tryon' 
                  ? 'text-blue-600 border-b-2 border-blue-600' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              📸 Thử đồ ảo
            </button>
            <button 
              onClick={() => setActiveTab('reviews')}
              className={`px-8 py-4 text-sm font-medium whitespace-nowrap ${
                activeTab === 'reviews' 
                  ? 'text-blue-600 border-b-2 border-blue-600' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Đánh giá ({averageRating.totalReviews})
            </button>
            <button 
              onClick={() => setActiveTab('shipping')}
              className={`px-8 py-4 text-sm font-medium whitespace-nowrap ${
                activeTab === 'shipping' 
                  ? 'text-blue-600 border-b-2 border-blue-600' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Vận chuyển & Đổi trả
            </button>
          </div>
        </div>
        
        <div className="p-8">
          {activeTab === 'description' && (
            <div className="prose max-w-none">
              <h3 className="text-xl font-semibold mb-4">Thông tin chi tiết</h3>
              <p className="text-gray-600 mb-6">{product.description}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h4 className="text-lg font-medium mb-3">Đặc điểm nổi bật</h4>
                  <ul className="list-disc pl-5 space-y-2 text-gray-600">
                    <li>Chất liệu cao cấp, bền đẹp theo thời gian</li>
                    <li>Thiết kế thời trang, phù hợp xu hướng</li>
                    <li>Đường may tỉ mỉ, chắc chắn</li>
                    <li>Dễ dàng kết hợp với nhiều trang phục khác</li>
                    <li>Phù hợp nhiều hoàn cảnh: đi làm, đi chơi, dạo phố</li>
                    {product.model3d && <li>🎯 Có mô hình 3D để trải nghiệm sản phẩm trực quan</li>}
                  </ul>
                </div>
                
                <div>
                  <h4 className="text-lg font-medium mb-3">Thông số kỹ thuật</h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <table className="w-full text-sm">
                      <tbody>
                        <tr className="border-b border-gray-200">
                          <td className="py-2 font-medium text-gray-900">Thương hiệu</td>
                          <td className="py-2 text-gray-600">{product.brand || 'XYZ Fashion'}</td>
                        </tr>
                        <tr className="border-b border-gray-200">
                          <td className="py-2 font-medium text-gray-900">Chất liệu</td>
                          <td className="py-2 text-gray-600">Cotton cao cấp</td>
                        </tr>
                        <tr className="border-b border-gray-200">
                          <td className="py-2 font-medium text-gray-900">Kích cỡ</td>
                          <td className="py-2 text-gray-600">{product.sizes?.join(', ') || 'Không xác định'}</td>
                        </tr>
                        <tr className="border-b border-gray-200">
                          <td className="py-2 font-medium text-gray-900">Màu sắc</td>
                          <td className="py-2 text-gray-600">{product.colors?.join(', ') || 'Không xác định'}</td>
                        </tr>
                        {product.model3d && (
                          <tr>
                            <td className="py-2 font-medium text-gray-900">3D Model</td>
                            <td className="py-2 text-gray-600">✓ Có sẵn</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'virtual-tryon' && (
            <ProAIVirtualTryOn 
              productImage={images[0] || product.image}
              productName={product.name}
            />
          )}
          
          {activeTab === 'reviews' && (
            <div>
              <h3 className="text-xl font-semibold mb-4">Đánh giá sản phẩm</h3>
              {localStorage.getItem('token') && canReview && <ReviewForm productId={id} fetchReviews={fetchReviews} />}
              <div className="mt-6">
                {reviews.length > 0 ? (
                  reviews.map((review) => (
                    <div key={review.id} className="border-b py-4">
                      <div className="flex items-center mb-2">
                        <StarRating rating={review.rating} readOnly />
                        <span className="ml-2 text-gray-600">{review.userName}</span>
                      </div>
                      <p className="text-gray-700">{review.comment}</p>
                      <p className="text-sm text-gray-500 mt-1">{new Date(review.createdAt).toLocaleDateString()}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-600">Chưa có đánh giá nào.</p>
                )}
              </div>
            </div>
          )}
          
          {activeTab === 'shipping' && (
            <div>
              <h3 className="text-xl font-semibold mb-4">Vận chuyển & Đổi trả</h3>
              <ul className="list-disc pl-5 space-y-2 text-gray-600">
                <li>Giao hàng miễn phí cho đơn hàng từ 500.000 VNĐ trong nội thành.</li>
                <li>Thời gian giao hàng: 2-5 ngày làm việc.</li>
                <li>Đổi trả trong vòng 7 ngày nếu sản phẩm lỗi hoặc không đúng mô tả.</li>
                <li>Vui lòng liên hệ hotline 1800-123-456 để được hỗ trợ.</li>
              </ul>
            </div>
          )}
        </div>
      </div>
      
      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="mt-12">
          <h3 className="text-2xl font-bold text-gray-800 mb-6">Sản phẩm liên quan</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {relatedProducts.map((relatedProduct) => (
              <Link
                to={`/san-pham/${relatedProduct.id}`}
                key={relatedProduct.id}
                className="block bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
              >
                <img
                  src={relatedProduct.images[0] || 'https://via.placeholder.com/300x200'}
                  alt={relatedProduct.name}
                  className="w-full h-48 object-cover"
                />
                <div className="p-4">
                  <h4 className="text-lg font-medium text-gray-800 mb-2">{relatedProduct.name}</h4>
                  <div className="flex items-center gap-2 mb-2">
                    {relatedProduct.discount_price ? (
                      <>
                        <p className="text-gray-500 line-through text-sm">{relatedProduct.price.toLocaleString()} VNĐ</p>
                        <p className="text-red-600 font-bold">{relatedProduct.discount_price.toLocaleString()} VNĐ</p>
                      </>
                    ) : (
                      <p className="text-gray-800 font-semibold">{relatedProduct.price.toLocaleString()} VNĐ</p>
                    )}
                  </div>
                  <StarRating rating={relatedProduct.averageRating || 0} readOnly />
                  {relatedProduct.model3d && (
                    <div className="mt-2">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        🎯 3D Model
                      </span>
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetail;