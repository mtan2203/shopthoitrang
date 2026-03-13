const express = require('express');
const router = express.Router();
const { runAsync, getAsync, allAsync } = require('../../config/db'); // Sử dụng các hàm từ db.js
const { authenticate } = require('../middleware/auth');

// Đảm bảo múi giờ đúng (UTC+7 cho Việt Nam)
process.env.TZ = 'Asia/Ho_Chi_Minh';

// Hàm chuẩn hóa định dạng thời gian sang YYYY-MM-DD HH:mm:ss
const formatDateForMySQL = (dateString) => {
  const date = new Date(dateString);
  return date.toISOString().replace('T', ' ').slice(0, 19); // Định dạng: YYYY-MM-DD HH:mm:ss
};

router.get('/', authenticate, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Chỉ admin mới được xem danh sách mã' });
  try {
    console.log('[Coupons] Lấy danh sách mã giảm giá...');
    const coupons = await allAsync('SELECT * FROM coupons');
    console.log('[Coupons] Danh sách:', JSON.stringify(coupons, null, 2));
    res.json({ coupons });
  } catch (err) {
    console.error('[Coupons] Lỗi lấy danh sách:', err.message);
    res.status(500).json({ message: 'Lỗi server: ' + err.message });
  }
});

// Lấy mã giảm giá công khai (chỉ trả về mã phù hợp với trạng thái VIP của user)
router.get('/public', authenticate, async (req, res) => {
  try {
    console.log('[Coupons] Lấy danh sách mã giảm giá công khai...');
    const currentTime = new Date().toISOString().replace('T', ' ').slice(0, 19); // Định dạng YYYY-MM-DD HH:mm:ss
    const isVip = req.user.is_vip || false;
    const coupons = await allAsync(
      `SELECT * FROM coupons 
       WHERE is_active = 1 
       AND start_date <= ? 
       AND expiry_date >= ? 
       AND (usage_limit IS NULL OR times_used < usage_limit)
       AND (is_for_vip = 0 OR is_for_vip = ? OR (is_for_vip = 1 AND ? = 1))`,
      [currentTime, currentTime, isVip, isVip]
    );
    console.log('[Coupons] Danh sách công khai:', JSON.stringify(coupons, null, 2));
    res.json({ coupons });
  } catch (err) {
    console.error('[Coupons] Lỗi lấy danh sách công khai:', err.message);
    res.status(500).json({ message: 'Lỗi server: ' + err.message });
  }
});

// Tạo mã giảm giá mới
router.post('/', authenticate, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Chỉ admin mới được tạo mã' });
  const {
    code,
    discount_type,
    discount_value,
    min_purchase_amount,
    max_discount_amount,
    start_date,
    expiry_date,
    usage_limit,
    is_active,
    is_for_vip,
  } = req.body;

  if (!code || !discount_type || !discount_value || !start_date || !expiry_date) {
    return res.status(400).json({ message: 'Vui lòng cung cấp đầy đủ thông tin: code, discount_type, discount_value, start_date, expiry_date' });
  }

  try {
    const existingCoupon = await getAsync('SELECT id FROM coupons WHERE code = ?', [code]);
    if (existingCoupon) {
      return res.status(400).json({ message: 'Mã giảm giá đã tồn tại' });
    }

    // Chuẩn hóa định dạng thời gian
    const formattedStartDate = formatDateForMySQL(start_date);
    const formattedExpiryDate = formatDateForMySQL(expiry_date);

    const result = await runAsync(
      `INSERT INTO coupons (code, discount_type, discount_value, min_purchase_amount, max_discount_amount, start_date, expiry_date, usage_limit, is_active, is_for_vip)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        code,
        discount_type,
        discount_value,
        min_purchase_amount || 0,
        max_discount_amount || null,
        formattedStartDate,
        formattedExpiryDate,
        usage_limit || null,
        is_active ? 1 : 0,
        is_for_vip ? 1 : 0,
      ]
    );

    // Tạo thông báo cho tất cả user hoặc chỉ user VIP
    const title = `Mã giảm giá mới: ${code}`;
    const message = `Mã giảm giá ${code} vừa được tạo! Nhấn để nhận ngay.`;
    const link = '/ma-giam-gia';
    const query = is_for_vip
      ? `INSERT INTO notifications (title, message, link, userId) SELECT ?, ?, ?, id FROM users WHERE is_vip = 1`
      : `INSERT INTO notifications (title, message, link, userId) VALUES (?, ?, ?, NULL)`;
    await runAsync(query, [title, message, link]);

    console.log('[Coupons] Tạo mã thành công:', code);
    res.status(201).json({ message: 'Tạo mã giảm giá thành công', id: result.lastID });
  } catch (err) {
    console.error('[Coupons] Lỗi tạo mã:', err.message);
    res.status(500).json({ message: 'Lỗi server: ' + err.message });
  }
});

// Sửa mã giảm giá
router.put('/:id', authenticate, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Chỉ admin mới được sửa mã' });
  const { id } = req.params;
  const {
    code,
    discount_type,
    discount_value,
    min_purchase_amount,
    max_discount_amount,
    start_date,
    expiry_date,
    usage_limit,
    is_active,
    is_for_vip,
  } = req.body;

  if (!code || !discount_type || !discount_value || !start_date || !expiry_date) {
    return res.status(400).json({ message: 'Vui lòng cung cấp đầy đủ thông tin' });
  }

  try {
    const existingCoupon = await getAsync('SELECT id FROM coupons WHERE code = ? AND id != ?', [code, id]);
    if (existingCoupon) {
      return res.status(400).json({ message: 'Mã giảm giá đã tồn tại' });
    }

    // Chuẩn hóa định dạng thời gian
    const formattedStartDate = formatDateForMySQL(start_date);
    const formattedExpiryDate = formatDateForMySQL(expiry_date);

    const result = await runAsync(
      `UPDATE coupons SET code = ?, discount_type = ?, discount_value = ?, min_purchase_amount = ?, max_discount_amount = ?, start_date = ?, expiry_date = ?, usage_limit = ?, is_active = ?, is_for_vip = ? WHERE id = ?`,
      [
        code,
        discount_type,
        discount_value,
        min_purchase_amount || 0,
        max_discount_amount || null,
        formattedStartDate,
        formattedExpiryDate,
        usage_limit || null,
        is_active ? 1 : 0,
        is_for_vip ? 1 : 0,
        id,
      ]
    );

    if (result.changes === 0) {
      return res.status(404).json({ message: 'Mã giảm giá không tồn tại' });
    }

    console.log('[Coupons] Cập nhật mã thành công:', id);
    res.json({ message: 'Cập nhật mã giảm giá thành công' });
  } catch (err) {
    console.error('[Coupons] Lỗi cập nhật mã:', err.message);
    res.status(500).json({ message: 'Lỗi server: ' + err.message });
  }
});

router.delete('/:id', authenticate, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Chỉ admin mới được xóa mã' });
  const { id } = req.params;

  try {
    const result = await runAsync('DELETE FROM coupons WHERE id = ?', [id]);
    if (result.changes === 0) {
      return res.status(404).json({ message: 'Mã giảm giá không tồn tại' });
    }

    console.log('[Coupons] Xóa mã thành công:', id);
    res.json({ message: 'Xóa mã giảm giá thành công' });
  } catch (err) {
    console.error('[Coupons] Lỗi xóa mã:', err.message);
    res.status(500).json({ message: 'Lỗi server: ' + err.message });
  }
});

router.post('/validate', authenticate, async (req, res) => {
  const { code, cartTotal } = req.body;
  if (!code || cartTotal == null) {
    console.log('[Coupons] Thiếu thông tin:', { code, cartTotal });
    return res.status(400).json({ valid: false, message: 'Vui lòng cung cấp mã và tổng giỏ hàng' });
  }

  try {
    console.log('[Coupons] Kiểm tra mã:', { code, cartTotal, currentTime: new Date().toISOString() });
    const currentTime = new Date().toISOString().replace('T', ' ').slice(0, 19); // Định dạng YYYY-MM-DD HH:mm:ss
    const isVip = req.user.is_vip || false;
    const coupon = await getAsync(
      `SELECT * FROM coupons 
       WHERE code = ? 
       AND is_active = 1 
       AND start_date <= ? 
       AND expiry_date >= ? 
       AND (usage_limit IS NULL OR times_used < usage_limit)
       AND (is_for_vip = 0 OR (is_for_vip = 1 AND ? = 1))`,
      [code, currentTime, currentTime, isVip]
    );

    if (!coupon) {
      console.log('[Coupons] Mã không hợp lệ hoặc đã hết hạn:', code);
      const couponDetails = await getAsync('SELECT * FROM coupons WHERE code = ?', [code]);
      if (couponDetails) {
        console.log('[Coupons] Chi tiết mã:', {
          code,
          is_active: couponDetails.is_active,
          start_date: couponDetails.start_date,
          expiry_date: couponDetails.expiry_date,
          usage_limit: couponDetails.usage_limit,
          times_used: couponDetails.times_used,
          is_for_vip: couponDetails.is_for_vip,
          user_is_vip: isVip,
          currentTime
        });
      } else {
        console.log('[Coupons] Mã không tồn tại trong database:', code);
      }
      return res.status(400).json({ valid: false, message: 'Mã giảm giá không tồn tại, đã hết hạn, hoặc không dành cho bạn' });
    }

    console.log('[Coupons] Tìm thấy mã:', coupon);
    if (cartTotal < coupon.min_purchase_amount) {
      console.log('[Coupons] Đơn hàng chưa đủ:', { cartTotal, min: coupon.min_purchase_amount });
      return res.status(400).json({ valid: false, message: `Đơn hàng cần tối thiểu ${coupon.min_purchase_amount.toLocaleString()} VNĐ` });
    }

    let discount_amount = coupon.discount_type === 'percentage'
      ? Math.min(cartTotal * coupon.discount_value / 100, coupon.max_discount_amount || Infinity)
      : Math.min(coupon.discount_value, cartTotal);

    console.log('[Coupons] Mã hợp lệ:', { code, discount_amount, coupon_id: coupon.id });
    res.json({ valid: true, discount_amount, coupon_id: coupon.id });
  } catch (err) {
    console.error('[Coupons] Lỗi kiểm tra mã:', err.message);
    res.status(500).json({ message: 'Lỗi server: ' + err.message });
  }
});

// Thêm endpoint để người dùng lấy mã giảm giá
router.post('/claim/:id', authenticate, async (req, res) => {
  const couponId = req.params.id;

  try {
    console.log('[Coupons] Lấy mã giảm giá:', couponId);
    const currentTime = new Date().toISOString().replace('T', ' ').slice(0, 19); // Định dạng YYYY-MM-DD HH:mm:ss
    const isVip = req.user.is_vip || false;
    const coupon = await getAsync(
      `SELECT * FROM coupons 
       WHERE id = ? 
       AND is_active = 1 
       AND start_date <= ? 
       AND expiry_date >= ? 
       AND (usage_limit IS NULL OR times_used < usage_limit)
       AND (is_for_vip = 0 OR (is_for_vip = 1 AND ? = 1))`,
      [couponId, currentTime, currentTime, isVip]
    );

    if (!coupon) {
      console.log('[Coupons] Mã không hợp lệ hoặc đã hết hạn:', couponId);
      return res.status(400).json({ message: 'Mã giảm giá không tồn tại, đã hết hạn, hết lượt sử dụng, hoặc không dành cho bạn' });
    }

    // Tăng times_used
    const result = await runAsync(
      `UPDATE coupons SET times_used = COALESCE(times_used, 0) + 1 WHERE id = ?`,
      [couponId]
    );

    if (result.changes === 0) {
      return res.status(404).json({ message: 'Mã giảm giá không tồn tại' });
    }

    console.log('[Coupons] Lấy mã thành công:', couponId);
    res.status(200).json({ message: 'Lấy mã giảm giá thành công' });
  } catch (err) {
    console.error('[Coupons] Lỗi khi lấy mã:', err.message);
    res.status(500).json({ message: 'Lỗi server: ' + err.message });
  }
});
// Lấy danh sách mã đã claim của người dùng
router.get('/user-claims', authenticate, async (req, res) => {
  try {
    const rows = await allAsync(
      `SELECT coupon_id FROM coupon_usage WHERE user_id = ?`,
      [req.user.id]
    );
    const claimedCoupons = rows.map(row => row.coupon_id);
    res.json({ claimedCoupons });
  } catch (err) {
    console.error('[Coupons] Lỗi lấy mã đã claim:', err.message);
    res.status(500).json({ message: 'Lỗi server khi lấy mã đã dùng' });
  }
});

module.exports = router;