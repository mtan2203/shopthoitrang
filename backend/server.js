const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const authRoutes = require('./api/routes/auth');
const productRoutes = require('./api/routes/products');
const orderRoutes = require('./api/routes/orders');
const inventoryRoutes = require('./api/routes/inventory');
const userRoutes = require('./api/routes/users');
const contactRoutes = require('./api/routes/contact');
const uploadRoutes = require('./api/routes/upload');
const upload3dRoutes = require('./api/routes/upload-3d'); // Thêm route upload 3D
const categoryRoutes = require('./api/routes/categories');
const wishlistRoutes = require('./api/routes/wishlist');
const cartRoutes = require('./api/routes/cart');
const couponRoutes = require('./api/routes/coupons');
const reviewsRouter = require('./api/routes/reviews');
const postsRouter = require('./api/routes/posts');
const statsRouter = require('./api/routes/stats');
const notificationsRouter = require('./api/routes/notifications');
const momoRoutes = require('./api/routes/momo');
const vnpayRoutes = require('./api/routes/vnpay');
//const shippingRoutes = require('./api/routes/shipping');
const adminRoutes = require('./api/routes/admin');
const twoFactorAuthRoutes = require('./api/routes/twoFactorAuth');
const chatRoutes = require('./api/routes/chat');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files - Regular uploads và 3D files
app.use('/uploads', express.static(path.join(__dirname, 'Uploads')));
app.use('/uploads/3d', express.static(path.join(__dirname, 'Uploads/3d'))); // Serve file 3D

// Route để tính phí vận chuyển qua GHTK
app.post('/api/shipping/fee', async (req, res) => {
  try {
    const GHTK_API_URL = 'https://services.giaohangtietkiem.vn/services/shipment/fee';
    const GHTK_TOKEN = '1X8VwuHVYhZSgm3VlIyFaCuYoAufRZLl044vplg';

    const payload = {
      pick_province: "Hồ Chí Minh",
      pick_district: "Thủ Đức",
      pick_ward: "Hiệp Phú",
      province: req.body.city,
      district: req.body.district || "Không xác định",
      ward: req.body.ward || "Không xác định",
      address: req.body.address,
      weight: 1000,
      value: req.body.orderValue || 0,
      transport: "road",
      deliver_option: "none"
    };

    console.log('[Server] Gửi POST /shipment/fee (GHTK):', payload);

    const response = await fetch(GHTK_API_URL, {
      method: 'POST',
      headers: {
        'Token': GHTK_TOKEN,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    console.log('[Server] Nhận từ POST /shipment/fee (GHTK) - Full response:', data);

    if (!response.ok) {
      throw new Error(data.message || 'Lỗi khi gọi API GHTK');
    }

    let shippingFee = 30000;
    if (data && data.fee && typeof data.fee === 'object' && data.fee.fee) {
      shippingFee = data.fee.fee;
    } else if (data && Array.isArray(data) && data.length > 0 && data[0].fee) {
      shippingFee = data[0].fee;
    }

    res.json({
      success: true,
      total: shippingFee,
      message: 'Tính phí thành công'
    });
  } catch (error) {
    console.error('[Server] Lỗi tính phí vận chuyển GHTK:', error.message);
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi tính phí vận chuyển'
    });
  }
});

// Route để lấy trạng thái đơn hàng từ GHTK
app.get('/api/shipping/status/:trackingOrder', async (req, res) => {
  try {
    const GHTK_API_URL = 'https://services.giaohangtietkiem.vn/services/shipment/v2/';
    const GHTK_TOKEN = '1X9O5N5fIDprjJxEdXrayhZNj1odUxCrjM9DxSs'; 
    const PARTNER_CODE = 'S22927274';
    const trackingOrder = req.params.trackingOrder;

    const url = `${GHTK_API_URL}${trackingOrder}`;
    console.log('[Server] Gửi GET /shipment/v2 (GHTK):', url);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Token': GHTK_TOKEN,
        'X-Client-Source': PARTNER_CODE,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    console.log('[Server] Nhận từ GET /shipment/v2 (GHTK) - Full response:', data);

    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Lỗi khi gọi API GHTK');
    }

    res.json({
      success: true,
      order: data.order,
      message: 'Lấy trạng thái đơn hàng thành công'
    });
  } catch (error) {
    console.error('[Server] Lỗi lấy trạng thái đơn hàng GHTK:', error.message);
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi lấy trạng thái đơn hàng'
    });
  }
});

// Routes - Thêm route upload 3D
app.use('/api/momo', momoRoutes);
app.use('/api/vnpay', vnpayRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/users', userRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/upload-3d', upload3dRoutes); // Route cho upload file 3D
app.use('/api/categories', categoryRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/reviews', reviewsRouter);
app.use('/api/posts', postsRouter);
app.use('/api/stats', statsRouter);
app.use('/api/notifications', notificationsRouter);
//app.use('/api/shipping', shippingRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/2fa', twoFactorAuthRoutes);
app.use('/api/chat', chatRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    features: {
      regularUpload: true,
      upload3D: true,
      shipping: true,
      payment: true
    }
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('[Server Error]:', error);
  res.status(500).json({
    success: false,
    message: 'Lỗi server nội bộ',
    error: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint không tồn tại',
    path: req.originalUrl
  });
});

// Khởi động server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server chạy trên cổng ${PORT}`);
  console.log('📁 Static files served from:');
  console.log('   - Regular uploads: /uploads');
  console.log('   - 3D files: /uploads/3d');
  console.log('🎯 3D Upload API: /api/upload-3d');
  console.log('💡 Health check: /api/health');
});