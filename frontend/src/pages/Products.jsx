import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { getProducts, getCategories, checkWishlist } from '../services/api';
import { toast } from 'react-toastify';
import { Helmet } from 'react-helmet-async';
import { Filter, ShoppingCart } from 'lucide-react';
import { CartContext } from '../context/CartContext';

const Products = () => {
  const { addToCart } = useContext(CartContext);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [categoryId, setCategoryId] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [minRating, setMinRating] = useState('');
  const [onSale, setOnSale] = useState(false);
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [availableColors, setAvailableColors] = useState([]);
  const [availableSizes, setAvailableSizes] = useState([]);
  const [availableBrands, setAvailableBrands] = useState([]);
  const [wishlistStatus, setWishlistStatus] = useState({});
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [sort, setSort] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [productsPerPage] = useState(12);
  const [totalProducts, setTotalProducts] = useState(0);
  const [showQuickAddModal, setShowQuickAddModal] = useState(false);
  const [quickAddProduct, setQuickAddProduct] = useState(null);
  const [quickAddSize, setQuickAddSize] = useState('');
  const [quickAddColor, setQuickAddColor] = useState('');
  const [quickAddQuantity, setQuickAddQuantity] = useState(1);

  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsAuthenticated(!!token);

    const fetchData = async () => {
      try {
        setLoading(true);
        
        const params = {
          page: currentPage,
          limit: productsPerPage,
        };

        if (search) params.q = search;
        if (categoryId) params.categoryId = categoryId;
        if (minPrice) params.minPrice = minPrice;
        if (maxPrice) params.maxPrice = maxPrice;
        if (minRating) params.minRating = minRating;
        if (onSale) params.onSale = 'true';
        if (selectedColor) params.color = selectedColor;
        if (selectedSize) params.size = selectedSize;
        if (selectedBrand) params.brand = selectedBrand;
        if (sort) params.sort = sort;

        const [productRes, categoryRes] = await Promise.all([
          getProducts(params),
          getCategories(),
        ]);
        
        const fetchedProducts = productRes.data.products;
        setProducts(fetchedProducts);
        setTotalProducts(productRes.data.total); // Sử dụng total từ API
        setCategories(categoryRes.data.categories);

        const colors = [...new Set(fetchedProducts.flatMap(p => p.colors || []))].filter(Boolean);
        const sizes = [...new Set(fetchedProducts.flatMap(p => p.sizes || []))].filter(Boolean);
        const brands = [...new Set(fetchedProducts.map(p => p.brand).filter(Boolean))];
        setAvailableColors(colors);
        setAvailableSizes(sizes);
        setAvailableBrands(brands);

        if (token) {
          checkWishlistStatus(fetchedProducts);
        }
      } catch (err) {
        toast.error('Lỗi tải sản phẩm: ' + (err.response?.data?.message || err.message));
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [search, categoryId, minPrice, maxPrice, minRating, onSale, selectedColor, selectedSize, selectedBrand, sort, currentPage]);

  const checkWishlistStatus = async (products) => {
    try {
      const productIds = products.map((p) => p.id);
      const results = {};

      await Promise.all(
        productIds.map(async (id) => {
          try {
            const res = await checkWishlist(id);
            results[id] = res.data.isInWishlist;
          } catch (err) {
            console.error(`Lỗi kiểm tra wishlist cho sản phẩm ${id}:`, err);
            results[id] = false;
          }
        })
      );

      setWishlistStatus(results);
    } catch (err) {
      console.error('Lỗi kiểm tra wishlist:', err);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(e.target.search.value);
    setSuggestions([]);
    setCurrentPage(1); // Reset về trang đầu khi tìm kiếm
  };

  const handleSearchInput = async (e) => {
    const value = e.target.value;
    setSearch(value);
    if (value.length > 2) {
      try {
        const res = await fetch(`http://localhost:5000/api/products/autocomplete?q=${value}`);
        const data = await res.json();
        setSuggestions(data.products.slice(0, 5));
      } catch (err) {
        console.error('Lỗi lấy gợi ý tìm kiếm:', err);
      }
    } else {
      setSuggestions([]);
    }
  };

  const handleResetFilters = () => {
    setCategoryId('');
    setMinPrice('');
    setMaxPrice('');
    setMinRating('');
    setOnSale(false);
    setSelectedColor('');
    setSelectedSize('');
    setSelectedBrand('');
    setShowFilterModal(false);
    setCurrentPage(1); // Reset về trang đầu khi xóa bộ lọc
  };

  const handleApplyFilters = () => {
    setShowFilterModal(false);
    setCurrentPage(1); // Reset về trang đầu khi áp dụng bộ lọc
  };

  const handleQuickAddToCart = (product) => {
    if (product.stock === 0) {
      toast.error('Sản phẩm hiện tại đã hết hàng!');
      return;
    }
    setQuickAddProduct(product);
    setQuickAddSize('');
    setQuickAddColor('');
    setQuickAddQuantity(1);
    setShowQuickAddModal(true);
  };

  const handleConfirmQuickAdd = async () => {
    if (!quickAddSize) {
      toast.error('Vui lòng chọn kích thước');
      return;
    }
    if (!quickAddColor) {
      toast.error('Vui lòng chọn màu sắc');
      return;
    }
    if (quickAddQuantity < 1 || !Number.isInteger(quickAddQuantity)) {
      toast.error('Số lượng phải là số nguyên lớn hơn 0');
      return;
    }
    if (quickAddQuantity > quickAddProduct.stock) {
      toast.error(`Số lượng vượt quá tồn kho (${quickAddProduct.stock})`);
      return;
    }

    try {
      await addToCart(quickAddProduct, quickAddQuantity, { size: quickAddSize, color: quickAddColor });
      toast.success(`Bạn đã thêm sản phẩm ${quickAddProduct.name} vào giỏ hàng!`);
      setShowQuickAddModal(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi thêm vào giỏ hàng');
    }
  };

  const SkeletonCard = () => (
    <div className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
      <div className="w-full h-72 bg-gray-200"></div>
      <div className="p-4 space-y-3">
        <div className="h-6 bg-gray-200 rounded w-3/4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      </div>
    </div>
  );

  const totalPages = Math.ceil(totalProducts / productsPerPage);

  return (
    <div className="container mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <Helmet>
        <title>Sản Phẩm - Thời Trang XYZ</title>
      </Helmet>
      <h1 className="text-4xl font-bold mb-8 text-gray-800 text-center">Danh Sách Sản Phẩm</h1>

      {/* Thanh tìm kiếm, sắp xếp và nút lọc */}
      <div className="mb-8 flex flex-col md:flex-row gap-4 items-center justify-between">
        <form onSubmit={handleSearch} className="flex w-full md:w-1/2 gap-4 items-center relative">
          <input
            type="text"
            name="search"
            placeholder="Tìm kiếm sản phẩm..."
            value={search}
            onChange={handleSearchInput}
            className="flex-1 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {suggestions.length > 0 && (
            <ul className="absolute z-10 bg-white border rounded-lg w-full mt-12 shadow-lg">
              {suggestions.map((suggestion) => (
                <li
                  key={suggestion.id}
                  className="p-2 hover:bg-gray-100 cursor-pointer"
                  onClick={() => {
                    setSearch(suggestion.name);
                    setSuggestions([]);
                  }}
                >
                  {suggestion.name}
                </li>
              ))}
            </ul>
          )}
          <button
            type="submit"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Tìm
          </button>
        </form>
        <div className="flex gap-4">
          <select
            value={sort}
            onChange={(e) => {
              setSort(e.target.value);
              setCurrentPage(1); // Reset về trang đầu khi thay đổi sắp xếp
            }}
            className="p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Sắp xếp mặc định</option>
            <option value="price_asc">Giá: Thấp đến cao</option>
            <option value="price_desc">Giá: Cao đến thấp</option>
            <option value="newest">Mới nhất</option>
            <option value="rating_desc">Đánh giá cao nhất</option>
          </select>
          <button
            onClick={() => setShowFilterModal(true)}
            className="flex items-center gap-2 bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors"
          >
            <Filter size={20} />
            Lọc sản phẩm
          </button>
        </div>
      </div>

      {/* Modal bộ lọc */}
      {showFilterModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Lọc Sản Phẩm</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-gray-600 mb-2">Danh mục:</label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Tất cả danh mục</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-gray-600 mb-2">Giá tối thiểu:</label>
                  <input
                    type="number"
                    placeholder="Giá tối thiểu"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-gray-600 mb-2">Giá tối đa:</label>
                  <input
                    type="number"
                    placeholder="Giá tối đa"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-gray-600 mb-2">Đánh giá tối thiểu:</label>
                <select
                  value={minRating}
                  onChange={(e) => setMinRating(e.target.value)}
                  className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Tất cả đánh giá</option>
                  <option value="5">5 sao</option>
                  <option value="4">4 sao trở lên</option>
                  <option value="3">3 sao trở lên</option>
                  <option value="2">2 sao trở lên</option>
                  <option value="1">1 sao trở lên</option>
                </select>
              </div>
              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={onSale}
                    onChange={(e) => setOnSale(e.target.checked)}
                    className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="text-gray-600">Chỉ hiển thị sản phẩm giảm giá</span>
                </label>
              </div>
              <div>
                <label className="block text-gray-600 mb-2">Màu sắc:</label>
                <select
                  value={selectedColor}
                  onChange={(e) => setSelectedColor(e.target.value)}
                  className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Tất cả màu sắc</option>
                  {availableColors.map((color) => (
                    <option key={color} value={color}>{color}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-gray-600 mb-2">Kích thước:</label>
                <select
                  value={selectedSize}
                  onChange={(e) => setSelectedSize(e.target.value)}
                  className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Tất cả kích thước</option>
                  {availableSizes.map((size) => (
                    <option key={size} value={size}>{size}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-gray-600 mb-2">Thương hiệu:</label>
                <select
                  value={selectedBrand}
                  onChange={(e) => setSelectedBrand(e.target.value)}
                  className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Tất cả thương hiệu</option>
                  {availableBrands.map((brand) => (
                    <option key={brand} value={brand}>{brand}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setShowFilterModal(false)}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
              >
                Hủy
              </button>
              <button
                onClick={handleResetFilters}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
              >
                Xóa bộ lọc
              </button>
              <button
                onClick={handleApplyFilters}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Áp dụng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal thêm nhanh vào giỏ hàng */}
      {showQuickAddModal && quickAddProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Thêm vào giỏ hàng</h2>
            <p className="text-gray-600 mb-4">{quickAddProduct.name}</p>
            <div className="space-y-4">
              <div>
                <label className="block text-gray-600 mb-2">Kích cỡ:</label>
                <select
                  value={quickAddSize}
                  onChange={(e) => setQuickAddSize(e.target.value)}
                  className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Chọn kích cỡ</option>
                  {quickAddProduct.sizes.map((size) => (
                    <option key={size} value={size}>{size}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-gray-600 mb-2">Màu sắc:</label>
                <select
                  value={quickAddColor}
                  onChange={(e) => setQuickAddColor(e.target.value)}
                  className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Chọn màu sắc</option>
                  {quickAddProduct.colors.map((color) => (
                    <option key={color} value={color}>{color}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-gray-600 mb-2">Số lượng:</label>
                <input
                  type="number"
                  value={quickAddQuantity}
                  onChange={(e) => setQuickAddQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="1"
                  max={quickAddProduct.stock}
                  disabled={quickAddProduct.stock === 0}
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setShowQuickAddModal(false)}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
              >
                Hủy
              </button>
              <button
                onClick={handleConfirmQuickAdd}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                disabled={quickAddProduct.stock === 0}
              >
                Thêm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Danh sách sản phẩm */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {Array(productsPerPage)
            .fill()
            .map((_, index) => (
              <SkeletonCard key={index} />
            ))}
        </div>
      ) : products.length === 0 ? (
        <p className="text-center text-gray-600">Không tìm thấy sản phẩm nào.</p>
      ) : (
        <>
          <p className="text-gray-600 mb-4">Tìm thấy {totalProducts} sản phẩm</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
              >
                <Link to={`/san-pham/${product.id}`}>
                  <div className="relative">
                    <img
                      src={product.image || 'https://via.placeholder.com/300x400'}
                      alt={product.name}
                      className="w-full h-72 object-cover object-center"
                      loading="lazy"
                    />
                    {product.discount_price && (
                      <span className="absolute top-2 right-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">
                        Giảm {(100 * (product.price - product.discount_price) / product.price).toFixed(0)}%
                      </span>
                    )}
                    {product.stock === 0 && (
                      <span className="absolute top-2 left-2 bg-gray-600 text-white text-xs font-bold px-2 py-1 rounded">
                        Hết hàng
                      </span>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2 line-clamp-1">{product.name}</h3>
                    <div className="flex items-center gap-2">
                      {product.discount_price ? (
                        <>
                          <p className="text-gray-500 line-through text-sm">{product.price.toLocaleString()} VNĐ</p>
                          <p className="text-red-600 font-bold">{product.discount_price.toLocaleString()} VNĐ</p>
                        </>
                      ) : (
                        <p className="text-gray-800 font-semibold">{product.price.toLocaleString()} VNĐ</p>
                      )}
                    </div>
                    {product.brand && (
                      <p className="text-sm text-gray-600 mt-1">Thương hiệu: {product.brand}</p>
                    )}
                    <p className="text-sm text-gray-600 mt-1">Tồn kho: {product.stock}</p>
                  </div>
                </Link>
                <button
                  onClick={() => handleQuickAddToCart(product)}
                  className={`w-full px-4 py-2 transition-colors flex items-center justify-center gap-2 ${
                    product.stock === 0
                      ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                  disabled={product.stock === 0}
                >
                  <ShoppingCart size={20} />
                  {product.stock === 0 ? 'Hết hàng' : 'Thêm vào giỏ hàng'}
                </button>
              </div>
            ))}
          </div>
          {/* Phân trang */}
          {totalPages > 1 && (
            <div className="mt-6 flex justify-center space-x-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-4 py-2 rounded-lg ${currentPage === page ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                >
                  {page}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Products;