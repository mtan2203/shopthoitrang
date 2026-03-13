const express = require('express');
const router = express.Router();
const db = require('../../config/db');
const { authenticate } = require('../middleware/auth');

// Lấy danh sách yêu thích của user
router.get('/', authenticate, async (req, res) => {
  try {
    const rows = await db.allAsync(
      `SELECT w.id, w.userId, w.productId, p.*, c.name as categoryName
       FROM wishlist w
       JOIN products p ON w.productId = p.id
       LEFT JOIN categories c ON p.categoryId = c.id
       WHERE w.userId = ?`,
      [req.user.id]
    );
    
    const formattedRows = rows.map(row => {
      let sizes = [];
      let colors = [];
      try {
        sizes = row.sizes ? JSON.parse(row.sizes) : [];
      } catch (err) {
        console.error(`[Wishlist] Error parsing sizes for product ${row.id}:`, err.message);
        sizes = row.sizes ? row.sizes.split(',').filter(Boolean) : [];
      }
      try {
        colors = row.colors ? JSON.parse(row.colors) : [];
      } catch (err) {
        console.error(`[Wishlist] Error parsing colors for product ${row.id}:`, err.message);
        colors = row.colors ? row.colors.split(',').filter(Boolean) : [];
      }
      return {
        ...row,
        sizes,
        colors
      };
    });
    console.log('[Wishlist] Lấy danh sách yêu thích:', { userId: req.user.id, count: rows.length });
    res.json({ wishlist: formattedRows });
  } catch (err) {
    console.error('[Wishlist] Lỗi lấy danh sách yêu thích:', err.message);
    res.status(500).json({ message: 'Lỗi khi lấy danh sách yêu thích: ' + err.message });
  }
});

// Thêm sản phẩm vào danh sách yêu thích
router.post('/', authenticate, async (req, res) => {
  const { productId } = req.body;
  const userId = req.user.id;
  
  if (!productId) {
    console.log('[Wishlist] Thiếu productId:', req.body);
    return res.status(400).json({ message: 'Thiếu ID sản phẩm' });
  }
  
  try {
    // Kiểm tra xem sản phẩm có tồn tại không
    const product = await db.getAsync('SELECT id FROM products WHERE id = ?', [productId]);
    
    if (!product) {
      console.log('[Wishlist] Sản phẩm không tồn tại:', productId);
      return res.status(404).json({ message: 'Sản phẩm không tồn tại' });
    }
    
    // Kiểm tra xem đã có trong wishlist chưa
    const existing = await db.getAsync(
      'SELECT id FROM wishlist WHERE userId = ? AND productId = ?',
      [userId, productId]
    );
    
    if (existing) {
      console.log('[Wishlist] Sản phẩm đã có trong wishlist:', { userId, productId });
      return res.status(400).json({ message: 'Sản phẩm đã có trong danh sách yêu thích' });
    }
    
    // Thêm vào wishlist
    await db.runAsync(
      'INSERT INTO wishlist (userId, productId) VALUES (?, ?)',
      [userId, productId]
    );
    console.log('[Wishlist] Thêm sản phẩm vào wishlist:', { userId, productId });
    res.status(201).json({ message: 'Đã thêm vào danh sách yêu thích' });
  } catch (err) {
    console.error('[Wishlist] Lỗi thêm vào wishlist:', err.message);
    res.status(500).json({ message: 'Lỗi khi thêm vào yêu thích: ' + err.message });
  }
});

// Xóa sản phẩm khỏi danh sách yêu thích
router.delete('/:productId', authenticate, async (req, res) => {
  const { productId } = req.params;
  const userId = req.user.id;
  
  try {
    const result = await db.runAsync(
      'DELETE FROM wishlist WHERE userId = ? AND productId = ?',
      [userId, productId]
    );
    
    if (result.changes === 0) {
      console.log('[Wishlist] Sản phẩm không có trong wishlist:', { userId, productId });
      return res.status(404).json({ message: 'Sản phẩm không có trong danh sách yêu thích' });
    }
    console.log('[Wishlist] Xóa sản phẩm khỏi wishlist:', { userId, productId });
    res.json({ message: 'Đã xóa khỏi danh sách yêu thích' });
  } catch (err) {
    console.error('[Wishlist] Lỗi xóa khỏi wishlist:', err.message);
    res.status(500).json({ message: 'Lỗi khi xóa khỏi yêu thích: ' + err.message });
  }
});

// Kiểm tra sản phẩm có trong wishlist không
router.get('/check/:productId', authenticate, async (req, res) => {
  const { productId } = req.params;
  const userId = req.user.id;
  
  try {
    const row = await db.getAsync(
      'SELECT id FROM wishlist WHERE userId = ? AND productId = ?',
      [userId, productId]
    );
    console.log('[Wishlist] Kiểm tra wishlist:', { userId, productId, isInWishlist: !!row });
    res.json({ isInWishlist: !!row });
  } catch (err) {
    console.error('[Wishlist] Lỗi kiểm tra wishlist:', err.message);
    res.status(500).json({ message: 'Lỗi khi kiểm tra wishlist: ' + err.message });
  }
});

module.exports = router;