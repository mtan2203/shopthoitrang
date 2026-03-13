const express = require('express');
const router = express.Router();
const { pool, runAsync, getAsync, allAsync } = require('../../config/db'); // Import pool và các hàm
const { authenticate } = require('../middleware/auth');
const crypto = require('crypto');
const axios = require('axios');

// Cấu hình MoMo (dùng thông tin sandbox)
const partnerCode = 'MOMOOJQK20241205';
const accessKey = 'vB1kw0Uxxxxx';
const secretKey = 'T2vDb3xxxxx';
const momoUrl = 'https://test-payment.momo.vn/v2/gateway/api/create';
const returnUrl = 'http://localhost:3000/thanh-toan/momo-return';
const notifyUrl = 'http://localhost:5000/api/orders/momo-notify';

// Tạo đơn hàng
router.post('/', authenticate, async (req, res) => {
  const { items, address, phone, email, couponCode, notes, shippingFee, paymentMethod } = req.body;
  if (!items || items.length === 0 || !address || !phone || !email || !shippingFee) {
    console.log('[Orders] Thiếu thông tin:', { items, address, phone, email, shippingFee });
    return res.status(400).json({ message: 'Vui lòng cung cấp đầy đủ thông tin: items, address, phone, email, và shippingFee' });
  }

  if (req.user.role === 'admin') {
    return res.status(403).json({ message: 'Tài khoản admin không có quyền đặt hàng.' });
  }

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    console.log('[Orders] Tạo đơn hàng:', { userId: req.user.id, items, address, phone, email, couponCode, notes });
    const productIds = items.map((item) => item.productId);
    const products = await allAsync(
      `SELECT id, price, stock FROM products WHERE id IN (${productIds.map(() => '?').join(',')})`,
      productIds
    );

    if (products.length !== productIds.length) {
      console.log('[Orders] Một số sản phẩm không tồn tại:', { productIds, found: products.map(p => p.id) });
      throw new Error('Một số sản phẩm không tồn tại');
    }

    for (const item of items) {
      const product = products.find((p) => p.id === item.productId);
      if (!product || product.stock < item.quantity) {
        console.log('[Orders] Sản phẩm không đủ tồn kho:', { productId: item.productId, stock: product?.stock });
        throw new Error(`Sản phẩm ${item.productId} không đủ tồn kho`);
      }
    }

    let subtotal = items.reduce((sum, item) => {
      const product = products.find((p) => p.id === item.productId);
      return sum + (product ? product.price * item.quantity : 0);
    }, 0);

    const { shippingFee } = req.body; // Nhận shippingFee từ frontend
    if (!shippingFee || isNaN(shippingFee) || shippingFee < 0) {
      console.log('[Orders] Shipping fee không hợp lệ:', shippingFee);
      return res.status(400).json({ message: 'Phí vận chuyển không hợp lệ' });
    }
    let total = subtotal + shippingFee;

    let discountAmount = 0;
    let couponId = null;
    if (couponCode && couponCode.trim()) {
      console.log('[Orders] Kiểm tra mã giảm giá:', couponCode);
      const currentTime = new Date().toISOString().slice(0, 19).replace('T', ' ');
      const coupon = await getAsync(
        `SELECT * FROM coupons 
         WHERE code = ? 
         AND is_active = 1 
         AND start_date <= ? 
         AND expiry_date >= ? 
         AND (usage_limit IS NULL OR times_used < usage_limit)`,
        [couponCode, currentTime, currentTime]
      );
      if (!coupon) {
        console.log('[Orders] Mã giảm giá không hợp lệ:', couponCode);
        throw new Error('Mã giảm giá không tồn tại hoặc đã hết hạn');
      }
      if (subtotal < coupon.min_purchase_amount) {
        console.log('[Orders] Đơn hàng chưa đủ tối thiểu:', { subtotal, min_purchase_amount: coupon.min_purchase_amount });
        throw new Error('Giá trị đơn hàng không đủ để sử dụng mã này');
      }
      if (coupon.discount_type === 'percentage') {
        discountAmount = subtotal * (coupon.discount_value / 100);
        if (coupon.max_discount_amount && discountAmount > coupon.max_discount_amount) {
          discountAmount = coupon.max_discount_amount;
        }
      } else {
        discountAmount = coupon.discount_value;
        if (discountAmount > subtotal) {
          discountAmount = subtotal;
        }
      }
      couponId = coupon.id;
      console.log('[Orders] Mã giảm giá hợp lệ:', { couponId, discountAmount });
    }

    const finalTotal = total - discountAmount;
    if (finalTotal <= 0) {
      console.log('[Orders] Tổng tiền sau giảm giá không hợp lệ:', { total, discountAmount, finalTotal });
      throw new Error('Tổng tiền sau giảm giá không hợp lệ');
    }

    // Lưu đơn hàng
    const orderResult = await runAsync(
      'INSERT INTO orders (userId, status, address, phone, email, total, subtotal, shipping_fee, discount_amount, coupon_id, notes, payment_method, tracking_order, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        req.user.id,
        'pending',
        address,
        phone,
        email,
        finalTotal,
        subtotal,
        shippingFee, // Sử dụng shippingFee từ req.body
        discountAmount || 0,
        couponId || null,
        notes || null,
        paymentMethod || 'cod', // Cập nhật paymentMethod từ req.body
        null,
        new Date().toISOString().slice(0, 19).replace('T', ' ')
      ]
    );
    const orderId = orderResult.lastID;

    for (const item of items) {
      await runAsync(
        'INSERT INTO order_items (orderId, productId, quantity, size, color) VALUES (?, ?, ?, ?, ?)',
        [orderId, item.productId, item.quantity, item.size || null, item.color || null]
      );
      const product = products.find((p) => p.id === item.productId);
      await runAsync(
        'UPDATE products SET stock = stock - ? WHERE id = ?',
        [item.quantity, item.productId]
      );
    }

    if (couponId) {
      await runAsync(
        'INSERT INTO coupon_usage (coupon_id, user_id, order_id, discount_amount) VALUES (?, ?, ?, ?)',
        [couponId, req.user.id, orderId, discountAmount]
      );
      await runAsync(
        'UPDATE coupons SET times_used = times_used + 1 WHERE id = ?',
        [couponId]
      );
    }

    // Cập nhật total_spent và is_vip cho user
    const orderTotal = await getAsync(
      'SELECT COALESCE(SUM(total), 0) as total_spent FROM orders WHERE userId = ? AND status = ?',
      [req.user.id, 'delivered']
    );
    const newTotalSpent = orderTotal.total_spent || 0;
    const isVip = newTotalSpent >= 100000000;
    await runAsync(
      'UPDATE users SET total_spent = ?, is_vip = ? WHERE id = ?',
      [newTotalSpent, isVip ? 1 : 0, req.user.id]
    );
    console.log('[Orders] Cập nhật total_spent và is_vip:', { userId: req.user.id, total_spent: newTotalSpent, is_vip: isVip });

    // Tạo thông báo cho admin
    const titleNotif = `Đơn hàng mới: #${orderId}`;
    const message = `Đơn hàng mới #${orderId} vừa được đặt! Nhấn để xem ngay.`;
    const link = `/don-hang/${orderId}`;
    const adminUsers = await allAsync('SELECT id FROM users WHERE role = "admin"', []);
    for (const admin of adminUsers) {
      await runAsync(
        'INSERT INTO notifications (title, message, link, userId, createdAt) VALUES (?, ?, ?, ?, ?)',
        [titleNotif, message, link, admin.id, new Date().toISOString().slice(0, 19).replace('T', ' ')]
      );
    }
    
    await connection.commit(); // Hàm commit() để xác nhận giao dịch
    console.log('[Orders] Đơn hàng tạo thành công:', { orderId, finalTotal, subtotal, shippingFee, discountAmount });
    res.status(201).json({
      orderId,
      status: 'pending',
      total: finalTotal,
      subtotal,
      shippingFee,
      discountAmount: discountAmount || 0,
    });
  } catch (err) {
    if (connection) await connection.rollback();
    console.error('[Orders] Lỗi tạo đơn hàng:', err.message);
    res.status(500).json({ message: 'Lỗi khi tạo đơn hàng: ' + err.message });
  } finally {
    if (connection) connection.release();
  }
});

// API để cập nhật tracking_order (dành cho admin)
router.put('/:id/tracking-order', authenticate, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Bạn không có quyền cập nhật mã vận đơn.' });
  }

  const { trackingOrder } = req.body;
  if (!trackingOrder) {
    return res.status(400).json({ message: 'Vui lòng cung cấp mã vận đơn (trackingOrder).' });
  }

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const order = await getAsync('SELECT * FROM orders WHERE id = ?', [req.params.id]);
    if (!order) {
      throw new Error('Đơn hàng không tồn tại.');
    }

    await runAsync('UPDATE orders SET tracking_order = ? WHERE id = ?', [trackingOrder, req.params.id]);
    await connection.commit();
    res.json({ message: 'Cập nhật mã vận đơn thành công', orderId: req.params.id, trackingOrder });
  } catch (err) {
    if (connection) await connection.rollback();
    console.error('[Orders] Lỗi cập nhật mã vận đơn:', err.message);
    res.status(500).json({ message: 'Lỗi server: ' + err.message });
  } finally {
    if (connection) connection.release();
  }
});

// Tạo yêu cầu thanh toán MoMo
router.post('/momo-payment', authenticate, async (req, res) => {
  const { orderId } = req.body;

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const order = await getAsync(
      'SELECT * FROM orders WHERE id = ? AND userId = ?',
      [orderId, req.user.id]
    );

    if (!order) {
      throw new Error('Đơn hàng không tồn tại hoặc bạn không có quyền');
    }

    if (order.status !== 'pending') {
      throw new Error('Chỉ có thể thanh toán đơn hàng ở trạng thái chờ xử lý');
    }

    const requestId = `${orderId}-${Date.now()}`;
    const orderInfo = `Thanh toán đơn hàng #${orderId}`;
    const amount = order.total.toString();
    const requestType = 'captureWallet';
    const extraData = '';

    const rawSignature = `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${notifyUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${partnerCode}&redirectUrl=${returnUrl}&requestId=${requestId}&requestType=${requestType}`;
    const signature = crypto.createHmac('sha256', secretKey).update(rawSignature).digest('hex');

    const requestBody = {
      partnerCode,
      accessKey,
      requestId,
      amount,
      orderId: orderId.toString(),
      orderInfo,
      redirectUrl: returnUrl,
      ipnUrl: notifyUrl,
      extraData,
      requestType,
      signature,
      lang: 'vi',
    };

    const response = await axios.post(momoUrl, requestBody);
    console.log('[Orders] MoMo API response:', response.data);

    if (response.data.resultCode === 0) {
      await runAsync(
        'UPDATE orders SET payment_method = ? WHERE id = ?',
        ['momo', orderId]
      );
      await connection.commit();
      res.json({ payUrl: response.data.payUrl });
    } else {
      console.error('[Orders] MoMo API error:', response.data);
      throw new Error(response.data.message || 'Lỗi khi tạo yêu cầu thanh toán MoMo');
    }
  } catch (err) {
    if (connection) await connection.rollback();
    console.error('[Orders] Lỗi gọi MoMo API:', err.message);
    res.status(500).json({ message: 'Lỗi server: ' + err.message });
  } finally {
    if (connection) connection.release();
  }
});

// Xử lý notify từ MoMo
router.post('/momo-notify', async (req, res) => {
  const {
    partnerCode,
    orderId,
    requestId,
    amount,
    orderInfo,
    orderType,
    transId,
    resultCode,
    message,
    payType,
    responseTime,
    extraData,
    signature,
  } = req.body;

  console.log('[Orders] MoMo notify:', req.body);

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const rawSignature = `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}&message=${message}&orderId=${orderId}&orderInfo=${orderInfo}&orderType=${orderType}&partnerCode=${partnerCode}&payType=${payType}&requestId=${requestId}&responseTime=${responseTime}&resultCode=${resultCode}&transId=${transId}`;
    const expectedSignature = crypto.createHmac('sha256', secretKey).update(rawSignature).digest('hex');

    if (signature !== expectedSignature) {
      console.error('[Orders] MoMo notify: Invalid signature');
      throw new Error('Invalid signature');
    }

    if (resultCode === 0) {
      await runAsync(
        'UPDATE orders SET status = ?, payment_status = ? WHERE id = ?',
        ['pending', 'paid', orderId]
      );
      console.log('[Orders] MoMo notify: Thanh toán thành công, đơn hàng:', orderId);
    } else {
      console.log('[Orders] MoMo notify: Thanh toán thất bại, đơn hàng:', orderId);
      await runAsync(
        'UPDATE orders SET payment_status = ? WHERE id = ?',
        ['failed', orderId]
      );
    }

    await connection.commit();
    res.json({ message: 'Notify received' });
  } catch (err) {
    if (connection) await connection.rollback();
    console.error('[Orders] Lỗi xử lý MoMo notify:', err.message);
    res.status(500).json({ message: 'Lỗi server: ' + err.message });
  } finally {
    if (connection) connection.release();
  }
});

// Xử lý return từ MoMo
router.get('/momo-return', async (req, res) => {
  const {
    partnerCode,
    orderId,
    requestId,
    amount,
    orderInfo,
    orderType,
    transId,
    resultCode,
    message,
    payType,
    responseTime,
    extraData,
    signature,
  } = req.query;

  console.log('[Orders] MoMo return:', req.query);

  try {
    const rawSignature = `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}&message=${message}&orderId=${orderId}&orderInfo=${orderInfo}&orderType=${orderType}&partnerCode=${partnerCode}&payType=${payType}&requestId=${requestId}&responseTime=${responseTime}&resultCode=${resultCode}&transId=${transId}`;
    const expectedSignature = crypto.createHmac('sha256', secretKey).update(rawSignature).digest('hex');

    if (signature !== expectedSignature) {
      console.error('[Orders] MoMo return: Invalid signature');
      return res.redirect('/thanh-toan?status=error&message=Invalid signature');
    }

    if (resultCode === 0) {
      console.log('[Orders] MoMo return: Thanh toán thành công, đơn hàng:', orderId);
      res.redirect(`/don-hang/${orderId}?payment=success`);
    } else {
      console.log('[Orders] MoMo return: Thanh toán thất bại, đơn hàng:', orderId);
      res.redirect('/thanh-toan?status=error&message=Thanh toán thất bại');
    }
  } catch (err) {
    console.error('[Orders] Lỗi xử lý MoMo return:', err.message);
    res.redirect('/thanh-toan?status=error&message=Lỗi server');
  }
});

// Các route khác
router.get('/', authenticate, async (req, res) => {
  try {
    const query = req.user.role === 'user'
      ? `SELECT o.*, 
            COALESCE(c.code, '') as coupon_code,
            COUNT(oi.id) as item_count,
            SUM(oi.quantity) as total_items
         FROM orders o
         LEFT JOIN coupons c ON o.coupon_id = c.id
         LEFT JOIN order_items oi ON o.id = oi.orderId
         WHERE o.userId = ?
         GROUP BY o.id
         ORDER BY o.id DESC`
      : `SELECT o.*, 
            COALESCE(c.code, '') as coupon_code,
            COUNT(oi.id) as item_count,
            SUM(oi.quantity) as total_items 
         FROM orders o
         LEFT JOIN coupons c ON o.coupon_id = c.id
         LEFT JOIN order_items oi ON o.id = oi.orderId
         GROUP BY o.id
         ORDER BY o.id DESC`;

    const params = req.user.role === 'user' ? [req.user.id] : [];
    const orders = await allAsync(query, params);
    res.json({ orders });
  } catch (err) {
    console.error('[Orders] Lỗi lấy đơn hàng:', err.message);
    res.status(500).json({ message: 'Lỗi server: ' + err.message });
  }
});

router.get('/:id', authenticate, async (req, res) => {
  try {
    const order = await getAsync(
      `SELECT o.*, COALESCE(c.code, '') as coupon_code 
       FROM orders o
       LEFT JOIN coupons c ON o.coupon_id = c.id
       WHERE o.id = ?`,
      [req.params.id]
    );

    if (!order) {
      return res.status(404).json({ message: 'Đơn hàng không tồn tại' });
    }

    if (req.user.role === 'user' && order.userId !== req.user.id) {
      return res.status(403).json({ message: 'Không có quyền truy cập đơn hàng này' });
    }

    const items = await allAsync(
      'SELECT p.*, oi.quantity, oi.size, oi.color FROM order_items oi JOIN products p ON oi.productId = p.id WHERE oi.orderId = ?',
      [req.params.id]
    );

    if (!items || items.length === 0) {
      console.log(`[Orders] Đơn hàng #${req.params.id} không có sản phẩm`);
      return res.status(400).json({
        message: 'Đơn hàng không có sản phẩm. Vui lòng kiểm tra dữ liệu hoặc xóa đơn hàng này.',
      });
    }

    const formattedItems = items.map((item) => ({
      ...item,
      sizes: item.sizes ? item.sizes.split(',').map((s) => s.trim()) : [],
      colors: item.colors ? item.colors.split(',').map((c) => c.trim()) : [],
      size: item.size || 'Không xác định',
      color: item.color || 'Không xác định',
    }));

    res.json({
      ...order,
      items: formattedItems,
      subtotal: order.subtotal || (order.total + (order.discount_amount || 0) - (order.shipping_fee || 30000)),
    });
  } catch (err) {
    console.error('[Orders] Lỗi lấy đơn hàng:', err.message);
    res.status(500).json({ message: 'Lỗi server: ' + err.message });
  }
});

router.get('/check-purchase/:productId', authenticate, async (req, res) => {
  const { productId } = req.params;
  try {
    const order = await getAsync(
      `SELECT o.id 
       FROM orders o 
       JOIN order_items oi ON o.id = oi.orderId 
       WHERE o.userId = ? AND oi.productId = ? AND o.status = 'delivered'`,
      [req.user.id, productId]
    );

    res.json({ canReview: !!order });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi khi kiểm tra trạng thái mua hàng: ' + err.message });
  }
});
// Cập nhật trạng thái đơn hàng (dành cho admin)
router.put('/:id/status', authenticate, async (req, res) => {
  const { status } = req.body;
  if (!['pending', 'processing', 'shipped', 'delivered', 'cancelled'].includes(status)) {
    return res.status(400).json({ message: 'Trạng thái không hợp lệ' });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Bạn không có quyền cập nhật trạng thái đơn hàng.' });
  }

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const order = await getAsync('SELECT userId, status FROM orders WHERE id = ?', [req.params.id]);
    if (!order) {
      throw new Error('Đơn hàng không tồn tại');
    }

    if (order.status === 'cancelled' && status !== 'cancelled') {
      throw new Error('Không thể cập nhật trạng thái của đơn hàng đã hủy');
    }

    if (status === 'cancelled' && order.status !== 'cancelled') {
      const items = await allAsync('SELECT productId, quantity FROM order_items WHERE orderId = ?', [req.params.id]);
      for (const item of items) {
        await runAsync('UPDATE products SET stock = stock + ? WHERE id = ?', [item.quantity, item.productId]);
      }
    }

    const result = await runAsync('UPDATE orders SET status = ? WHERE id = ?', [status, req.params.id]);

    if (result.changes === 0) {
      throw new Error('Đơn hàng không tồn tại');
    }

    // Cập nhật total_spent và is_vip khi đơn hàng được delivered
    await runAsync('UPDATE orders SET status = ? WHERE id = ?', [status, req.params.id]);
    await connection.commit(); // Commit transaction trước khi tính total_spent

    if (status === 'delivered') {
      const orderTotal = await getAsync(
        'SELECT COALESCE(SUM(total), 0) as total_spent FROM orders WHERE userId = ? AND status = ?',
        [order.userId, 'delivered']
      );
      const newTotalSpent = orderTotal.total_spent || 0;
      const isVip = newTotalSpent >= 100000000;
      await runAsync(
        'UPDATE users SET total_spent = ?, is_vip = ? WHERE id = ?',
        [newTotalSpent, isVip ? 1 : 0, order.userId]
      );
      console.log('[Orders] Cập nhật total_spent và is_vip khi delivered:', { userId: order.userId, total_spent: newTotalSpent, is_vip: isVip });
    }

    await connection.commit();
    res.json({ orderId: req.params.id, status });
  } catch (err) {
    if (connection) await connection.rollback();
    console.error('[Orders] Lỗi cập nhật trạng thái:', err.message);
    res.status(500).json({ message: 'Lỗi server: ' + err.message });
  } finally {
    if (connection) connection.release();
  }
});
router.put('/:id/cancel', authenticate, async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const order = await getAsync('SELECT status FROM orders WHERE id = ? AND userId = ?', [req.params.id, req.user.id]);

    if (!order) {
      throw new Error('Đơn hàng không tồn tại hoặc bạn không có quyền.');
    }

    if (order.status !== 'pending') {
      throw new Error('Chỉ có thể hủy đơn hàng ở trạng thái chờ xử lý.');
    }

    await runAsync('UPDATE orders SET status = ? WHERE id = ?', ['cancelled', req.params.id]);

    const items = await allAsync('SELECT productId, quantity FROM order_items WHERE orderId = ?', [req.params.id]);

    for (const item of items) {
      await runAsync('UPDATE products SET stock = stock + ? WHERE id = ?', [item.quantity, item.productId]);
    }

    await connection.commit();
    res.json({ message: 'Hủy đơn hàng thành công', orderId: req.params.id, status: 'cancelled' });
  } catch (err) {
    if (connection) await connection.rollback();
    console.error('[Orders] Lỗi hủy đơn hàng:', err.message);
    res.status(500).json({ message: 'Lỗi server: ' + err.message });
  } finally {
    if (connection) connection.release();
  }
});

router.delete('/:id', authenticate, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Bạn không có quyền xóa đơn hàng.' });
  }

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const order = await getAsync('SELECT status FROM orders WHERE id = ?', [req.params.id]);
    if (!order) {
      throw new Error('Đơn hàng không tồn tại');
    }

    if (order.status !== 'cancelled') {
      const items = await allAsync('SELECT productId, quantity FROM order_items WHERE orderId = ?', [req.params.id]);
      for (const item of items) {
        await runAsync('UPDATE products SET stock = stock + ? WHERE id = ?', [item.quantity, item.productId]);
      }
    }

    await runAsync('DELETE FROM coupon_usage WHERE order_id = ?', [req.params.id]);
    await runAsync('DELETE FROM order_items WHERE orderId = ?', [req.params.id]);
    const result = await runAsync('DELETE FROM orders WHERE id = ?', [req.params.id]);

    if (result.changes === 0) {
      throw new Error('Đơn hàng không tồn tại');
    }

    await connection.commit();
    res.json({ message: 'Xóa đơn hàng thành công', orderId: req.params.id });
  } catch (err) {
    if (connection) await connection.rollback();
    console.error('[Orders] Lỗi xóa đơn hàng:', err.message);
    res.status(500).json({ message: 'Lỗi server: ' + err.message });
  } finally {
    if (connection) connection.release();
  }
});

module.exports = router;