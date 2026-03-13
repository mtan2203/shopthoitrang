const express = require('express');
const router = express.Router();
const { runAsync, allAsync } = require('../../config/db'); // Sử dụng các hàm từ db.js
const jwt = require('jsonwebtoken');

const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Chưa đăng nhập' });
  }

  try {
    const decoded = jwt.verify(token, 'secret_key');
    req.user = decoded;
    next();
  } catch (error) {
    res.status(403).json({ message: 'Token không hợp lệ' });
  }
};

const restrictTo = (role) => {
  return (req, res, next) => {
    if (req.user.role !== role) {
      return res.status(403).json({ message: 'Không có quyền truy cập' });
    }
    next();
  };
};

// Route để admin lấy danh sách người dùng
router.get('/', authenticate, restrictTo('admin'), async (req, res) => {
  try {
    const users = await allAsync('SELECT id, username, email, role, is_locked, locked_until, total_spent, is_vip FROM users');
    res.json({ users });
  } catch (err) {
    console.error('Lỗi lấy danh sách người dùng:', err);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Route để người dùng tự cập nhật thông tin của mình (username, phone_number)
router.put('/:id', authenticate, async (req, res) => {
  const { id } = req.params;
  const { username, phone_number } = req.body;

  if (req.user.id !== parseInt(id)) {
    return res.status(403).json({ message: 'Không có quyền chỉnh sửa thông tin người dùng khác' });
  }

  if (!username) {
    return res.status(400).json({ message: 'Vui lòng cung cấp username' });
  }

  try {
    const result = await runAsync(
      'UPDATE users SET username = ?, phone_number = ? WHERE id = ?',
      [username, phone_number, id]
    );
    if (result.changes === 0) {
      return res.status(500).json({ message: 'Lỗi cập nhật thông tin' });
    }
    res.json({ message: 'Cập nhật thông tin thành công' });
  } catch (err) {
    console.error('Lỗi cập nhật thông tin:', err);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Route để admin xóa người dùng
router.delete('/:id', authenticate, restrictTo('admin'), async (req, res) => {
  try {
    const result = await runAsync('DELETE FROM users WHERE id = ?', [req.params.id]);
    if (result.changes === 0) {
      return res.status(404).json({ message: 'Người dùng không tồn tại' });
    }
    res.json({ message: 'Xóa người dùng thành công' });
  } catch (err) {
    console.error('Lỗi xóa người dùng:', err);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Route để admin khóa tài khoản người dùng
router.put('/:id/lock', authenticate, restrictTo('admin'), async (req, res) => {
  const { id } = req.params;
  const { days } = req.body; // Số ngày khóa tài khoản

  if (!days || days <= 0) {
    return res.status(400).json({ message: 'Vui lòng cung cấp số ngày khóa hợp lệ' });
  }

  const lockedUntil = new Date();
  lockedUntil.setDate(lockedUntil.getDate() + parseInt(days));
  const lockedUntilFormatted = lockedUntil.toISOString().slice(0, 19).replace('T', ' '); // Định dạng cho MySQL

  try {
    const result = await runAsync(
      'UPDATE users SET is_locked = 1, locked_until = ? WHERE id = ?',
      [lockedUntilFormatted, id]
    );
    if (result.changes === 0) {
      return res.status(404).json({ message: 'Người dùng không tồn tại' });
    }
    res.json({ message: `Khóa tài khoản thành công đến ${lockedUntilFormatted}` });
  } catch (err) {
    console.error('Lỗi khóa tài khoản:', err);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Route để admin mở khóa tài khoản người dùng
router.put('/:id/unlock', authenticate, restrictTo('admin'), async (req, res) => {
  const { id } = req.params;

  try {
    const result = await runAsync(
      'UPDATE users SET is_locked = 0, locked_until = NULL WHERE id = ?',
      [id]
    );
    if (result.changes === 0) {
      return res.status(404).json({ message: 'Người dùng không tồn tại' });
    }
    res.json({ message: 'Mở khóa tài khoản thành công' });
  } catch (err) {
    console.error('Lỗi mở khóa tài khoản:', err);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

module.exports = router;