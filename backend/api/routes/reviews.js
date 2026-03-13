const express = require('express');
const router = express.Router();
const { runAsync, getAsync, allAsync } = require('../../config/db');
const { authenticate } = require('../middleware/auth');

const queryAsync = async (sql, params = [], retries = 5, delay = 300) => {
  let attempts = 0;
  while (attempts < retries) {
    try {
      const result = await runAsync(sql, params);
      return {
        changes: result.changes || 0,
        lastID: result.lastID || null
      };
    } catch (err) {
      if (err.code === 'ER_LOCK_DEADLOCK' && attempts < retries - 1) {
        attempts++;
        console.log(`[Reviews] ER_LOCK_DEADLOCK, thử lại lần ${attempts} sau ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        throw err;
      }
    }
  }
  throw new Error('Max retries reached');
};

// Thêm endpoint để lấy tất cả reviews
router.get('/all', async (req, res) => {
  try {
    const reviews = await allAsync(
      'SELECT r.*, u.username FROM reviews r JOIN users u ON r.userId = u.id ORDER BY r.createdAt DESC'
    );
    res.json({ reviews });
  } catch (err) {
    console.error('[Reviews] Lỗi lấy tất cả đánh giá:', err.message);
    res.status(500).json({ message: 'Lỗi khi lấy tất cả đánh giá: ' + err.message });
  }
});

// Thêm đánh giá mới
router.post('/', authenticate, async (req, res) => {
  const { productId, rating, comment } = req.body;
  if (!productId || !rating || rating < 1 || rating > 5) {
    return res.status(400).json({ message: 'Thông tin không hợp lệ: productId và rating (1-5) là bắt buộc' });
  }

  try {
    const order = await getAsync(
      `SELECT o.id 
       FROM orders o 
       JOIN order_items oi ON o.id = oi.orderId 
       WHERE o.userId = ? AND oi.productId = ? AND o.status = 'delivered'`,
      [req.user.id, productId]
    );

    if (!order) {
      return res.status(403).json({ message: 'Bạn chỉ có thể đánh giá sản phẩm sau khi hoàn thành đơn hàng' });
    }

    const existingReview = await getAsync(
      'SELECT id FROM reviews WHERE userId = ? AND productId = ?',
      [req.user.id, productId]
    );
    if (existingReview) {
      return res.status(400).json({ message: 'Bạn đã đánh giá sản phẩm này rồi' });
    }

    await queryAsync(
      'INSERT INTO reviews (userId, productId, rating, comment) VALUES (?, ?, ?, ?)',
      [req.user.id, productId, rating, comment || '']
    );
    res.status(201).json({ message: 'Đánh giá thành công' });
  } catch (err) {
    console.error('[Reviews] Lỗi thêm đánh giá:', err.message);
    res.status(500).json({ message: 'Lỗi khi thêm đánh giá: ' + err.message });
  }
});

// Lấy danh sách đánh giá của sản phẩm
router.get('/product/:productId', async (req, res) => {
  const { productId } = req.params;
  try {
    const reviews = await allAsync(
      'SELECT r.*, u.username FROM reviews r JOIN users u ON r.userId = u.id WHERE r.productId = ? ORDER BY r.createdAt DESC',
      [productId]
    );
    res.json({ reviews });
  } catch (err) {
    console.error('[Reviews] Lỗi lấy đánh giá:', err.message);
    res.status(500).json({ message: 'Lỗi khi lấy đánh giá: ' + err.message });
  }
});

// Lấy trung bình điểm đánh giá của sản phẩm
router.get('/average/:productId', async (req, res) => {
  const { productId } = req.params;
  try {
    const result = await getAsync(
      'SELECT AVG(rating) as averageRating, COUNT(*) as totalReviews FROM reviews WHERE productId = ?',
      [productId]
    );
    res.json({
      averageRating: result.averageRating ? parseFloat(result.averageRating.toFixed(1)) : 0,
      totalReviews: result.totalReviews || 0
    });
  } catch (err) {
    console.error('[Reviews] Lỗi tính trung bình đánh giá:', err.message);
    res.status(500).json({ message: 'Lỗi khi tính trung bình đánh giá: ' + err.message });
  }
});

// Kiểm tra xem người dùng đã đánh giá sản phẩm chưa
router.get('/check/:productId', authenticate, async (req, res) => {
  const { productId } = req.params;
  try {
    const existingReview = await getAsync(
      'SELECT id FROM reviews WHERE userId = ? AND productId = ?',
      [req.user.id, productId]
    );
    res.json({ hasReviewed: !!existingReview });
  } catch (err) {
    console.error('[Reviews] Lỗi kiểm tra trạng thái đánh giá:', err.message);
    res.status(500).json({ message: 'Lỗi khi kiểm tra trạng thái đánh giá: ' + err.message });
  }
});

module.exports = router;