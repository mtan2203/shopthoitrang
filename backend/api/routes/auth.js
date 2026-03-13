const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { runAsync, getAsync } = require('../../config/db');
const rateLimit = require('express-rate-limit');
const crypto = require('crypto');
const router = express.Router();

// Cấu hình Google OAuth
const { OAuth2Client } = require('google-auth-library');
const GOOGLE_CLIENT_ID = '741537137809-hr2g9hkvha16n049ruvrsbka63p0bt1g.apps.googleusercontent.com';
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

// Giới hạn số lần đăng nhập
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 5,
});

// Middleware xác thực token
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

router.post('/register', async (req, res) => {
  const { username, email, password, role } = req.body;
  console.log('Request body:', req.body);
  if (!username || !email || !password) {
    return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('Inserting user:', { username, email, role });
    const result = await runAsync(
      'INSERT INTO users (username, email, password, role, is_locked, locked_until, total_spent, is_vip, twoFactorEnabled, twoFactorSecret) VALUES (?, ?, ?, ?, 0, NULL, 0.00, FALSE, FALSE, NULL)',
      [username, email, hashedPassword, role || 'customer']
    );
    const token = jwt.sign({ id: result.lastID, role: role || 'customer', is_vip: false }, 'secret_key', {
      expiresIn: '1d',
    });
    res.status(201).json({ userId: result.lastID, username, token });
  } catch (error) {
    console.error('Error in /register:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'Email đã tồn tại' });
    }
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

router.post('/login', loginLimiter, async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin' });
  }

  try {
    const user = await getAsync('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) {
      return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng' });
    }

    if (user.is_locked) {
      const now = new Date();
      const lockedUntil = user.locked_until ? new Date(user.locked_until) : null;

      if (!lockedUntil || now < lockedUntil) {
        const diffTime = lockedUntil ? lockedUntil - now : Infinity;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
        const lockedMessage = diffDays > 0
          ? `Tài khoản của bạn đã bị khóa trong vòng ${diffDays} ngày.`
          : `Tài khoản của bạn đã bị khóa trong vòng ${diffHours} giờ.`;
        return res.status(403).json({
          message: lockedMessage,
          is_locked: true,
          locked_until: user.locked_until,
        });
      } else {
        await runAsync('UPDATE users SET is_locked = 0, locked_until = NULL WHERE id = ?', [user.id]);
      }
    }

    if (user.role === 'admin' && user.twoFactorEnabled) {
      return res.json({
        message: 'Yêu cầu xác thực hai lớp',
        requireTwoFactor: true,
        userId: user.id,
        username: user.username,
        role: user.role
      });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role, is_vip: user.is_vip }, 
      'secret_key', 
      { expiresIn: '1d' }
    );
    
    res.json({ 
      userId: user.id, 
      username: user.username, 
      role: user.role, 
      is_vip: user.is_vip, 
      total_spent: user.total_spent,
      token 
    });
  } catch (error) {
    console.error('[Login] Lỗi:', error.message);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await getAsync(
      'SELECT id, username, email, role, phone_number, createdAt, is_locked, locked_until, total_spent, is_vip, twoFactorEnabled FROM users WHERE id = ?',
      [req.user.id]
    );
    if (!user) {
      return res.status(404).json({ message: 'Người dùng không tồn tại' });
    }
    res.json(user);
  } catch (error) {
    console.error('Lỗi truy vấn database:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

router.put('/me', authenticate, async (req, res) => {
  const { username, email, phone_number } = req.body;
  if (!username || !email) {
    return res.status(400).json({ message: 'Vui lòng cung cấp đầy đủ thông tin (username và email)' });
  }

  try {
    const existingUser = await getAsync(
      'SELECT id FROM users WHERE (email = ? OR username = ?) AND id != ?',
      [email, username, req.user.id]
    );
    if (existingUser) {
      return res.status(400).json({ message: 'Email hoặc tên người dùng đã tồn tại' });
    }

    await runAsync(
      'UPDATE users SET username = ?, email = ?, phone_number = ? WHERE id = ?',
      [username, email, phone_number || null, req.user.id]
    );
    const updatedUser = await getAsync(
      'SELECT id, username, email, role, phone_number, createdAt, is_locked, locked_until, total_spent, is_vip, twoFactorEnabled FROM users WHERE id = ?',
      [req.user.id]
    );
    res.json(updatedUser);
  } catch (error) {
    console.error('Lỗi cập nhật thông tin người dùng:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'Email hoặc tên người dùng đã tồn tại' });
    }
    res.status(500).json({ message: 'Lỗi server' });
  }
});

router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ message: 'Vui lòng cung cấp email' });
  }

  try {
    const user = await getAsync('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) {
      return res.status(404).json({ message: 'Email không tồn tại' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 3600000).toISOString().slice(0, 19).replace('T', ' ');

    await runAsync('INSERT INTO password_reset_tokens (email, token, expiresAt) VALUES (?, ?, ?)', [email, token, expiresAt]);
    console.log(`Liên kết đặt lại mật khẩu cho ${email}: http://localhost:3000/dat-lai-mat-khau?token=${token}`);
    res.json({ message: 'Liên kết đặt lại mật khẩu đã được gửi đến email của bạn' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server' });
  }
});

router.post('/reset-password', async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) {
    return res.status(400).json({ message: 'Vui lòng cung cấp token và mật khẩu mới' });
  }

  try {
    const resetToken = await getAsync('SELECT * FROM password_reset_tokens WHERE token = ? AND used = 0', [token]);
    if (!resetToken) {
      return res.status(400).json({ message: 'Token không hợp lệ hoặc đã được sử dụng' });
    }

    const currentTime = new Date();
    const expiresAt = new Date(resetToken.expiresAt);
    if (currentTime > expiresAt) {
      return res.status(400).json({ message: 'Token đã hết hạn' });
    }

    const saltRounds = 10;
    const hash = await bcrypt.hash(password, saltRounds);

    await runAsync('UPDATE users SET password = ? WHERE email = ?', [hash, resetToken.email]);
    await runAsync('UPDATE password_reset_tokens SET used = 1 WHERE token = ?', [token]);
    res.json({ message: 'Đặt lại mật khẩu thành công' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server' });
  }
});

router.post('/change-password', authenticate, async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword) {
    return res.status(400).json({ message: 'Vui lòng cung cấp mật khẩu cũ và mới' });
  }

  try {
    const user = await getAsync('SELECT * FROM users WHERE id = ?', [req.user.id]);
    if (!user) {
      return res.status(404).json({ message: 'Người dùng không tồn tại' });
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Mật khẩu cũ không đúng' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await runAsync('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, user.id]);
    res.json({ message: 'Đổi mật khẩu thành công' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server: ' + error.message });
  }
});

router.post('/google', async (req, res) => {
  const { token } = req.body;
  if (!token) {
    return res.status(400).json({ message: 'Vui lòng cung cấp token Google' });
  }

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { email, name, sub: googleId } = payload;

    const user = await getAsync('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) {
      const username = name || email.split('@')[0];
      const hashedPassword = await bcrypt.hash(googleId, 10);
      const result = await runAsync(
        'INSERT INTO users (username, email, password, role, is_locked, locked_until, total_spent, is_vip, twoFactorEnabled, twoFactorSecret) VALUES (?, ?, ?, ?, 0, NULL, 0.00, FALSE, FALSE, NULL)',
        [username, email, hashedPassword, 'customer']
      );
      const newUser = { id: result.lastID, username, email, role: 'customer', is_vip: false };
      const jwtToken = jwt.sign({ id: newUser.id, role: newUser.role, is_vip: newUser.is_vip }, 'secret_key', {
        expiresIn: '1d',
      });
      return res.json({ userId: newUser.id, username: newUser.username, role: newUser.role, is_vip: newUser.is_vip, token: jwtToken });
    }

    if (user.role === 'admin' && user.twoFactorEnabled) {
      return res.json({
        message: 'Yêu cầu xác thực hai lớp',
        requireTwoFactor: true,
        userId: user.id,
        username: user.username,
        role: user.role
      });
    }

    const jwtToken = jwt.sign({ id: user.id, role: user.role, is_vip: user.is_vip }, 'secret_key', {
      expiresIn: '1d',
    });
    res.json({ userId: user.id, username: user.username, role: user.role, is_vip: user.is_vip, total_spent: user.total_spent, token: jwtToken });
  } catch (error) {
    console.error('[Auth] Lỗi đăng nhập Google:', error.message);
    res.status(401).json({ message: 'Đăng nhập bằng Google thất bại' });
  }
});

const requireTwoFactorAuth = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Chưa đăng nhập' });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Không có quyền truy cập' });
  }

  if (req.user.role === 'admin' && !req.user.twoFactorAuthenticated) {
    return res.status(403).json({
      message: 'Cần xác thực hai lớp để truy cập',
      requireTwoFactor: true
    });
  }

  next();
};

module.exports = router;