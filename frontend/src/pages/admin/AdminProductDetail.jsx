import React, { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getProductById, updateInventory, deleteProduct, getReviews, getAverageRating } from '../../services/api';
import { AuthContext } from '../../context/AuthContext';
import { Helmet } from 'react-helmet-async';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import { 
  Edit, 
  Trash2, 
  Package, 
  DollarSign, 
  Star, 
  BarChart3,
  ChevronLeft, 
  ChevronRight,
  Eye,
  EyeOff,
  Save,
  X
} from 'lucide-react';

const AdminProductDetail = () => {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [activeTab, setActiveTab] = useState('overview');
  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState({ averageRating: 0, totalReviews: 0 });
  
  // States cho chỉnh sửa nhanh
  const [isEditingStock, setIsEditingStock] = useState(false);
  const [tempStock, setTempStock] = useState(0);
  const [isEditingPrice, setIsEditingPrice] = useState(false);
  const [tempPrice, setTempPrice] = useState(0);
  const [tempDiscountPrice, setTempDiscountPrice] = useState(0);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchProduct();
    }
  }, [id, user]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const response = await getProductById(id);
      setProduct(response.data);
      setTempStock(response.data.stock || 0);
      setTempPrice(response.data.price || 0);
      setTempDiscountPrice(response.data.discount_price || 0);
      
      // Fetch reviews và rating
      await fetchReviews();
      await fetchAverageRating();
    } catch (error) {
      console.error('Lỗi khi lấy sản phẩm:', error);
      toast.error('Lỗi khi tải sản phẩm');
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      const response = await getReviews(id);
      setReviews(response.data.reviews || []);
    } catch (error) {
      console.error('Lỗi khi lấy đánh giá:', error);
    }
  };

  const fetchAverageRating = async () => {
    try {
      const response = await getAverageRating(id);
      setAverageRating(response.data);
    } catch (error) {
      console.error('Lỗi khi lấy trung bình đánh giá:', error);
    }
  };

  const handleUpdateStock = async () => {
    try {
      await updateInventory(product.id, { stock: tempStock });
      setProduct(prev => ({ ...prev, stock: tempStock }));
      setIsEditingStock(false);
      toast.success('Cập nhật tồn kho thành công');
    } catch (error) {
      console.error('Lỗi khi cập nhật tồn kho:', error);
      toast.error('Lỗi khi cập nhật tồn kho');
    }
  };

  const handleDeleteProduct = async () => {
    if (window.confirm(`Bạn có chắc muốn xóa sản phẩm "${product.name}"?`)) {
      try {
        await deleteProduct(product.id);
        toast.success('Xóa sản phẩm thành công');
        navigate('/admin');
      } catch (error) {
        console.error('Lỗi khi xóa sản phẩm:', error);
        toast.error('Lỗi khi xóa sản phẩm');
      }
    }
  };

  const handlePrevImage = () => {
    setCurrentImageIndex(prev => 
      prev === 0 ? (product.images?.length || 1) - 1 : prev - 1
    );
  };

  const handleNextImage = () => {
    setCurrentImageIndex(prev => 
      prev === (product.images?.length || 1) - 1 ? 0 : prev + 1
    );
  };

  const getStockStatus = (stock) => {
    if (stock === 0) return { text: 'Hết hàng', color: 'text-red-600 bg-red-100' };
    if (stock < 10) return { text: 'Sắp hết', color: 'text-yellow-600 bg-yellow-100' };
    return { text: 'Còn hàng', color: 'text-green-600 bg-green-100' };
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="text-center text-red-600 py-12 bg-white rounded-xl shadow-lg p-6">
        Bạn không có quyền truy cập.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto py-12 px-4">
        <div className="animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-gray-200 h-96 rounded-lg"></div>
            <div className="space-y-4">
              <div className="h-8 bg-gray-200 rounded w-3/4"></div>
              <div className="h-6 bg-gray-200 rounded w-1/2"></div>
              <div className="h-20 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-12 text-gray-600">
        Sản phẩm không tồn tại
      </div>
    );
  }

  const images = product.images && product.images.length > 0
    ? product.images
    : [product.image || 'https://via.placeholder.com/400x600'];

  const stockStatus = getStockStatus(product.stock);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto py-8 px-4 sm:px-6 lg:px-8"
    >
      <Helmet>
        <title>Admin - {product.name} - Thời Trang XYZ</title>
        <meta name="robots" content="noindex" />
      </Helmet>

      {/* Header với actions */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Chi Tiết Sản Phẩm</h1>
        <div className="flex gap-3">
          <Link
            to={`/admin/sua-san-pham/${product.id}`}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            <Edit size={18} />
            Chỉnh Sửa
          </Link>
          <button
            onClick={handleDeleteProduct}
            className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            <Trash2 size={18} />
            Xóa
          </button>
          <Link
            to="/admin"
            className="flex items-center gap-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Quay Lại
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Image Gallery */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="relative">
              <img
                src={images[currentImageIndex]}
                alt={product.name}
                className="w-full h-80 object-cover"
              />
              {images.length > 1 && (
                <>
                  <button
                    onClick={handlePrevImage}
                    className="absolute left-2 top-1/2 transform -translate-y-1/2 p-2 rounded-full bg-white/80 hover:bg-white shadow-md"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    onClick={handleNextImage}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 rounded-full bg-white/80 hover:bg-white shadow-md"
                  >
                    <ChevronRight size={20} />
                  </button>
                </>
              )}
              {product.discount_price && (
                <span className="absolute top-4 left-4 bg-red-600 text-white text-sm font-bold px-2 py-1 rounded">
                  -{Math.round(((product.price - product.discount_price) / product.price) * 100)}%
                </span>
              )}
            </div>
            {images.length > 1 && (
              <div className="p-4">
                <div className="flex gap-2 overflow-x-auto">
                  {images.map((img, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`flex-shrink-0 w-16 h-16 rounded border-2 overflow-hidden ${
                        currentImageIndex === index ? 'border-blue-500' : 'border-gray-200'
                      }`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Product Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info Card */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">{product.name}</h2>
            
            {/* Price Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Giá gốc</p>
                    <p className="text-xl font-bold text-green-600">
                      {product.price?.toLocaleString()} VNĐ
                    </p>
                  </div>
                  <DollarSign className="text-green-600" size={24} />
                </div>
              </div>
              
              {product.discount_price && (
                <div className="bg-red-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Giá khuyến mãi</p>
                      <p className="text-xl font-bold text-red-600">
                        {product.discount_price.toLocaleString()} VNĐ
                      </p>
                    </div>
                    <DollarSign className="text-red-600" size={24} />
                  </div>
                </div>
              )}
              
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Tồn kho</p>
                    <div className="flex items-center gap-2">
                      {isEditingStock ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={tempStock}
                            onChange={(e) => setTempStock(parseInt(e.target.value) || 0)}
                            className="w-20 px-2 py-1 border rounded text-sm"
                            min="0"
                          />
                          <button
                            onClick={handleUpdateStock}
                            className="text-green-600 hover:text-green-700"
                          >
                            <Save size={16} />
                          </button>
                          <button
                            onClick={() => {
                              setIsEditingStock(false);
                              setTempStock(product.stock || 0);
                            }}
                            className="text-red-600 hover:text-red-700"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <p className="text-xl font-bold text-blue-600">{product.stock || 0}</p>
                          <button
                            onClick={() => setIsEditingStock(true)}
                            className="text-gray-400 hover:text-blue-600"
                          >
                            <Edit size={16} />
                          </button>
                        </div>
                      )}
                    </div>
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${stockStatus.color}`}>
                      {stockStatus.text}
                    </span>
                  </div>
                  <Package className="text-blue-600" size={24} />
                </div>
              </div>
            </div>

            {/* Rating */}
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={20}
                    fill={i < Math.floor(averageRating.averageRating) ? '#fbbf24' : 'none'}
                    className={i < Math.floor(averageRating.averageRating) ? 'text-yellow-400' : 'text-gray-300'}
                  />
                ))}
                <span className="text-sm text-gray-600 ml-2">
                  {averageRating.averageRating.toFixed(1)}/5 ({averageRating.totalReviews} đánh giá)
                </span>
              </div>
            </div>

            {/* Product Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p><span className="font-medium">Thương hiệu:</span> {product.brand || 'N/A'}</p>
                <p><span className="font-medium">Danh mục:</span> {product.categoryName || 'N/A'}</p>
                <p><span className="font-medium">Kích thước:</span> {product.sizes?.join(', ') || 'N/A'}</p>
              </div>
              <div>
                <p><span className="font-medium">Màu sắc:</span> {product.colors?.join(', ') || 'N/A'}</p>
                <p><span className="font-medium">Ngày tạo:</span> {new Date(product.createdAt).toLocaleDateString('vi-VN')}</p>
                <p><span className="font-medium">Cập nhật:</span> {new Date(product.updatedAt).toLocaleDateString('vi-VN')}</p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="border-b">
              <div className="flex overflow-x-auto">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`px-6 py-3 text-sm font-medium whitespace-nowrap ${
                    activeTab === 'overview'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Tổng quan
                </button>
                <button
                  onClick={() => setActiveTab('description')}
                  className={`px-6 py-3 text-sm font-medium whitespace-nowrap ${
                    activeTab === 'description'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Mô tả
                </button>
                <button
                  onClick={() => setActiveTab('reviews')}
                  className={`px-6 py-3 text-sm font-medium whitespace-nowrap ${
                    activeTab === 'reviews'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Đánh giá ({reviews.length})
                </button>
                <button
                  onClick={() => setActiveTab('analytics')}
                  className={`px-6 py-3 text-sm font-medium whitespace-nowrap ${
                    activeTab === 'analytics'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Thống kê
                </button>
              </div>
            </div>

            <div className="p-6">
              {activeTab === 'overview' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold mb-4">Thông tin tổng quan</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium mb-2">Trạng thái sản phẩm</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Tồn kho:</span>
                          <span className={`font-medium ${product.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {product.stock || 0} sản phẩm
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Trạng thái:</span>
                          <span className={`px-2 py-1 rounded-full text-xs ${stockStatus.color}`}>
                            {stockStatus.text}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Thông tin bán hàng</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Đánh giá trung bình:</span>
                          <span className="font-medium">{averageRating.averageRating.toFixed(1)}/5</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Số lượng đánh giá:</span>
                          <span className="font-medium">{averageRating.totalReviews}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'description' && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Mô tả sản phẩm</h3>
                  <div className="prose max-w-none">
                    <p className="text-gray-600 whitespace-pre-wrap">
                      {product.description || 'Chưa có mô tả cho sản phẩm này.'}
                    </p>
                  </div>
                </div>
              )}

              {activeTab === 'reviews' && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Đánh giá từ khách hàng</h3>
                  {reviews.length > 0 ? (
                    <div className="space-y-4">
                      {reviews.map((review) => (
                        <div key={review.id} className="border-b pb-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{review.userName}</span>
                              <div className="flex items-center">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    size={16}
                                    fill={i < review.rating ? '#fbbf24' : 'none'}
                                    className={i < review.rating ? 'text-yellow-400' : 'text-gray-300'}
                                  />
                                ))}
                              </div>
                            </div>
                            <span className="text-sm text-gray-500">
                              {new Date(review.createdAt).toLocaleDateString('vi-VN')}
                            </span>
                          </div>
                          <p className="text-gray-700">{review.comment}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-600">Chưa có đánh giá nào cho sản phẩm này.</p>
                  )}
                </div>
              )}

              {activeTab === 'analytics' && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Thống kê sản phẩm</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg text-center">
                      <BarChart3 className="mx-auto mb-2 text-blue-600" size={24} />
                      <p className="text-sm text-gray-600">Lượt xem</p>
                      <p className="text-2xl font-bold text-blue-600">N/A</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg text-center">
                      <Package className="mx-auto mb-2 text-green-600" size={24} />
                      <p className="text-sm text-gray-600">Đã bán</p>
                      <p className="text-2xl font-bold text-green-600">N/A</p>
                    </div>
                    <div className="bg-yellow-50 p-4 rounded-lg text-center">
                      <Star className="mx-auto mb-2 text-yellow-600" size={24} />
                      <p className="text-sm text-gray-600">Đánh giá</p>
                      <p className="text-2xl font-bold text-yellow-600">{averageRating.totalReviews}</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mt-4">
                    * Một số thống kê có thể chưa được triển khai đầy đủ
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default AdminProductDetail;

