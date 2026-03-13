const express = require('express');
const router = express.Router();
const db = require('../../config/db');
const { authenticate } = require('../middleware/auth');

// API lấy danh sách thông báo của user
router.get('/', authenticate, async (req, res) => {
  try {
    const notifications = await db.allAsync(
      `SELECT * FROM notifications 
       WHERE userId = ? OR userId IS NULL 
       ORDER BY createdAt DESC`,
      [req.user.id]
    );
    res.json(notifications);
  } catch (err) {
    console.error('[Notifications] Lỗi lấy thông báo:', err.message);
    res.status(500).json({ message: 'Lỗi server: ' + err.message });
  }
});

// API đánh dấu thông báo là đã đọc
router.put('/:id/read', authenticate, async (req, res) => {
  try {
    const result = await db.runAsync(
      `UPDATE notifications SET isRead = 1 WHERE id = ? AND (userId = ? OR userId IS NULL)`,
      [req.params.id, req.user.id]
    );
    if (result.changes === 0) {
      return res.status(404).json({ message: 'Thông báo không tồn tại hoặc bạn không có quyền.' });
    }
    res.json({ message: 'Đánh dấu đã đọc thành công' });
  } catch (err) {
    console.error('[Notifications] Lỗi đánh dấu đã đọc:', err.message);
    res.status(500).json({ message: 'Lỗi server: ' + err.message });
  }
});

// API xóa thông báo
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const result = await db.runAsync(
      `DELETE FROM notifications WHERE id = ? AND (userId = ? OR userId IS NULL)`,
      [req.params.id, req.user.id]
    );
    if (result.changes === 0) {
      return res.status(404).json({ message: 'Thông báo không tồn tại hoặc bạn không có quyền.' });
    }
    res.json({ message: 'Xóa thông báo thành công' });
  } catch (err) {
    console.error('[Notifications] Lỗi xóa thông báo:', err.message);
    res.status(500).json({ message: 'Lỗi server: ' + err.message });
  }
});

module.exports = router;