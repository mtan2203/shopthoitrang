const express = require('express');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const { runAsync, getAsync } = require('../../config/db');
const jwt = require('jsonwebtoken');
const router = express.Router();

// Middleware xác thực
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

// Tạo secret key và QR code để thiết lập 2FA
router.post('/setup', authenticate, async (req, res) => {
  try {
    // Chỉ cho phép vai trò admin thiết lập 2FA
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Chỉ admin mới có thể thiết lập 2FA' });
    }

    // Lấy thông tin người dùng
    const user = await getAsync('SELECT * FROM users WHERE id = ?', [req.user.id]);
    if (!user) {
      return res.status(404).json({ message: 'Người dùng không tồn tại' });
    }

    // Tạo secret key mới
    const secret = speakeasy.generateSecret({
      name: `XYZ Fashion Admin (${user.email})` // Tên hiển thị trong ứng dụng Google Authenticator
    });

    // Lưu secret tạm thời (chưa kích hoạt) vào session hoặc database
    // Ở đây ta lưu trực tiếp vào DB nhưng chưa kích hoạt 2FA
    await runAsync(
      'UPDATE users SET twoFactorSecret = ? WHERE id = ?',
      [secret.base32, req.user.id]
    );

    // Tạo QR code
    const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url);

    // Trả về thông tin cho client
    res.json({
      message: 'Đã tạo secret key để thiết lập 2FA',
      secret: secret.base32, // Cần hiển thị để người dùng có thể nhập thủ công
      qrCodeUrl // QR code để quét bằng ứng dụng
    });
  } catch (error) {
    console.error('Lỗi thiết lập 2FA:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Xác minh và kích hoạt 2FA
router.post('/verify', authenticate, async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ message: 'Vui lòng cung cấp mã xác thực' });
    }

    // Lấy secret từ database
    const user = await getAsync('SELECT * FROM users WHERE id = ?', [req.user.id]);
    if (!user || !user.twoFactorSecret) {
      return res.status(400).json({ message: 'Chưa thiết lập 2FA' });
    }

    // Xác minh token
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token,
      window: 1 // Cho phép sai lệch 1 bước thời gian (30 giây trước/sau)
    });

    if (!verified) {
      return res.status(400).json({ message: 'Mã xác thực không đúng' });
    }

    // Kích hoạt 2FA nếu chưa được kích hoạt
    if (!user.twoFactorEnabled) {
      await runAsync(
        'UPDATE users SET twoFactorEnabled = TRUE WHERE id = ?',
        [req.user.id]
      );
    }

    res.json({
      message: '2FA đã được kích hoạt',
      enabled: true
    });
  } catch (error) {
    console.error('Lỗi xác minh 2FA:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Vô hiệu hóa 2FA
router.post('/disable', authenticate, async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ message: 'Vui lòng cung cấp mã xác thực' });
    }

    // Lấy secret từ database
    const user = await getAsync('SELECT * FROM users WHERE id = ?', [req.user.id]);
    if (!user || !user.twoFactorEnabled) {
      return res.status(400).json({ message: '2FA chưa được kích hoạt' });
    }

    // Xác minh token
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token,
      window: 1
    });

    if (!verified) {
      return res.status(400).json({ message: 'Mã xác thực không đúng' });
    }

    // Vô hiệu hóa 2FA
    await runAsync(
      'UPDATE users SET twoFactorEnabled = FALSE, twoFactorSecret = NULL WHERE id = ?',
      [req.user.id]
    );

    res.json({
      message: 'Đã vô hiệu hóa 2FA',
      enabled: false
    });
  } catch (error) {
    console.error('Lỗi vô hiệu hóa 2FA:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Kiểm tra trạng thái 2FA
router.get('/status', authenticate, async (req, res) => {
  try {
    const user = await getAsync('SELECT twoFactorEnabled FROM users WHERE id = ?', [req.user.id]);
    res.json({
      enabled: user ? user.twoFactorEnabled : false
    });
  } catch (error) {
    console.error('Lỗi kiểm tra trạng thái 2FA:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Xác thực mã 2FA khi đăng nhập
router.post('/validate', async (req, res) => {
  try {
    const { userId, token } = req.body;
    if (!userId || !token) {
      return res.status(400).json({ message: 'Thiếu thông tin cần thiết' });
    }

    // Lấy thông tin người dùng
    const user = await getAsync('SELECT * FROM users WHERE id = ?', [userId]);
    if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
      return res.status(400).json({ message: 'Người dùng không tồn tại hoặc chưa kích hoạt 2FA' });
    }

    // Xác minh token
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token,
      window: 1
    });

    if (!verified) {
      return res.status(400).json({ message: 'Mã xác thực không đúng' });
    }

    // Tạo JWT token với thông tin đã xác thực 2FA
    const jwtToken = jwt.sign(
      { 
        id: user.id, 
        role: user.role, 
        is_vip: user.is_vip,
        twoFactorAuthenticated: true 
      }, 
      'secret_key', 
      { expiresIn: '1d' }
    );

    res.json({
      message: 'Xác thực 2FA thành công',
      userId: user.id,
      username: user.username,
      role: user.role,
      is_vip: user.is_vip,
      total_spent: user.total_spent || 0,
      token: jwtToken
    });
  } catch (error) {
    console.error('Lỗi xác thực 2FA:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

module.exports = router;