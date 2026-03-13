const express = require('express');
const https = require('https');
const crypto = require('crypto');
const router = express.Router();

router.post('/create-payment', (req, res) => {
  const { amount = "50000", orderInfo = "Thanh toán MoMo" } = req.body;

  const partnerCode = "MOMO";
  const accessKey = "F8BBA842ECF85";
  const secretkey = "K951B6PE1waDMi640xX08PD3vg6EkVlz";
  const requestId = partnerCode + new Date().getTime();
  const orderId = requestId;
  const redirectUrl = "http://localhost:3000/momo-return";
  const ipnUrl = "https://webhook.site/your-ipn-url"; // Bạn có thể dùng https://webhook.site để test IPN
  const requestType = "captureWallet";
  const extraData = "";

  const rawSignature = `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${partnerCode}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=${requestType}`;

  const signature = crypto.createHmac('sha256', secretkey)
    .update(rawSignature)
    .digest('hex');

  const requestBody = JSON.stringify({
    partnerCode,
    accessKey,
    requestId,
    amount,
    orderId,
    orderInfo,
    redirectUrl,
    ipnUrl,
    extraData,
    requestType,
    signature,
    lang: 'en'
  });

  const options = {
    hostname: 'test-payment.momo.vn',
    port: 443,
    path: '/v2/gateway/api/create',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(requestBody)
    }
  };

  const momoReq = https.request(options, momoRes => {
    let data = '';
    momoRes.on('data', chunk => (data += chunk));
    momoRes.on('end', () => {
      try {
        const responseData = JSON.parse(data);
        res.json(responseData);
      } catch (e) {
        res.status(500).send({ message: 'Invalid response from MoMo', error: e.message });
      }
    });
  });

  momoReq.on('error', (e) => {
    res.status(500).send({ message: 'Request failed', error: e.message });
  });

  momoReq.write(requestBody);
  momoReq.end();
});

module.exports = router;
