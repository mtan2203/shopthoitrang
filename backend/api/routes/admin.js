const express = require('express');
const router = express.Router();
const multer = require('multer');
const XLSX = require('xlsx');
const { getAsync, runAsync } = require('../../config/db');
const jwt = require('jsonwebtoken');

// Middleware xác thực token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  console.log('[Admin] AuthenticateToken - Token:', token ? 'Present' : 'Missing');
  if (!token) {
    return res.status(401).json({ message: 'Không có token' });
  }
  try {
    const decoded = jwt.verify(token, 'secret_key');
    console.log('[Admin] AuthenticateToken - Decoded:', decoded);
    if (decoded.role !== 'admin') {
      return res.status(403).json({ message: 'Bạn không có quyền thực hiện hành động này' });
    }
    req.user = decoded;
    next();
  } catch (err) {
    console.error('[Admin] AuthenticateToken - Error:', err.message);
    return res.status(401).json({ message: 'Token không hợp lệ hoặc đã hết hạn' });
  }
};

// Cấu hình multer để upload file
const storage = multer.memoryStorage();
const upload = multer({ storage });

// API để import file Excel và cập nhật số lượng tồn
router.post('/import-stock', authenticateToken, upload.single('file'), async (req, res) => {
  console.log('[Admin] Received import-stock request');
  try {
    if (!req.file) {
      console.log('[Admin] No file uploaded');
      return res.status(400).json({ message: 'Vui lòng upload file Excel!' });
    }

    console.log('[Admin] File uploaded:', req.file.originalname);

    // Đọc file Excel từ buffer
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Kiểm tra header của file Excel
    const expectedHeaders = ['Product ID', 'Quantity'];
    const sheetHeaderRow = XLSX.utils.sheet_to_json(worksheet, { header: 1 })[0] || [];
    const sheetHeader = sheetHeaderRow.map(h => h?.toString().trim().toLowerCase());
    console.log('[Admin] Parsed sheet header:', sheetHeader);

    const normalizedExpectedHeaders = expectedHeaders.map(h => h.toLowerCase());
    const missingHeaders = normalizedExpectedHeaders.filter(h => !sheetHeader.includes(h));
    if (missingHeaders.length > 0) {
      console.log('[Admin] Missing headers:', missingHeaders);
      return res.status(400).json({ message: `Thiếu cột: ${missingHeaders.join(', ')}. Vui lòng kiểm tra file Excel.` });
    }

    // Chuyển dữ liệu từ sheet thành JSON
    const data = XLSX.utils.sheet_to_json(worksheet, { raw: true });
    console.log('[Admin] Excel data:', data);

    // Kiểm tra dữ liệu
    if (!data || data.length === 0) {
      console.log('[Admin] Excel file is empty');
      return res.status(400).json({ message: 'File Excel không có dữ liệu!' });
    }

    let updatedCount = 0;

    // Cập nhật số lượng tồn cho từng sản phẩm
    for (const row of data) {
      const productId = parseInt(row['Product ID']);
      const quantity = parseInt(row['Quantity']);

      console.log('[Admin] Processing row - Product ID:', productId, 'Quantity:', quantity);

      // Kiểm tra giá trị hợp lệ
      if (isNaN(productId) || productId <= 0) {
        console.log('[Admin] Invalid Product ID in row:', row);
        return res.status(400).json({ message: `Product ID không hợp lệ tại dòng: ${JSON.stringify(row)}` });
      }
      if (isNaN(quantity) || quantity < 0) {
        console.log('[Admin] Invalid Quantity in row:', row);
        return res.status(400).json({ message: `Quantity không hợp lệ tại dòng: ${JSON.stringify(row)}` });
      }

      // Tìm sản phẩm trong database
      const product = await getAsync('SELECT stock FROM products WHERE id = ?', [productId]);
      console.log('[Admin] Product found:', product);
      if (!product) {
        console.log('[Admin] Product not found for ID:', productId);
        return res.status(404).json({ message: `Không tìm thấy sản phẩm với ID: ${productId}` });
      }

      // Cộng số lượng nhập thêm vào stock
      const newStock = (product.stock || 0) + quantity;
      console.log('[Admin] Updating stock for Product ID:', productId, 'New stock:', newStock);
      await runAsync('UPDATE products SET stock = ? WHERE id = ?', [newStock, productId]);
      updatedCount++;
    }

    console.log(`[Admin] Import completed successfully - Updated ${updatedCount} products`);
    res.status(200).json({ message: `Cập nhật số lượng tồn thành công! Đã cập nhật ${updatedCount} sản phẩm.` });
  } catch (error) {
    console.error('[Admin] Error during import:', error.message, error.stack);
    res.status(500).json({ message: 'Có lỗi xảy ra khi xử lý file Excel!' });
  }
});

module.exports = router;