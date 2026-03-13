const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const querystring = require('querystring');
const { authenticate } = require('../middleware/auth');
const { runAsync, getAsync } = require('../../config/db');

require('dotenv').config();

const vnp_TmnCode = process.env.VNP_TMN_CODE;
const vnp_HashSecret = process.env.VNP_HASH_SECRET;
const vnp_Url = process.env.VNP_URL;
const vnp_ReturnUrl = process.env.VNP_RETURN_URL;
const vnp_IpnUrl = process.env.VNP_IPN_URL;

// Hàm định dạng ngày theo yêu cầu của VNPAY (yyyyMMddHHmmss)
function dateFormat(date) {
  const pad = (n) => (n < 10 ? '0' + n : n);
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hour = pad(date.getHours());
  const minute = pad(date.getMinutes());
  const second = pad(date.getSeconds());
  return `${year}${month}${day}${hour}${minute}${second}`;
}

// Hàm sắp xếp object theo key
function sortObject(obj) {
  const sorted = {};
  const keys = Object.keys(obj).sort();
  for (const key of keys) {
    sorted[key] = obj[key];
  }
  return sorted;
}

// Tạo yêu cầu thanh toán VNPay
router.post('/create-payment', authenticate, async (req, res) => {
  const { amount, orderId } = req.body;

  try {
    // Kiểm tra và định dạng amount
    const parsedAmount = parseInt(amount, 10);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      console.log('[VNPay] Số tiền không hợp lệ:', { amount });
      return res.status(400).json({ message: 'Số tiền không hợp lệ, phải là số nguyên dương' });
    }
    const vnp_Amount = (parsedAmount * 100).toString(); // Chuyển thành VNĐ * 100

    const order = await getAsync(
      'SELECT * FROM orders WHERE id = ? AND userId = ?',
      [orderId, req.user.id]
    );

    if (!order) {
      console.log('[VNPay] Đơn hàng không tồn tại:', { orderId, userId: req.user.id });
      return res.status(404).json({ message: 'Đơn hàng không tồn tại hoặc bạn không có quyền' });
    }

    if (order.status !== 'pending') {
      console.log('[VNPay] Đơn hàng không ở trạng thái chờ:', { orderId, status: order.status });
      return res.status(400).json({ message: 'Chỉ có thể thanh toán đơn hàng ở trạng thái chờ xử lý' });
    }

    let ipAddr = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    if (!ipAddr || ipAddr === '::1' || ipAddr === '::ffff:127.0.0.1') {
      ipAddr = '127.0.0.1';
    }
    const date = new Date();

    const vnp_CreateDate = dateFormat(date);
    const vnp_TxnRef = `${orderId}-${date.getTime()}`; // Mã giao dịch duy nhất
    const vnp_OrderInfo = `Thanh toan don hang #${orderId}`; // Không dấu, không ký tự đặc biệt
    const vnp_OrderType = 'other'; // Hoặc 'billpayment' tùy theo loại giao dịch
    const vnp_Locale = 'vn';
    const vnp_CurrCode = 'VND';

    let vnp_Params = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: vnp_TmnCode,
      vnp_Amount: vnp_Amount,
      vnp_CreateDate: vnp_CreateDate,
      vnp_CurrCode: vnp_CurrCode,
      vnp_IpAddr: ipAddr,
      vnp_Locale: vnp_Locale,
      vnp_OrderInfo: vnp_OrderInfo,
      vnp_OrderType: vnp_OrderType,
      vnp_ReturnUrl: vnp_ReturnUrl,
      vnp_TxnRef: vnp_TxnRef,
      vnp_IpnUrl: vnp_IpnUrl // Thêm IPN URL
    };

    // Sắp xếp tham số và tính SecureHash
    vnp_Params = sortObject(vnp_Params);
    const signData = querystring.stringify(vnp_Params, { encode: false });
    const hmac = crypto.createHmac('sha512', vnp_HashSecret);
    const vnp_SecureHash = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
    vnp_Params.vnp_SecureHash = vnp_SecureHash;

    const vnpUrl = vnp_Url + '?' + querystring.stringify(vnp_Params, { encode: true });
    console.log('[VNPay] Dữ liệu gửi đi:', vnp_Params);
    console.log('[VNPay] URL thanh toán:', vnpUrl);

    await runAsync(
      'UPDATE orders SET payment_method = ? WHERE id = ?',
      ['vnpay', orderId]
    );

    res.json({ paymentUrl: vnpUrl });
  } catch (err) {
    console.error('[VNPay] Lỗi tạo thanh toán:', err.message, err.stack);
    res.status(500).json({ message: 'Lỗi khi tạo yêu cầu thanh toán: ' + err.message });
  }
});

// Xử lý notify từ VNPay
router.post('/notify', async (req, res) => {
  let vnp_Params = req.body;
  console.log('[VNPay] Nhận notify:', vnp_Params);

  try {
    const secureHash = vnp_Params['vnp_SecureHash'];
    delete vnp_Params['vnp_SecureHash'];
    delete vnp_Params['vnp_SecureHashType'];

    vnp_Params = sortObject(vnp_Params);
    const signData = querystring.stringify(vnp_Params, { encode: false });
    const hmac = crypto.createHmac('sha512', vnp_HashSecret);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    if (secureHash !== signed) {
      console.error('[VNPay] Invalid signature:', { secureHash, signed });
      return res.status(400).json({ RspCode: '97', Message: 'Invalid signature' });
    }

    const orderId = vnp_Params['vnp_TxnRef'].split('-')[0];
    const responseCode = vnp_Params['vnp_ResponseCode'];

    if (responseCode === '00') {
      await runAsync(
        'UPDATE orders SET status = ?, payment_status = ? WHERE id = ?',
        ['completed', 'paid', orderId]
      );
      console.log('[VNPay] Thanh toán thành công:', { orderId });
      res.json({ RspCode: '00', Message: 'Confirm Success' });
    } else {
      await runAsync(
        'UPDATE orders SET payment_status = ? WHERE id = ?',
        ['failed', orderId]
      );
      console.log('[VNPay] Thanh toán thất bại:', { orderId, responseCode });
      res.json({ RspCode: responseCode, Message: 'Failed' });
    }
  } catch (err) {
    console.error('[VNPay] Lỗi xử lý notify:', err.message, err.stack);
    res.status(500).json({ RspCode: '99', Message: 'Unknow error' });
  }
});

// Xử lý return từ VNPay
router.get('/return', async (req, res) => {
  let vnp_Params = req.query;
  console.log('[VNPay] Nhận return:', vnp_Params);

  try {
    const secureHash = vnp_Params['vnp_SecureHash'];
    delete vnp_Params['vnp_SecureHash'];
    delete vnp_Params['vnp_SecureHashType'];

    vnp_Params = sortObject(vnp_Params);
    const signData = querystring.stringify(vnp_Params, { encode: false });
    const hmac = crypto.createHmac('sha512', vnp_HashSecret);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    if (secureHash !== signed) {
      console.error('[VNPay] Invalid signature:', { secureHash, signed });
      return res.redirect('/thanh-toan?status=error&message=Invalid signature');
    }

    const orderId = vnp_Params['vnp_TxnRef'].split('-')[0];
    const responseCode = vnp_Params['vnp_ResponseCode'];

    if (responseCode === '00') {
      console.log('[VNPay] Thanh toán thành công:', { orderId });
      res.redirect(`/don-hang/${orderId}?payment=success`);
    } else {
      console.log('[VNPay] Thanh toán thất bại:', { orderId, responseCode });
      res.redirect('/thanh-toan?status=error&message=Thanh toán thất bại');
    }
  } catch (err) {
    console.error('[VNPay] Lỗi xử lý return:', err.message, err.stack);
    res.redirect('/thanh-toan?status=error&message=Lỗi server');
  }
});

module.exports = router;