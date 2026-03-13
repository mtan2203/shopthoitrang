const express = require('express');
const router = express.Router();
const { runAsync } = require('../../config/db');
const sanitizeHtml = require('sanitize-html');

router.post('/', async (req, res) => {
  const { name, email, message } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin' });
  }

  const cleanName = sanitizeHtml(name);
  const cleanEmail = sanitizeHtml(email);
  const cleanMessage = sanitizeHtml(message);

  try {
    await runAsync(
      'INSERT INTO contacts (name, email, message) VALUES (?, ?, ?)',
      [cleanName, cleanEmail, cleanMessage]
    );
    res.status(201).json({ message: 'Gửi liên hệ thành công' });
  } catch (err) {
    console.error('Lỗi khi lưu thông tin liên hệ:', err);
    res.status(500).json({ message: 'Lỗi khi lưu thông tin: ' + err.message });
  }
});

module.exports = router;