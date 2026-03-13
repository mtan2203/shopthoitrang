const express = require('express');
const router = express.Router();
const { runAsync, getAsync, allAsync } = require('../../config/db');
const { authenticate, restrictTo } = require('../middleware/auth');

// Lấy tất cả danh mục
router.get('/', async (req, res) => {
  try {
    const rows = await allAsync('SELECT * FROM categories');
    console.log('[GET /categories] Categories fetched:', rows);
    res.json({ categories: rows });
  } catch (err) {
    console.error('Lỗi khi truy vấn danh mục:', err);
    res.status(500).json({ message: 'Lỗi server: ' + err.message });
  }
});

// Thêm danh mục
router.post('/', authenticate, restrictTo('admin'), async (req, res) => {
  const { name } = req.body;
  console.log('[POST /categories] Request body:', req.body);
  if (!name) return res.status(400).json({ message: 'Tên danh mục là bắt buộc' });

  try {
    const result = await runAsync('INSERT INTO categories (name) VALUES (?)', [name]);
    console.log('[POST /categories] Category added, id:', result.lastID);
    res.status(201).json({ id: result.lastID, name });
  } catch (err) {
    console.error('Lỗi khi thêm danh mục:', err);
    res.status(500).json({ message: 'Lỗi thêm danh mục: ' + err.message });
  }
});

// Sửa danh mục
router.put('/:id', authenticate, restrictTo('admin'), async (req, res) => {
  const { name } = req.body;
  const { id } = req.params;
  console.log('[PUT /categories/:id] Request:', { id, name });
  if (!name) return res.status(400).json({ message: 'Tên danh mục là bắt buộc' });

  try {
    const result = await runAsync('UPDATE categories SET name = ? WHERE id = ?', [name, id]);
    if (result.changes === 0) {
      console.log('[PUT /categories/:id] Category not found:', id);
      return res.status(404).json({ message: 'Danh mục không tồn tại' });
    }
    console.log('[PUT /categories/:id] Category updated:', id);
    res.json({ id, name });
  } catch (err) {
    console.error('Lỗi khi sửa danh mục:', err);
    res.status(500).json({ message: 'Lỗi sửa danh mục: ' + err.message });
  }
});

// Xóa danh mục
router.delete('/:id', authenticate, restrictTo('admin'), async (req, res) => {
  const { id } = req.params;
  console.log('[DELETE /categories/:id] Request:', id);

  try {
    const row = await getAsync('SELECT COUNT(*) as count FROM products WHERE categoryId = ?', [id]);
    if (row.count > 0) {
      console.log('[DELETE /categories/:id] Cannot delete, products exist:', row.count);
      return res.status(400).json({ message: 'Không thể xóa vì có sản phẩm liên quan' });
    }

    const result = await runAsync('DELETE FROM categories WHERE id = ?', [id]);
    if (result.changes === 0) {
      console.log('[DELETE /categories/:id] Category not found:', id);
      return res.status(404).json({ message: 'Danh mục không tồn tại' });
    }

    console.log('[DELETE /categories/:id] Category deleted:', id);
    res.json({ message: 'Xóa danh mục thành công' });
  } catch (err) {
    console.error('Lỗi khi xóa danh mục:', err);
    res.status(500).json({ message: 'Lỗi xóa danh mục: ' + err.message });
  }
});

module.exports = router;