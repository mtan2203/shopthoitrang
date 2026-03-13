const express = require('express');
const router = express.Router();
const { runAsync, allAsync } = require('../../config/db');
const { authenticate } = require('../middleware/auth');

router.get('/', authenticate, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Chỉ admin có quyền xem tồn kho.' });
  }

  try {
    const products = await allAsync('SELECT id, name, stock FROM products');
    res.json({ inventory: products });
  } catch (err) {
    console.error('Lỗi khi lấy tồn kho:', err);
    res.status(500).json({ message: 'Lỗi server: ' + err.message });
  }
});

router.put('/:productId', authenticate, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Chỉ admin có quyền cập nhật tồn kho.' });
  }

  const { stock } = req.body;
  if (!Number.isInteger(stock) || stock < 0) {
    return res.status(400).json({ message: 'Số lượng tồn kho không hợp lệ' });
  }

  try {
    const result = await runAsync(
      'UPDATE products SET stock = ? WHERE id = ?',
      [stock, req.params.productId]
    );
    if (result.changes === 0) {
      return res.status(404).json({ message: 'Sản phẩm không tồn tại' });
    }
    res.json({ productId: req.params.productId, stock });
  } catch (err) {
    console.error('Lỗi khi cập nhật tồn kho:', err);
    res.status(500).json({ message: 'Lỗi server: ' + err.message });
  }
});

module.exports = router;