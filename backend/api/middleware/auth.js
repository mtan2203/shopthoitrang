const jwt = require('jsonwebtoken');

// Middleware để xác thực người dùng và phân quyền
const authenticate = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Không có token, vui lòng đăng nhập' });
  }
  try {
    const decoded = jwt.verify(token, 'secret_key');
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Token không hợp lệ hoặc đã hết hạn' });
  }
};

// Middleware để giới hạn quyền truy cập theo vai trò (Cụ thể là admin)
const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        message: 'Bạn không có quyền thực hiện hành động này. Vui lòng sử dụng tài khoản có vai trò phù hợp.'
      });
    }
    next();
  };
};

module.exports = { authenticate, restrictTo };