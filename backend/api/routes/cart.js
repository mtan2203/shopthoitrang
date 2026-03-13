const express = require('express');
const router = express.Router();
const { pool } = require('../../config/db');
const { authenticate } = require('../middleware/auth');

pool.getConnection()
  .then(connection => {
    console.log('[Cart] Successfully connected to MySQL database');
    connection.release();
  })
  .catch(err => {
    console.error('[Cart] Error connecting to MySQL database:', err.message);
  });

router.get('/', authenticate, async (req, res) => {
  console.log(`[GET /api/cart] Request: userId=${req.user?.id}`);
  try {
    const [cartItems] = await pool.query(
      `SELECT ci.*, p.name, p.price, p.image, p.sizes, p.colors, p.variants 
       FROM cart_items ci 
       JOIN products p ON ci.productId = p.id 
       WHERE ci.userId = ?`,
      [req.user.id]
    );
    const formattedItems = cartItems.map(item => {
      let parsedSize = [];
      let parsedColor = [];
      let parsedSizes = [];
      let parsedColors = [];
      let parsedVariants = [];

      // Parse size from cart_items
      try {
        if (item.size && typeof item.size === 'string') {
          if (item.size.startsWith('[') && item.size.endsWith(']')) {
            parsedSize = JSON.parse(item.size);
          } else {
            parsedSize = [item.size];
          }
        }
      } catch (err) {
        console.error(`[GET /api/cart] JSON parse error for size: userId=${req.user.id}, productId=${item.productId}, size=${item.size}, message=`, err.message);
        parsedSize = item.size && typeof item.size === 'string' ? [item.size] : [];
      }

      // Parse color from cart_items
      try {
        if (item.color && typeof item.color === 'string') {
          if (item.color.startsWith('[') && item.color.endsWith(']')) {
            parsedColor = JSON.parse(item.color);
          } else {
            parsedColor = [item.color];
          }
        }
      } catch (err) {
        console.error(`[GET /api/cart] JSON parse error for color: userId=${req.user.id}, productId=${item.productId}, color=${item.color}, message=`, err.message);
        parsedColor = item.color && typeof item.color === 'string' ? [item.color] : [];
      }

      // Parse sizes from products
      try {
        if (item.sizes && typeof item.sizes === 'string') {
          if (item.sizes.startsWith('[') && item.sizes.endsWith(']')) {
            parsedSizes = JSON.parse(item.sizes);
          } else {
            parsedSizes = [item.sizes];
          }
        }
      } catch (err) {
        console.error(`[GET /api/cart] JSON parse error for sizes: userId=${req.user.id}, productId=${item.productId}, sizes=${item.sizes}, message=`, err.message);
        parsedSizes = item.sizes && typeof item.sizes === 'string' ? [item.sizes] : [];
      }

      // Parse colors from products
      try {
        if (item.colors && typeof item.colors === 'string') {
          if (item.colors.startsWith('[') && item.colors.endsWith(']')) {
            parsedColors = JSON.parse(item.colors);
          } else {
            parsedColors = [item.colors];
          }
        }
      } catch (err) {
        console.error(`[GET /api/cart] JSON parse error for colors: userId=${req.user.id}, productId=${item.productId}, colors=${item.colors}, message=`, err.message);
        parsedColors = item.colors && typeof item.colors === 'string' ? [item.colors] : [];
      }

      // Parse variants from products
      try {
        if (item.variants && typeof item.variants === 'string') {
          if (item.variants.startsWith('[') && item.variants.endsWith(']')) {
            parsedVariants = JSON.parse(item.variants);
          } else {
            parsedVariants = [item.variants];
          }
        }
      } catch (err) {
        console.error(`[GET /api/cart] JSON parse error for variants: userId=${req.user.id}, productId=${item.productId}, variants=${item.variants}, message=`, err.message);
        parsedVariants = item.variants && typeof item.variants === 'string' ? [item.variants] : [];
      }

      return {
        productId: item.productId,
        quantity: item.quantity,
        name: item.name,
        price: item.price,
        image: item.image,
        sizes: parsedSizes,
        colors: parsedColors,
        variants: parsedVariants,
        size: parsedSize,
        color: parsedColor
      };
    });
    console.log(`[GET /api/cart] Success: userId=${req.user.id}, items=`, formattedItems);
    res.json({ cart: formattedItems });
  } catch (err) {
    console.error(`[GET /api/cart] Error: userId=${req.user.id}, message=`, err.message);
    res.status(500).json({ message: `Lỗi lấy giỏ hàng: ${err.message}` });
  }
});

router.post('/', authenticate, async (req, res) => {
  const { productId, quantity, size, color } = req.body;
  console.log(`[POST /api/cart] Request: userId=${req.user?.id}, productId=${productId}, quantity=${quantity}, size=${size}, color=${color}`);
  
  if (!productId || !Number.isInteger(productId) || !quantity || !Number.isInteger(quantity) || quantity <= 0) {
    console.log(`[POST /api/cart] Invalid input: productId=${productId}, quantity=${quantity}`);
    return res.status(400).json({ message: 'Product ID hoặc số lượng không hợp lệ' });
  }
  if (!size || !color) {
    console.log(`[POST /api/cart] Missing size or color: size=${size}, color=${color}`);
    return res.status(400).json({ message: 'Vui lòng chọn kích thước và màu sắc' });
  }

  try {
    const sizeArray = Array.isArray(size) ? size : [size];
    const colorArray = Array.isArray(color) ? color : [color];

    const [product] = await pool.query('SELECT id FROM products WHERE id = ?', [productId]);
    if (!product[0]) {
      console.log(`[POST /api/cart] Product not found: productId=${productId}`);
      return res.status(404).json({ message: 'Sản phẩm không tồn tại' });
    }

    const [existingItem] = await pool.query(
      'SELECT id, quantity FROM cart_items WHERE userId = ? AND productId = ? AND size = ? AND color = ?',
      [req.user.id, productId, JSON.stringify(sizeArray), JSON.stringify(colorArray)]
    );
    if (existingItem.length > 0) {
      const newQuantity = existingItem[0].quantity + quantity;
      await pool.query(
        'UPDATE cart_items SET quantity = ? WHERE id = ?',
        [newQuantity, existingItem[0].id]
      );
      console.log(`[POST /api/cart] Updated: userId=${req.user.id}, productId=${productId}, size=${sizeArray}, color=${colorArray}, newQuantity=${newQuantity}`);
    } else {
      await pool.query(
        'INSERT INTO cart_items (userId, productId, quantity, size, color) VALUES (?, ?, ?, ?, ?)',
        [req.user.id, productId, quantity, JSON.stringify(sizeArray), JSON.stringify(colorArray)]
      );
      console.log(`[POST /api/cart] Added: userId=${req.user.id}, productId=${productId}, size=${sizeArray}, color=${colorArray}, quantity=${quantity}`);
    }
    res.status(201).json({ message: 'Thêm vào giỏ hàng thành công' });
  } catch (err) {
    console.error(`[POST /api/cart] Error: userId=${req.user.id}, productId=${productId}, message=`, err.message);
    res.status(500).json({ message: `Lỗi thêm vào giỏ hàng: ${err.message}` });
  }
});

router.put('/:productId', authenticate, async (req, res) => {
  const { quantity, size, color } = req.body;
  const productId = parseInt(req.params.productId);
  console.log(`[PUT /api/cart] Request: userId=${req.user?.id}, productId=${productId}, quantity=${quantity}, size=${size}, color=${color}`);
  
  if (!Number.isInteger(quantity) || quantity <= 0) {
    console.log(`[PUT /api/cart] Invalid quantity: productId=${productId}, quantity=${quantity}`);
    return res.status(400).json({ message: 'Số lượng không hợp lệ' });
  }
  if (!size || !color) {
    console.log(`[PUT /api/cart] Missing size or color: size=${size}, color=${color}`);
    return res.status(400).json({ message: 'Vui lòng chọn kích thước và màu sắc' });
  }

  try {
    const sizeArray = Array.isArray(size) ? size : [size];
    const colorArray = Array.isArray(color) ? color : [color];

    const [product] = await pool.query('SELECT id FROM products WHERE id = ?', [productId]);
    if (!product[0]) {
      console.log(`[PUT /api/cart] Product not found: productId=${productId}`);
      return res.status(404).json({ message: 'Sản phẩm không tồn tại' });
    }

    const [result] = await pool.query(
      'UPDATE cart_items SET quantity = ?, size = ?, color = ? WHERE userId = ? AND productId = ? AND size = ? AND color = ?',
      [quantity, JSON.stringify(sizeArray), JSON.stringify(colorArray), req.user.id, productId, JSON.stringify(sizeArray), JSON.stringify(colorArray)]
    );
    if (result.affectedRows === 0) {
      console.log(`[PUT /api/cart] Cart item not found: userId=${req.user.id}, productId=${productId}, size=${sizeArray}, color=${colorArray}`);
      return res.status(404).json({ message: 'Sản phẩm không có trong giỏ hàng với kích thước và màu sắc này' });
    }
    console.log(`[PUT /api/cart] Updated: userId=${req.user.id}, productId=${productId}, size=${sizeArray}, color=${colorArray}, quantity=${quantity}`);
    res.json({ message: 'Cập nhật giỏ hàng thành công' });
  } catch (err) {
    console.error(`[PUT /api/cart] Error: userId=${req.user.id}, productId=${productId}, message=`, err.message);
    res.status(500).json({ message: `Lỗi cập nhật giỏ hàng: ${err.message}` });
  }
});

router.delete('/:productId', authenticate, async (req, res) => {
  const productId = parseInt(req.params.productId);
  const { size, color } = req.query;
  console.log(`[DELETE /api/cart] Request: userId=${req.user?.id}, productId=${productId}, size=${size}, color=${color}`);
  
  if (!size || !color) {
    console.log(`[DELETE /api/cart] Missing size or color: size=${size}, color=${color}`);
    return res.status(400).json({ message: 'Vui lòng cung cấp kích thước và màu sắc' });
  }

  try {
    const sizeArray = Array.isArray(size) ? size : [size];
    const colorArray = Array.isArray(color) ? color : [color];

    const [result] = await pool.query(
      'DELETE FROM cart_items WHERE userId = ? AND productId = ? AND size = ? AND color = ?',
      [req.user.id, productId, JSON.stringify(sizeArray), JSON.stringify(colorArray)]
    );
    if (result.affectedRows === 0) {
      console.log(`[DELETE /api/cart] Cart item not found: userId=${req.user.id}, productId=${productId}, size=${sizeArray}, color=${colorArray}`);
      return res.status(404).json({ message: 'Sản phẩm không có trong giỏ hàng với kích thước và màu sắc này' });
    }
    console.log(`[DELETE /api/cart] Removed: userId=${req.user.id}, productId=${productId}, size=${sizeArray}, color=${colorArray}`);
    res.json({ message: 'Xóa sản phẩm khỏi giỏ hàng thành công' });
  } catch (err) {
    console.error(`[DELETE /api/cart] Error: userId=${req.user.id}, productId=${productId}, message=`, err.message);
    res.status(500).json({ message: `Lỗi xóa sản phẩm: ${err.message}` });
  }
});

router.delete('/', authenticate, async (req, res) => {
  console.log(`[DELETE /api/cart (all)] Request: userId=${req.user?.id}`);
  
  try {
    const [result] = await pool.query(
      'DELETE FROM cart_items WHERE userId = ?',
      [req.user.id]
    );
    console.log(`[DELETE /api/cart (all)] Cleared: userId=${req.user.id}, items removed=${result.affectedRows}`);
    res.json({ message: 'Đã xóa toàn bộ giỏ hàng thành công' });
  } catch (err) {
    console.error(`[DELETE /api/cart (all)] Error: userId=${req.user.id}, message=`, err.message);
    res.status(500).json({ message: `Lỗi xóa giỏ hàng: ${err.message}` });
  }
});

module.exports = router;