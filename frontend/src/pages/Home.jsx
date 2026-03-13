import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { getPosts, getProducts, getCategories, getReviews } from '../services/api';
import { Helmet } from 'react-helmet-async';
import { ChevronLeft, ChevronRight, Star, ShoppingBag, ArrowRight, Instagram, Heart } from 'lucide-react';

// Định nghĩa base URL của backend
const BACKEND_BASE_URL = 'http://localhost:5000';

const Home = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [blogPosts, setBlogPosts] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState({
    products: true,
    categories: true,
    blogPosts: true,
    reviews: true,
  });
  const [currentSlide, setCurrentSlide] = useState(0);
  const sliderRef = useRef(null);
  const sliderInterval = useRef(null);

  // Slide mẫu 
  const heroSlides = [
    {
      id: 1,
      image: "https://mensfolio.vn/wp-content/uploads/2024/06/LVVVTHUMB2.jpg",
      title: "Bộ Sưu Tập Hè 2025",
      subtitle: "Khám phá những xu hướng mới nhất",
      cta: "Mua Sắm Ngay"
    },
    {
      id: 2,
      image: "https://www.louisvuitton.com/images/is/image/lv/M_BC_SHOWSS25_DL2_02_DI3.jpg?wid=2400",
      title: "Phong Cách Thanh Lịch",
      subtitle: "Thời trang công sở hàng đầu",
      cta: "Khám Phá"
    },
    {
      id: 3,
      image: "https://vn.louisvuitton.com/images/is/image//content/dam/lv/editorial-content/brand-content-coremedia/women/2025/collection/prefall2025/WOMEN_PRE-FALL_25_IMG%2004_LVCOM_2048x1152_DI3.jpg?wid=2400",
      title: "Thời Trang Dạo Phố",
      subtitle: "Thoải mái & phong cách mỗi ngày",
      cta: "Xem Ngay"
    }
  ];

  // Lookbook mẫumẫu
  const lookbookItems = [
    {
      id: 1,
      image: "https://bazaarvietnam.vn/wp-content/uploads/2023/02/6-cap-doi-thoi-trang-noi-tieng-tren-duong-pho-thoi-trang-2023-bia.jpg",
      title: "Street Style",
      description: "Phong cách đường phố cá tính"
    },
    {
      id: 2,
      image: "https://cdn.santino.com.vn/storage/upload/news/2023/12/thoi-trang-nam-lich-lam-12.jpg",
      title: "Office Chic",
      description: "Thanh lịch nơi công sở"
    },
    {
      id: 3,
      image: "https://cdn.shopify.com/s/files/1/0681/2821/1221/files/6.3_480x480.png?v=1697013825",
      title: "Casual Weekend",
      description: "Cuối tuần thoải mái"
    }
  ];

 // Data mẫu cho đánh giágiá
  const testimonials = [
    {
      id: 1,
      name: "Nguyễn Văn Nam",
      avatar: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=1887&auto=format&fit=crop&ixlib=rb-4.0.3",
      rating: 5,
      comment: "Tôi rất hài lòng với chất lượng sản phẩm và dịch vụ. Đây là lần thứ 3 tôi mua hàng tại đây và chắc chắn sẽ quay lại."
    },
    {
      id: 2,
      name: "Trần Thị Linh",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=1887&auto=format&fit=crop&ixlib=rb-4.0.3",
      rating: 4,
      comment: "Sản phẩm chất lượng, giao hàng nhanh. Đôi khi size hơi khác so với mô tả nhưng nhìn chung rất tốt."
    },
    {
      id: 3,
      name: "Lê Văn Cường",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=1887&auto=format&fit=crop&ixlib=rb-4.0.3",
      rating: 5,
      comment: "Đồ đẹp, chất lượng, đúng với mô tả. Nhân viên tư vấn nhiệt tình, giao hàng nhanh."
    }
  ];

  const instagramPosts = [
    "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1920&auto=format&fit=crop&ixlib=rb-4.0.3",
    "https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=1920&auto=format&fit=crop&ixlib=rb-4.0.3",
    "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?q=80&w=1887&auto=format&fit=crop&ixlib=rb-4.0.3",
    "https://images.unsplash.com/photo-1485230895905-ec40ba36b9bc?q=80&w=1920&auto=format&fit=crop&ixlib=rb-4.0.3",
    "https://images.unsplash.com/photo-1581044777550-4cfa60707c03?q=80&w=1886&auto=format&fit=crop&ixlib=rb-4.0.3",
    "https://images.unsplash.com/photo-1496747611176-843222e1e57c?q=80&w=2073&auto=format&fit=crop&ixlib=rb-4.0.3"
  ];

  // Hàm định nghĩa ngày kết thúc chương trình khuyến mãi
  const saleEndDate = new Date("2025-06-30T23:59:59");
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  // Hàm gọi API để lấy dữ liệu
  useEffect(() => { 
    const fetchData = async () => {
      try {
        // Hàm lấy sản phẩm
        const productsResponse = await getProducts({
          limit: 8,
          onSale: 'true',
          sort: 'newest'
        });
        let fetchedProducts = productsResponse.data.products;
        setProducts(fetchedProducts.slice(0, 8));
        setLoading(prev => ({ ...prev, products: false }));

        // Hàm lấy danh mục sản phẩm
        const categoriesResponse = await getCategories();
        let fetchedCategories = categoriesResponse.data.categories;
     fetchedCategories = fetchedCategories.map(cat => {
  switch (cat.name.toLowerCase()) {
    case 'quần':
      return { ...cat, image: 'https://cdn-i.vtcnews.vn/resize/th/upload/2021/03/14/009-vie-6330-1615434222-07044944.jpg' };
    case 'áo':
      return { ...cat, image: 'https://kenh14cdn.com/203336854389633024/2024/12/18/thiet-ke-chua-co-ten-74-17345306742201444577796-1734535450913-1734535451012379683628.png' };
    case 'phụ kiện':
      return { ...cat, image: 'https://file.hstatic.net/200000456445/file/tui-lv-hop-vuong_bfa2e3d348f04e55bbbf5a1001b8645a_2048x2048.jpg' };
    case 'giày dép':
      return { ...cat, image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ80TFIM2xj7ELjBsk3yydLVDR8RT1fff41bQ&s' };
    default:
      return { ...cat, image: 'https://media.vneconomy.vn/images/upload/2022/07/19/lv-trainer-01-1200x633-1920x860-0.jpg' };
  }
});
        setCategories(fetchedCategories);
        setLoading(prev => ({ ...prev, categories: false }));

        // Hàm lấy bài viết blog
        const blogResponse = await getPosts();
        setBlogPosts(blogResponse.data.posts);
        setLoading(prev => ({ ...prev, blogPosts: false }));

        // Hàm lấy đánh giá sản phẩm
        const productIds = fetchedProducts.map(p => p.id);
        let allReviews = [];
        for (const productId of productIds) {
          const reviewResponse = await getReviews(productId);
          const productReviews = reviewResponse.data.reviews || [];
          allReviews = [...allReviews, ...productReviews.map(review => ({
            ...review,
            productId
          }))];
        }
        allReviews.sort((a, b) => b.rating - a.rating);
        setReviews(allReviews.slice(0, 3));
        setLoading(prev => ({ ...prev, reviews: false }));
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();

    sliderInterval.current = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % heroSlides.length);
    }, 5000);

    // Hàm cập nhật thời gian còn lại cho sale
    const timerInterval = setInterval(() => {
      const now = new Date();
      const difference = saleEndDate - now;
      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((difference % (1000 * 60)) / 1000)
        });
      }
    }, 1000);

    return () => {
      clearInterval(sliderInterval.current);
      clearInterval(timerInterval);
    };
  }, []);
  
  const nextSlide = () => {
    clearInterval(sliderInterval.current);
    setCurrentSlide((currentSlide + 1) % heroSlides.length);
    sliderInterval.current = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % heroSlides.length);
    }, 5000);
  };
  // Hàm chuyển đến slide trước
  const prevSlide = () => {
    clearInterval(sliderInterval.current);
    setCurrentSlide((currentSlide - 1 + heroSlides.length) % heroSlides.length);
    sliderInterval.current = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % heroSlides.length);
    }, 5000);
  };
  // Hàm định dạng ngày tháng
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };
  // Hàm tạo khung xương sống cho sản phẩm
  const SkeletonCard = () => (
    <div className="bg-white shadow-lg rounded-lg overflow-hidden animate-pulse">
      <div className="w-full h-72 bg-gray-200"></div>
      <div className="p-4 space-y-3">
        <div className="h-6 bg-gray-200 rounded w-3/4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        <div className="h-10 bg-gray-200 rounded"></div>
      </div>
    </div>
  );

  // Hàm xử lý URL ảnh
  const getImageUrl = (imagePath) => {
    if (!imagePath) return 'https://via.placeholder.com/600x400?text=No+Image';
    return imagePath.startsWith('http') || imagePath.startsWith('https')
      ? imagePath
      : `${BACKEND_BASE_URL}${imagePath}`;
  };
  // trả về giao diện chính của trang chủ
  return ( 
    <div className="bg-gray-50">
      <Helmet>
        <title>Thời Trang XYZ - Phong Cách Thời Thượng</title>
        <meta name="description" content="Khám phá xu hướng thời trang mới nhất tại Thời Trang XYZ. Sản phẩm chất lượng, thiết kế độc đáo, giao hàng nhanh chóng." />
      </Helmet>

      {/* Hero Slider */}
      <section className="relative h-screen overflow-hidden">
        <div 
          ref={sliderRef}
          className="relative h-full w-full transition-all duration-700 ease-in-out"
          style={{ transform: `translateX(-${currentSlide * 100}%)` }}
        >
          <div className="absolute top-0 left-0 w-full h-full flex">
            {heroSlides.map((slide, index) => (
              <div 
                key={slide.id} 
                className="h-full w-full flex-shrink-0"
                style={{ left: `${index * 100}%` }}
              >
                <div className="relative h-full">
                  <img 
                    src={slide.image} 
                    alt={slide.title} 
                    className="w-full h-full object-cover object-center"
                    loading={index === 0 ? "eager" : "lazy"}
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                    <div className="text-center px-4 max-w-3xl mx-auto">
                      <h1 className="text-5xl md:text-6xl font-bold text-white drop-shadow-lg mb-4 opacity-0 animate-fadeIn">
                        {slide.title}
                      </h1>
                      <p className="text-xl md:text-2xl text-white drop-shadow-lg mb-8 opacity-0 animate-fadeIn animation-delay-300">
                        {slide.subtitle}
                      </p>
                      <Link 
                        to="/san-pham" 
                        className="inline-block bg-white text-gray-900 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-colors opacity-0 animate-fadeIn animation-delay-600"
                      >
                        {slide.cta}
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Slider Controls */}
        <button 
          className="absolute top-1/2 left-4 transform -translate-y-1/2 bg-white bg-opacity-50 p-2 rounded-full hover:bg-opacity-75 transition-all z-10"
          onClick={prevSlide}
        >
          <ChevronLeft className="w-8 h-8 text-gray-800" />
        </button>
        <button 
          className="absolute top-1/2 right-4 transform -translate-y-1/2 bg-white bg-opacity-50 p-2 rounded-full hover:bg-opacity-75 transition-all z-10"
          onClick={nextSlide}
        >
          <ChevronRight className="w-8 h-8 text-gray-800" />
        </button>

        {/* Slider Indicators */}
        <div className="absolute bottom-5 left-1/2 transform -translate-x-1/2 flex space-x-2 z-10">
          {heroSlides.map((_, index) => (
            <button
              key={index}
              className={`w-3 h-3 rounded-full ${
                currentSlide === index ? 'bg-white' : 'bg-white bg-opacity-50'
              }`}
              onClick={() => {
                clearInterval(sliderInterval.current);
                setCurrentSlide(index);
                sliderInterval.current = setInterval(() => {
                  setCurrentSlide(prev => (prev + 1) % heroSlides.length);
                }, 5000);
              }}
            />
          ))}
        </div>
      </section>

      {/* Featured Categories */}
      <section className="container mx-auto py-16 px-4">
        <div className="flex items-center justify-between mb-10">
          <h2 className="text-3xl font-bold text-gray-800">Danh Mục Nổi Bật</h2>
          <Link to="/danh-muc" className="flex items-center text-blue-600 hover:text-blue-800 transition-colors">
            <span className="mr-1">Xem tất cả</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading.categories ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {Array(4).fill().map((_, index) => (
              <div key={index} className="aspect-square rounded-xl overflow-hidden bg-gray-200 animate-pulse"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {categories.slice(0, 4).map((category) => (
              <Link
                key={category.id}
                to={`/danh-muc/${category.id}`}
                className="group relative rounded-xl overflow-hidden aspect-square transform hover:scale-105 transition-all duration-300"
              >
                <img
                  src={category.image}
                  alt={category.name}
                  className="w-full h-full object-cover object-center"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80 group-hover:opacity-90 transition-opacity"></div>
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <h3 className="text-xl font-bold text-white">{category.name}</h3>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Sale Countdown */}
      <section className="bg-gray-900 py-16">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="text-center md:text-left mb-8 md:mb-0">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Khuyến Mãi Mùa Hè</h2>
              <p className="text-xl text-gray-300 mb-6">Giảm giá lên đến 50% cho tất cả sản phẩm</p>
              <Link 
                to="/khuyen-mai" 
                className="inline-block bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors"
              >
                Mua Ngay
              </Link>
            </div>
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-white bg-opacity-10 p-4 rounded-lg text-center">
                <span className="block text-3xl font-bold text-white">{timeLeft.days}</span>
                <span className="text-gray-300">Ngày</span>
              </div>
              <div className="bg-white bg-opacity-10 p-4 rounded-lg text-center">
                <span className="block text-3xl font-bold text-white">{timeLeft.hours}</span>
                <span className="text-gray-300">Giờ</span>
              </div>
              <div className="bg-white bg-opacity-10 p-4 rounded-lg text-center">
                <span className="block text-3xl font-bold text-white">{timeLeft.minutes}</span>
                <span className="text-gray-300">Phút</span>
              </div>
              <div className="bg-white bg-opacity-10 p-4 rounded-lg text-center">
                <span className="block text-3xl font-bold text-white">{timeLeft.seconds}</span>
                <span className="text-gray-300">Giây</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="container mx-auto py-16 px-4">
        <div className="flex items-center justify-between mb-10">
          <h2 className="text-3xl font-bold text-gray-800">Sản Phẩm Nổi Bật</h2>
          <Link to="/san-pham" className="flex items-center text-blue-600 hover:text-blue-800 transition-colors">
            <span className="mr-1">Xem tất cả</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading.products ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {Array(4).fill().map((_, index) => (
              <SkeletonCard key={index} />
            ))}
          </div>
        ) : products.length === 0 ? (
          <p className="text-center text-gray-600">Chưa có sản phẩm nào.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {products.slice(0, 4).map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow group"
              >
                <div className="relative overflow-hidden">
                  <img
                    src={product.image || 'https://via.placeholder.com/300x400?text=No+Image'}
                    alt={product.name}
                    className="w-full h-72 object-cover object-center group-hover:scale-110 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <div className="flex space-x-2">
                      <button className="bg-white p-2 rounded-full hover:bg-gray-100 transition-colors">
                        <ShoppingBag className="w-5 h-5 text-gray-800" />
                      </button>
                      <button className="bg-white p-2 rounded-full hover:bg-gray-100 transition-colors">
                        <Heart className="w-5 h-5 text-gray-800" />
                      </button>
                    </div>
                  </div>
                  {product.discount_price && (
                    <span className="absolute top-2 right-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">
                      Giảm {(100 * (product.price - product.discount_price) / product.price).toFixed(0)}%
                    </span>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-800 truncate">{product.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    {product.discount_price ? (
                      <>
                        <p className="text-gray-500 line-through text-sm">{product.price.toLocaleString()} VNĐ</p>
                        <p className="text-red-600 font-bold">{product.discount_price.toLocaleString()} VNĐ</p>
                      </>
                    ) : (
                      <p className="text-gray-800 font-semibold">{product.price.toLocaleString()} VNĐ</p>
                    )}
                  </div>
                  <Link
                    to={`/san-pham/${product.id}`}
                    className="mt-3 block text-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Xem Chi Tiết
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Lookbook/Outfit Ideas */}
      <section className="py-16 bg-gray-100">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-800 text-center mb-10">Lookbook Xu Hướng</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {lookbookItems.map((item) => (
              <div 
                key={item.id}
                className="relative group overflow-hidden rounded-xl"
              >
                <img 
                  src={item.image} 
                  alt={item.title} 
                  className="w-full h-96 object-cover object-center group-hover:scale-110 transition-transform duration-500"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent opacity-70"></div>
                <div className="absolute bottom-0 left-0 right-0 p-6 transform translate-y-2 group-hover:translate-y-0 transition-transform">
                  <h3 className="text-2xl font-bold text-white mb-2">{item.title}</h3>
                  <p className="text-gray-200 mb-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">{item.description}</p>
                  <Link 
                    to="/lookbook" 
                    className="inline-block bg-white text-gray-900 px-4 py-2 rounded-lg font-medium hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition duration-300"
                  >
                    Khám Phá
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      {/* <section className="container mx-auto py-16 px-4">
        <h2 className="text-3xl font-bold text-gray-800 text-center mb-10">Khách Hàng Nói Gì</h2>
        {loading.reviews ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {Array(3).fill().map((_, index) => (
              <div key={index} className="bg-white p-6 rounded-xl shadow-lg animate-pulse">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 rounded-full bg-gray-200 mr-4"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                    <div className="h-4 bg-gray-200 rounded w-16"></div>
                  </div>
                </div>
                <div className="h-16 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        ) : reviews.length === 0 ? (
          <p className="text-center text-gray-600">Chưa có đánh giá nào.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {reviews.map((review) => (
              <div 
                key={review.id}
                className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow"
              >
                <div className="flex items-center mb-4">
                  <img 
                    src={'https://via.placeholder.com/50?text=User'}
                    alt={review.author}
                    className="w-12 h-12 rounded-full object-cover mr-4"
                    loading="lazy"
                  />
                  <div>
                    <h4 className="font-semibold text-gray-800">{review.author}</h4>
                    <div className="flex">
                      {Array(5).fill().map((_, i) => (
                        <Star 
                          key={i}
                          className={`w-4 h-4 ${i < review.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                          fill={i < review.rating ? 'currentColor' : 'none'}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-gray-600 italic">{review.comment}</p>
              </div>
            ))}
          </div>
        )}
      </section> */}


      <section className="container mx-auto py-16 px-4">
        <h2 className="text-3xl font-bold text-gray-800 text-center mb-10">Khách Hàng Nói Gì</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial) => (
            <div 
              key={testimonial.id}
              className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow"
            >
              <div className="flex items-center mb-4">
                <img 
                  src={testimonial.avatar}
                  alt={testimonial.name}
                  className="w-12 h-12 rounded-full object-cover mr-4"
                  loading="lazy"
                />
                <div>
                  <h4 className="font-semibold text-gray-800">{testimonial.name}</h4>
                  <div className="flex">
                    {Array(5).fill().map((_, i) => (
                      <Star 
                        key={i}
                        className={`w-4 h-4 ${i < testimonial.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                        fill={i < testimonial.rating ? 'currentColor' : 'none'}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <p className="text-gray-600 italic">{testimonial.comment}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Blog Posts */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-10">
            <h2 className="text-3xl font-bold text-gray-800">Bài Viết Thời Trang</h2>
            <Link to="/bai-viet" className="flex items-center text-blue-600 hover:text-blue-800 transition-colors">
              <span className="mr-1">Xem tất cả</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {loading.blogPosts ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {Array(3).fill().map((_, index) => (
                <div key={index} className="bg-white rounded-xl overflow-hidden shadow animate-pulse">
                  <div className="w-full h-56 bg-gray-200"></div>
                  <div className="p-6 space-y-3">
                    <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-16 bg-gray-200 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : blogPosts.length === 0 ? (
            <p className="text-center text-gray-600">Chưa có bài viết nào.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {blogPosts.slice(0, 3).map((post) => (
                <Link 
                  key={post.id}
                  to={`/bai-viet/${post.id}`}
                  className="bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow group"
                >
                  <div className="relative h-56 overflow-hidden">
                    <img 
                      src={getImageUrl(post.image)}
                      alt={post.title}
                      className="w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-500"
                      loading="lazy"
                    />
                    <div className="absolute bottom-0 left-0 bg-blue-600 text-white px-3 py-1 text-sm">
                      {formatDate(post.createdAt)}
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-gray-800 mb-2 group-hover:text-blue-600 transition-colors">{post.title}</h3>
                    <p className="text-gray-600 line-clamp-2">{post.content}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Instagram Feed */}
      <section className="container mx-auto py-16 px-4">
        <div className="flex items-center justify-center mb-10">
          <Instagram className="w-6 h-6 text-gray-800 mr-2" />
          <h2 className="text-3xl font-bold text-gray-800">Instagram</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {instagramPosts.map((post, index) => (
            <a 
              key={index}
              href="https://l.instagram.com/?u=http%3A%2F%2Fon.louisvuitton.com%2F60092VAeN%3Ffbclid%3DPAZXh0bgNhZW0CMTEAAafK1EPKPuddZWCEVmjFvtQjX3nANwvnPKMucwL1suTcA544OkWUSsxn3fOviw_aem_uQNoa3RLk78ZSQb5yBV5Mg&e=AT2bd2J3uyo7xWSEgdfltLXCzpR3u0f_wLAOf19RW7L_6MPOjGcBxn6qzhPt0NUP2TyZpG7Gkul9-8z08TO2YMwn6wQeC8zXxSOqCsI"
              target="_blank"
              rel="noopener noreferrer"
              className="block relative aspect-square overflow-hidden group"
            >
              <img 
                src={post}
                alt="Instagram post"
                className="w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-500"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Instagram className="w-8 h-8 text-white" />
              </div>
            </a>
          ))}
        </div>
        <div className="text-center mt-8">
          <a 
            href="https://www.instagram.com/louisvuitton/"
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center text-gray-800 font-medium hover:text-blue-600 transition-colors"
          >
            Theo dõi chúng tôi trên Instagram
            <ArrowRight className="w-4 h-4 ml-1" />
          </a>
        </div>
      </section>

      {/* Newsletter Signup */}
      <section className="bg-blue-600 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-white mb-4">Đăng Ký Nhận Tin</h2>
            <p className="text-blue-100 mb-8">Đăng ký để nhận thông tin về sản phẩm mới, khuyến mãi và các xu hướng thời trang mới nhất.</p>
            <form className="flex flex-col sm:flex-row gap-4 max-w-lg mx-auto">
              <input
                type="email"
                placeholder="Email của bạn"
                className="flex-1 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300"
                required
              />
              <button
                type="submit"
                className="px-6 py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
              >
                Đăng Ký
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* CSS for animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.8s forwards;
        }
        
        .animation-delay-300 {
          animation-delay: 0.3s;
        }
        
        .animation-delay-600 {
          animation-delay: 0.6s;
        }
        
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
};

export default Home;