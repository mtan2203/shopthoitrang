import axios from 'axios';

// Sử dụng baseURL từ proxy server
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    console.log('[API] Request:', config.method.toUpperCase(), config.url, 'Token:', token ? 'Present' : 'Missing');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('[API] Request error:', error);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    console.log('[API] Response:', response.config.method.toUpperCase(), response.config.url, 'Status:', response.status);
    return response;
  },
  (error) => {
    console.error('[API] Response error:', error.response?.status, error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Auth APIs
export const login = (email, password) => api.post('/auth/login', { email, password });
export const register = (username, email, password, role) =>
  api.post('/auth/register', { username, email, password, role });
export const requestPasswordReset = (email) => api.post('/auth/forgot-password', { email });
export const resetPassword = (token, password) => api.post('/auth/reset-password', { token, password });
export const changePassword = async (oldPassword, newPassword) => {
  try {
    console.log('[API] Gửi POST /auth/change-password:', { oldPassword, newPassword });
    const response = await api.post('/auth/change-password', { oldPassword, newPassword });
    console.log('[API] Nhận từ POST /auth/change-password:', response.data);
    return response;
  } catch (error) {
    console.error('[API] Lỗi đổi mật khẩu:', error.response?.data || error.message);
    throw error;
  }
};

// Shipping APIs
export const calculateShippingGHTK = async (shippingData) => {
  try {
    const PROXY_API_URL = '/shipping/fee'; // Sử dụng endpoint của server (tương đối với baseURL)

    const payload = {
      city: shippingData.city,
      district: shippingData.district || "Không xác định",
      ward: shippingData.ward || "Không xác định",
      address: shippingData.address,
      orderValue: shippingData.orderValue || 0
    };

    console.log('[API] Gửi POST /shipping/fee (Server):', payload);

    const response = await api.post(PROXY_API_URL, payload); // Sử dụng api instance để tự động thêm baseURL

    console.log('[API] Nhận từ POST /shipping/fee (Server):', response.data);
    return response.data;
  } catch (error) {
    console.error('[API] Lỗi tính phí vận chuyển GHTK:', error.response?.data || error.message);
    throw error;
  }
};

export const getOrderStatusGHTK = async (trackingOrder) => {
  try {
    console.log('[API] Gửi GET /shipping/status (Server):', trackingOrder);
    const response = await api.get(`/shipping/status/${trackingOrder}`);
    console.log('[API] Nhận từ GET /shipping/status (Server):', response.data);
    return response.data;
  } catch (error) {
    console.error('[API] Lỗi lấy trạng thái đơn hàng GHTK:', error.response?.data || error.message);
    throw error;
  }
};

export const updateTrackingOrder = async (orderId, trackingOrder) => {
  try {
    console.log('[API] Gửi PUT /orders/:id/tracking-order:', { orderId, trackingOrder });
    const response = await api.put(`/orders/${orderId}/tracking-order`, { trackingOrder });
    console.log('[API] Nhận từ PUT /orders/:id/tracking-order:', response.data);
    return response.data;
  } catch (error) {
    console.error('[API] Lỗi cập nhật mã vận đơn:', error.response?.data || error.message);
    throw error;
  }
};

export const calculateShipping = async (data) => {
  try {
    console.log('[API] Gửi POST /shipping/calculate-shipping:', data);
    const response = await api.post('/shipping/calculate-shipping', data);
    console.log('[API] Nhận từ POST /shipping/calculate-shipping:', response.data);
    return response.data;
  } catch (error) {
    console.error('[API] Lỗi tính phí vận chuyển:', error.response?.data || error.message);
    throw error;
  }
};

// Product APIs
export const getProducts = (params) => api.get('/products/search', { params });
export const getOutOfStockProducts = (params) => api.get('/products/out-of-stock', { params });
export const getProductById = (id) => api.get(`/products/${id}`);
export const createProduct = (productData) => api.post('/products', productData);
export const updateProduct = (id, productData) => api.put(`/products/${id}`, productData);
export const deleteProduct = (id) => api.delete(`/products/${id}`);
export const updateInventory = (productId, data) => api.put(`/products/inventory/${productId}`, data);

// User Management APIs
export const getUsers = () => api.get('/users');
export const deleteUser = (id) => api.delete(`/users/${id}`);
export const updateUser = (id, userData) => api.put(`/users/${id}`, userData);
export const lockUser = async (id, days) => {
  try {
    console.log('[API] Gửi PUT /users/:id/lock:', { id, days });
    const response = await api.put(`/users/${id}/lock`, { days });
    console.log('[API] Nhận từ PUT /users/:id/lock:', response.data);
    return response;
  } catch (error) {
    console.error('[API] Lỗi khóa tài khoản:', error.response?.data || error.message);
    throw error;
  }
};
export const unlockUser = async (id) => {
  try {
    console.log('[API] Gửi PUT /users/:id/unlock:', { id });
    const response = await api.put(`/users/${id}/unlock`);
    console.log('[API] Nhận từ PUT /users/:id/unlock:', response.data);
    return response;
  } catch (error) {
    console.error('[API] Lỗi mở khóa tài khoản:', error.response?.data || error.message);
    throw error;
  }
};

// Image Upload API
export const uploadImage = (formData, key = 'image') =>
  api.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

// Stock Import API
export const importStock = (formData) =>
  api.post('/admin/import-stock', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

// Order APIs
export const createOrder = async (orderData) => {
  try {
    console.log('[API] Gửi POST /orders:', orderData);
    const response = await api.post('/orders', orderData);
    console.log('[API] Nhận từ POST /orders:', response.data);
    return response;
  } catch (error) {
    console.error('[API] Lỗi tạo đơn hàng:', error.response?.data || error.message);
    throw error;
  }
};

export const createMoMoPayment = async (orderId) => {
  try {
    console.log('[API] Gửi POST /momo/create-payment:', { orderId });
    const response = await api.post('/momo/create-payment', { orderId });
    console.log('[API] Nhận từ POST /momo/create-payment:', response.data);
    return response.data;
  } catch (error) {
    console.error('[API] Lỗi tạo thanh toán MoMo:', error.response?.data || error.message);
    throw error;
  }
};

export const createVNPayPayment = async (amount, orderId) => {
  try {
    console.log('[API] Gửi POST /vnpay/create-payment:', { amount, orderId });
    const response = await api.post('/vnpay/create-payment', { amount, orderId });
    console.log('[API] Nhận từ POST /vnpay/create-payment:', response.data);
    return response.data;
  } catch (error) {
    console.error('[API] Lỗi tạo thanh toán VNPay:', error.response?.data || error.message);
    throw error;
  }
};

export const getOrders = () => api.get('/orders');
export const getOrderById = (id) => api.get(`/orders/${id}`);
export const cancelOrder = (id) => api.put(`/orders/${id}/cancel`);
export const updateOrderStatus = (id, status) => api.put(`/orders/${id}/status`, { status });
export const deleteOrder = (id) => api.delete(`/orders/${id}`);
export const checkPurchaseStatus = (productId) => api.get(`/orders/check-purchase/${productId}`);

// Coupon APIs
export const validateCoupon = async (code, cartTotal) => {
  try {
    console.log('[API] Gửi POST /coupons/validate:', { code, cartTotal });
    const response = await api.post('/coupons/validate', { code, cartTotal });
    console.log('[API] Nhận từ POST /coupons/validate:', response.data);
    return response;
  } catch (error) {
    console.error('[API] Lỗi validate coupon:', error.response?.data || error.message);
    throw error;
  }
};

export const getCoupons = async () => {
  try {
    console.log('[API] Gửi GET /coupons');
    const response = await api.get('/coupons');
    console.log('[API] Nhận từ GET /coupons:', response.data);
    return response;
  } catch (error) {
    console.error('[API] Lỗi lấy coupons:', error.response?.data || error.message);
    throw error;
  }
};

export const getPublicCoupons = async () => {
  try {
    console.log('[API] Gửi GET /coupons/public');
    const response = await api.get('/coupons/public');
    console.log('[API] Nhận từ GET /coupons/public:', response.data);
    return response;
  } catch (error) {
    console.error('[API] Lỗi lấy public coupons:', error.response?.data || error.message);
    throw error;
  }
};

export const createCoupon = (couponData) => api.post('/coupons', couponData);
export const updateCoupon = (id, couponData) => api.put(`/coupons/${id}`, couponData);
export const deleteCoupon = (id) => api.delete(`/coupons/${id}`);

export const claimCoupon = async (couponId) => {
  try {
    console.log('[API] Gửi POST /coupons/claim:', couponId);
    const response = await api.post(`/coupons/claim/${couponId}`);
    console.log('[API] Nhận từ POST /coupons/claim:', response.data);
    return response.data;
  } catch (error) {
    console.error('[API] Lỗi khi lấy mã giảm giá:', error.response?.data || error.message);
    throw error;
  }
};
export const getClaimedCouponsByUser = async () => {
  try {
    console.log('[API] Gửi GET /coupons/user-claims');
    const response = await api.get('/coupons/user-claims');
    console.log('[API] Nhận từ GET /coupons/user-claims:', response.data);
    return response.data;
  } catch (error) {
    console.error('[API] Lỗi khi lấy mã đã claim:', error.response?.data || error.message);
    throw error;
  }
};

// Dashboard Statistics API
export const getDashboardStats = async (timeRange = 'all') => {
  try {
    console.log('[API] Gửi GET /stats/dashboard', { timeRange });
    const response = await api.get('/stats/dashboard', { params: { timeRange } });
    console.log('[API] Nhận từ GET /stats/dashboard:', response.data);
    return response;
  } catch (error) {
    console.error('[API] Lỗi lấy thống kê dashboard:', error.response?.data || error.message);
    throw error;
  }
};

export const getRevenueStats = async (timeRange = 'all', groupBy = 'month') => {
  try {
    console.log('[API] Gửi GET /stats/revenue', { timeRange, groupBy });
    const response = await api.get('/stats/revenue', { params: { timeRange, groupBy } });
    console.log('[API] Nhận từ GET /stats/revenue:', response.data);
    return response;
  } catch (error) {
    console.error('[API] Lỗi lấy thống kê doanh thu:', error.response?.data || error.message);
    throw error;
  }
};

// Notifications APIs
export const getNotifications = async () => {
  try {
    console.log('[API] Gửi GET /notifications');
    const response = await api.get('/notifications');
    console.log('[API] Nhận từ GET /notifications:', response.data);
    return response;
  } catch (error) {
    console.error('[API] Lỗi lấy thông báo:', error.response?.data || error.message);
    throw error;
  }
};

export const markNotificationAsRead = async (id) => {
  try {
    console.log('[API] Gửi PUT /notifications/:id/read', { id });
    const response = await api.put(`/notifications/${id}/read`);
    console.log('[API] Nhận từ PUT /notifications/:id/read:', response.data);
    return response;
  } catch (error) {
    console.error('[API] Lỗi đánh dấu thông báo đã đọc:', error.response?.data || error.message);
    throw error;
  }
};

export const deleteNotification = async (id) => {
  try {
    console.log('[API] Gửi DELETE /notifications/:id', { id });
    const response = await api.delete(`/notifications/${id}`);
    console.log('[API] Nhận từ DELETE /notifications/:id:', response.data);
    return response;
  } catch (error) {
    console.error('[API] Lỗi xóa thông báo:', error.response?.data || error.message);
    throw error;
  }
};

// Category APIs
export const getCategories = () => api.get('/categories');
export const createCategory = (name) => api.post('/categories', { name });
export const updateCategory = (id, name) => api.put(`/categories/${id}`, { name });
export const deleteCategory = (id) => api.delete(`/categories/${id}`);

// Wishlist APIs
export const getWishlist = () => api.get('/wishlist');
export const addToWishlist = (productId) => api.post('/wishlist', { productId });
export const removeFromWishlist = (productId) => api.delete(`/wishlist/${productId}`);
export const checkWishlist = (productId) => api.get(`/wishlist/check/${productId}`);

// Cart APIs
export const getCart = () => api.get('/cart');
export const addToCart = (productId, quantity, size, color) =>
  api.post('/cart', { productId, quantity, size, color });
export const updateCartItem = (productId, quantity, size, color) =>
  api.put(`/cart/${productId}`, { quantity, size, color });
export const removeFromCart = (productId, size, color) =>
  api.delete(`/cart/${productId}`, { params: { size, color } });
export const clearCart = () => api.delete('/cart');

// Review APIs
export const submitReview = (reviewData) => api.post('/reviews', reviewData);
export const getReviews = (productId) => api.get(`/reviews/product/${productId}`);
export const getAverageRating = (productId) => api.get(`/reviews/average/${productId}`);
export const checkReviewStatus = (productId) => api.get(`/reviews/check/${productId}`);
export const getAllReviews = () => api.get('/reviews/all');

// Posts APIs
export const getPosts = () => api.get('/posts');
export const createPost = (postData) => api.post('/posts', postData);
export const updatePost = (id, postData) => api.put(`/posts/${id}`, postData);
export const deletePost = (id) => api.delete(`/posts/${id}`);
export const getComments = (postId) => api.get(`/posts/${postId}/comments`);
export const addComment = (postId, content) => api.post(`/posts/${postId}/comments`, { content });
export const addReply = (postId, commentId, content) => api.post(`/posts/${postId}/comments/${commentId}/reply`, { content });
export const deleteComment = (postId, commentId) => api.delete(`/posts/${postId}/comments/${commentId}`);

export default api;