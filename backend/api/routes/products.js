const express = require('express');
const router = express.Router();
const { pool, runAsync, getAsync, allAsync } = require('../../config/db');
const fs = require('fs');
const path = require('path');
const { authenticate, restrictTo } = require('../middleware/auth');

// Hàm này sẽ lấy danh sách sản phẩm và lọc 
router.get('/', async (req, res) => { 
  const { limit, categoryId } = req.query;
  let query = `
    SELECT p.*, c.name as categoryName
    FROM products p
    LEFT JOIN categories c ON p.categoryId = c.id
    WHERE p.stock > 0
  `;
  const params = [];

  if (categoryId) {
    query += ' AND p.categoryId = ?';
    params.push(categoryId);
  }

  if (limit) {
    const parsedLimit = parseInt(limit);
    if (!isNaN(parsedLimit) && parsedLimit > 0) {
      query += ` LIMIT ${parsedLimit}`;
    }
  }

  try {
    console.log('[Products] Executing query:', query);
    const rows = await allAsync(query, params);
    console.log('[Products] Query result:', { count: rows.length });
    
    const formattedRows = rows.map(row => ({
      ...row,
      sizes: row.sizes ? row.sizes.split(',').filter(Boolean) : [],
      colors: row.colors ? row.colors.split(',').filter(Boolean) : [],
      variants: row.variants ? JSON.parse(row.variants) : [],
      images: row.images ? JSON.parse(row.images) : row.image ? [row.image] : [],
      model3d: row.model3d || null, // Thêm model3d
      discount_price: row.discount_price || null
    }));
    
    console.log('[Products] Lấy danh sách sản phẩm:', { count: formattedRows.length });
    res.json({ products: formattedRows });
  } catch (err) {
    console.error('[Products] Lỗi lấy sản phẩm:', err.message);
    res.status(500).json({ message: 'Lỗi khi lấy sản phẩm: ' + err.message });
  }
});

// Hàm này sẽ tìm kiếm sản phẩm theo các tiêu chí
router.get('/search', async (req, res) => { 
  const { q, categoryId, minPrice, maxPrice, minRating, onSale, color, size, brand, sort, page, limit } = req.query;
  
  // Tạo query cho đếm số lượng
  let countQuery = `
    SELECT COUNT(*) as total
    FROM products p
    LEFT JOIN categories c ON p.categoryId = c.id
    WHERE p.stock > 0
  `;
  
  // Tạo query cho danh sách sản phẩm
  let mainQuery = `
    SELECT p.*, c.name as categoryName
    FROM products p
    LEFT JOIN categories c ON p.categoryId = c.id
    WHERE p.stock > 0
  `;
  
  // Mảng tham số cho truy vấn
  const params = [];
  
  // Xây dựng các điều kiện
  const conditions = [];

  // Thêm các điều kiện lọc vào truy vấn
  if (q) {
    conditions.push('p.name LIKE ?');
    params.push(`%${q}%`);
    console.log('[Debug] Added q condition:', { q });
  }

  if (categoryId) {
    conditions.push('p.categoryId = ?');
    params.push(categoryId);
    console.log('[Debug] Added categoryId condition:', { categoryId });
  }

  // Kiểm tra và xử lý minPrice
  const parsedMinPrice = minPrice ? parseFloat(minPrice) : undefined;
  if (parsedMinPrice !== undefined && !isNaN(parsedMinPrice) && parsedMinPrice >= 0) {
    conditions.push('(p.discount_price IS NOT NULL AND p.discount_price >= ? OR p.discount_price IS NULL AND p.price >= ?)');
    params.push(parsedMinPrice, parsedMinPrice);
    console.log('[Debug] Added minPrice condition:', { minPrice: parsedMinPrice });
  }

  // Kiểm tra và xử lý maxPrice
  const parsedMaxPrice = maxPrice ? parseFloat(maxPrice) : undefined;
  if (parsedMaxPrice !== undefined && !isNaN(parsedMaxPrice) && parsedMaxPrice >= 0) {
    conditions.push('(p.discount_price IS NOT NULL AND p.discount_price <= ? OR p.discount_price IS NULL AND p.price <= ?)');
    params.push(parsedMaxPrice, parsedMaxPrice);
    console.log('[Debug] Added maxPrice condition:', { maxPrice: parsedMaxPrice });
  }

  // Kiểm tra và xử lý minRating
  const parsedMinRating = minRating ? parseFloat(minRating) : undefined;
  if (parsedMinRating !== undefined && !isNaN(parsedMinRating) && parsedMinRating >= 0 && parsedMinRating <= 5) {
    conditions.push(`p.id IN (
      SELECT productId 
      FROM reviews 
      GROUP BY productId 
      HAVING AVG(rating) >= ?
    )`);
    params.push(parsedMinRating);
    console.log('[Debug] Added minRating condition:', { minRating: parsedMinRating });
  }

  if (onSale === 'true') {
    conditions.push('p.discount_price IS NOT NULL');
    console.log('[Debug] Added onSale condition');
  }

  if (color) {
    conditions.push('(p.colors LIKE ? OR p.colors = ?)');
    params.push(`%${color}%`, color);
    console.log('[Debug] Added color condition:', { color });
  }

  if (size) {
    conditions.push('(p.sizes LIKE ? OR p.sizes = ?)');
    params.push(`%${size}%`, size);
    console.log('[Debug] Added size condition:', { size });
  }

  if (brand) {
    conditions.push('p.brand = ?');
    params.push(brand);
    console.log('[Debug] Added brand condition:', { brand });
  }

  // Kết hợp các điều kiện
  if (conditions.length > 0) {
    const conditionString = ' AND ' + conditions.join(' AND ');
    countQuery += conditionString;
    mainQuery += conditionString;
  }

  // Xử lý sắp xếp
  if (sort) {
    switch (sort) {
      case 'price_asc':
        mainQuery += ' ORDER BY COALESCE(p.discount_price, p.price) ASC';
        console.log('[Debug] Added sort: price_asc');
        break;
      case 'price_desc':
        mainQuery += ' ORDER BY COALESCE(p.discount_price, p.price) DESC';
        console.log('[Debug] Added sort: price_desc');
        break;
      case 'newest':
        mainQuery += ' ORDER BY p.id DESC';
        console.log('[Debug] Added sort: newest');
        break;
      case 'rating_desc':
        mainQuery += `
          LEFT JOIN (
            SELECT productId, AVG(rating) as avgRating
            FROM reviews
            GROUP BY productId
          ) r ON p.id = r.productId
          ORDER BY r.avgRating DESC
        `;
        console.log('[Debug] Added sort: rating_desc');
        break;
      default:
        // Mặc định sắp xếp theo ID giảm dần
        mainQuery += ' ORDER BY p.id DESC';
        console.log('[Debug] Using default sort: id DESC');
        break;
    }
  } else {
    // Mặc định sắp xếp theo ID giảm dần
    mainQuery += ' ORDER BY p.id DESC';
    console.log('[Debug] Using default sort: id DESC');
  }

  // Xử lý phân trang
  const parsedLimit = limit ? parseInt(limit) : undefined;
  const parsedPage = page ? parseInt(page) : undefined;
  
  let limitClause = '';
  if (parsedLimit !== undefined && !isNaN(parsedLimit) && parsedLimit > 0) {
    if (parsedPage !== undefined && !isNaN(parsedPage) && parsedPage > 0) {
      const offset = (parsedPage - 1) * parsedLimit;
      limitClause = ` LIMIT ${parsedLimit} OFFSET ${offset}`;
    } else {
      limitClause = ` LIMIT ${parsedLimit}`;
    }
    console.log('[Debug] Added pagination:', { limit: parsedLimit, page: parsedPage });
  }
  
  // Thêm LIMIT vào main query
  mainQuery += limitClause;

  try {
    console.log('[Products] Final Count Query:', countQuery);
    console.log('[Products] Final Count Params:', params);
    const countResults = await allAsync(countQuery, params);
    const total = countResults[0]?.total || 0;

    console.log('[Products] Final Main Query:', mainQuery);
    console.log('[Products] Final Main Params:', params);
    const rows = await allAsync(mainQuery, params);
    
    const formattedRows = rows.map(row => ({
      ...row,
      sizes: row.sizes ? row.sizes.split(',').filter(Boolean) : [],
      colors: row.colors ? row.colors.split(',').filter(Boolean) : [],
      variants: row.variants ? JSON.parse(row.variants) : [],
      images: row.images ? JSON.parse(row.images) : row.image ? [row.image] : [],
      model3d: row.model3d || null, // Thêm model3d
      discount_price: row.discount_price || null
    }));
    
    console.log('[Products] Tìm kiếm sản phẩm:', { query: req.query, count: rows.length, total });
    res.json({ products: formattedRows, total });
  } catch (err) {
    console.error('[Products] Lỗi tìm kiếm sản phẩm:', err.message);
    res.status(500).json({ message: 'Lỗi tìm kiếm sản phẩm: ' + err.message });
  }
});

// Lấy danh sách sản phẩm hết hàng (Cho admin)
router.get('/out-of-stock', authenticate, restrictTo('admin'), async (req, res) => {
  const { limit } = req.query;
  let query = `
    SELECT p.*, c.name as categoryName
    FROM products p
    LEFT JOIN categories c ON p.categoryId = c.id
    WHERE p.stock = 0
  `;

  // Xử lý limit trực tiếp trong chuỗi truy vấn
  if (limit) {
    const parsedLimit = parseInt(limit);
    if (!isNaN(parsedLimit) && parsedLimit > 0) {
      query += ` LIMIT ${parsedLimit}`;
    }
  }

  try {
    const rows = await allAsync(query, []);
    const formattedRows = rows.map(row => ({
      ...row,
      sizes: row.sizes ? row.sizes.split(',').filter(Boolean) : [],
      colors: row.colors ? row.colors.split(',').filter(Boolean) : [],
      variants: row.variants ? JSON.parse(row.variants) : [],
      images: row.images ? JSON.parse(row.images) : row.image ? [row.image] : [],
      model3d: row.model3d || null, // Thêm model3d
      discount_price: row.discount_price || null
    }));
    console.log('[Products] Lấy sản phẩm hết hàng:', { count: rows.length });
    res.json({ products: formattedRows });
  } catch (err) {
    console.error('[Products] Lỗi lấy sản phẩm hết hàng:', err.message);
    res.status(500).json({ message: 'Lỗi khi lấy sản phẩm hết hàng: ' + err.message });
  }
});

// Tìm kiếm gợi ý sản phẩm
router.get('/autocomplete', async (req, res) => {
  const { q } = req.query;
  if (!q || q.length < 2) {
    return res.json({ products: [] });
  }
  
  // Sử dụng LIMIT trực tiếp trong chuỗi truy vấn
  let query = `
    SELECT p.*
    FROM products p
    WHERE p.name LIKE ? AND p.stock > 0
    LIMIT 5
  `;
  
  const params = [`%${q}%`];
  
  try {
    const rows = await allAsync(query, params);
    const formattedRows = rows.map(row => ({
      ...row,
      sizes: row.sizes ? row.sizes.split(',').filter(Boolean) : [],
      colors: row.colors ? row.colors.split(',').filter(Boolean) : [],
      variants: row.variants ? JSON.parse(row.variants) : [],
      images: row.images ? JSON.parse(row.images) : row.image ? [row.image] : [],
      model3d: row.model3d || null, // Thêm model3d
      discount_price: row.discount_price || null
    }));
    console.log('[Products] Tìm kiếm gợi ý:', { query: q, count: rows.length });
    res.json({ products: formattedRows });
  } catch (err) {
    console.error('[Products] Lỗi tìm kiếm gợi ý:', err.message);
    res.status(500).json({ message: 'Lỗi tìm kiếm gợi ý: ' + err.message });
  }
});
 
// Lấy thông tin sản phẩm theo ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const row = await getAsync(
      `SELECT p.*, c.name as categoryName
       FROM products p
       LEFT JOIN categories c ON p.categoryId = c.id
       WHERE p.id = ?`,
      [id]
    );
    if (!row) {
      console.log('[Products] Sản phẩm không tồn tại:', id);
      return res.status(404).json({ message: 'Sản phẩm không tồn tại' });
    }
    row.sizes = row.sizes ? row.sizes.split(',').filter(Boolean) : [];
    row.colors = row.colors ? row.colors.split(',').filter(Boolean) : [];
    row.variants = row.variants ? JSON.parse(row.variants) : [];
    row.images = row.images ? JSON.parse(row.images) : row.image ? [row.image] : [];
    row.model3d = row.model3d || null; // Thêm model3d
    row.discount_price = row.discount_price || null;
    console.log('[Products] Lấy sản phẩm:', { id, hasModel3D: !!row.model3d });
    res.json(row);
  } catch (err) {
    console.error('[Products] Lỗi lấy sản phẩm:', err.message);
    res.status(500).json({ message: 'Lỗi khi lấy sản phẩm: ' + err.message });
  }
});

// Thêm sản phẩm mới
router.post('/', authenticate, restrictTo('admin'), async (req, res) => {
  const { 
    name, 
    price, 
    description, 
    images, 
    categoryId, 
    stock, 
    discount_price, 
    sizes = [], 
    colors = [], 
    variants = [],
    model3d // Thêm model3d
  } = req.body;
  
  console.log('[Products] Yêu cầu thêm sản phẩm:', {
    ...req.body,
    hasModel3D: !!model3d
  });
  
  if (!name || !price || !description || !categoryId || stock === undefined) {
    console.log('[Products] Thiếu thông tin:', req.body);
    return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin' });
  }
  
  if (discount_price && (discount_price >= price || discount_price <= 0)) {
    console.log('[Products] Giá giảm không hợp lệ:', { price, discount_price });
    return res.status(400).json({ message: 'Giá giảm phải nhỏ hơn giá gốc và lớn hơn 0' });
  }

  const productImages = Array.isArray(images) && images.length > 0 ? images : ['https://via.placeholder.com/300x200?text=No+Image'];
  const sizesStr = sizes.length > 0 ? sizes.join(',') : '';
  const colorsStr = colors.length > 0 ? colors.join(',') : '';

  try {
    const result = await runAsync(
      `INSERT INTO products (name, price, description, image, images, categoryId, stock, discount_price, sizes, colors, variants, model3d)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        price,
        description,
        productImages[0] || 'https://via.placeholder.com/300x200?text=No+Image',
        JSON.stringify(productImages),
        categoryId,
        stock,
        discount_price || null,
        sizesStr,
        colorsStr,
        JSON.stringify(variants),
        model3d || null // Thêm model3d vào INSERT
      ]
    );

    const productId = result.lastID;
    const title = `Sản phẩm mới: ${name}`;
    const message = `Sản phẩm mới: ${name} vừa được thêm!${model3d ? ' (Có mô hình 3D)' : ''} Nhấn để xem ngay.`;
    const link = `/san-pham/${productId}`;
    
    await runAsync(
      'INSERT INTO notifications (title, message, link, userId) VALUES (?, ?, ?, NULL)',
      [title, message, link]
    );
    
    console.log('[Products] Thêm sản phẩm thành công:', { 
      productId, 
      name, 
      hasModel3D: !!model3d,
      model3dUrl: model3d 
    });
    
    res.status(201).json({ 
      message: 'Thêm sản phẩm thành công', 
      productId,
      model3d: model3d || null
    });
  } catch (err) {
    console.error('[Products] Lỗi thêm sản phẩm:', err.message);
    res.status(500).json({ message: 'Lỗi khi thêm sản phẩm: ' + err.message });
  }
});

// Cập nhật sản phẩm 
router.put('/:id', authenticate, restrictTo('admin'), async (req, res) => {
  const { id } = req.params;
  const { 
    name, 
    price, 
    description, 
    images, 
    categoryId, 
    stock, 
    discount_price, 
    sizes = [], 
    colors = [], 
    variants = [],
    model3d // Thêm model3d
  } = req.body;

  if (!name || !price || !description || !categoryId || stock === undefined) {
    console.log('[Products] Thiếu thông tin:', req.body);
    return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin' });
  }
  
  if (discount_price && (discount_price >= price || discount_price <= 0)) {
    console.log('[Products] Giá giảm không hợp lệ:', { price, discount_price });
    return res.status(400).json({ message: 'Giá giảm phải nhỏ hơn giá gốc và lớn hơn 0' });
  }

  try {
    const row = await getAsync('SELECT image, images, model3d FROM products WHERE id = ?', [id]);
    if (!row) {
      console.log('[Products] Sản phẩm không tồn tại:', id);
      return res.status(404).json({ message: 'Sản phẩm không tồn tại' });
    }

    const oldImageUrl = row.image;
    const oldImages = row.images ? JSON.parse(row.images) : row.image ? [row.image] : [];
    const oldModel3d = row.model3d;
    const productImages = Array.isArray(images) && images.length > 0 ? images : ['https://via.placeholder.com/300x200?text=No+Image'];
    const sizesStr = sizes.length > 0 ? sizes.join(',') : '';
    const colorsStr = colors.length > 0 ? colors.join(',') : '';

    const result = await runAsync(
      `UPDATE products SET name = ?, price = ?, description = ?, image = ?, images = ?, categoryId = ?, stock = ?, discount_price = ?, sizes = ?, colors = ?, variants = ?, model3d = ? WHERE id = ?`,
      [
        name,
        price,
        description,
        productImages[0] || 'https://via.placeholder.com/300x200?text=No+Image',
        JSON.stringify(productImages),
        categoryId,
        stock,
        discount_price || null,
        sizesStr,
        colorsStr,
        JSON.stringify(variants),
        model3d || null, // Thêm model3d vào UPDATE
        id
      ]
    );

    if (result.changes === 0) {
      console.log('[Products] Sản phẩm không tồn tại hoặc không có thay đổi:', id);
      return res.status(404).json({ message: 'Sản phẩm không tồn tại hoặc không có thay đổi' });
    }

    // Xóa ảnh cũ nếu có thay đổi
    const newImages = productImages.filter(img => img !== 'https://via.placeholder.com/300x200?text=No+Image');
    const imagesToDelete = oldImages.filter(img => !newImages.includes(img) && img !== 'https://via.placeholder.com/300x200?text=No+Image');

    imagesToDelete.forEach(img => {
      const fileName = path.basename(img);
      const filePath = path.join(__dirname, '../../Uploads', fileName);
      fs.unlink(filePath, (err) => {
        if (err) {
          console.error('[Products] Lỗi khi xóa ảnh cũ:', err.message);
        } else {
          console.log('[Products] Đã xóa ảnh cũ:', fileName);
        }
      });
    });

    // Xóa file 3D cũ nếu có thay đổi
    if (oldModel3d && oldModel3d !== model3d) {
      const fileName = path.basename(oldModel3d);
      const filePath = path.join(__dirname, '../../Uploads/3d', fileName);
      fs.unlink(filePath, (err) => {
        if (err) {
          console.error('[Products] Lỗi khi xóa file 3D cũ:', err.message);
        } else {
          console.log('[Products] Đã xóa file 3D cũ:', fileName);
        }
      });
    }

    console.log('[Products] Cập nhật sản phẩm thành công:', { 
      id, 
      hasModel3D: !!model3d,
      model3dChanged: oldModel3d !== model3d 
    });
    
    res.json({ message: 'Cập nhật sản phẩm thành công' });
  } catch (err) {
    console.error('[Products] Lỗi cập nhật sản phẩm:', err.message);
    res.status(500).json({ message: 'Lỗi khi cập nhật sản phẩm: ' + err.message });
  }
});

// Xóa sản phẩm 
router.delete('/:id', authenticate, restrictTo('admin'), async (req, res) => {
  const { id } = req.params;
  try {
    const row = await getAsync('SELECT images, model3d FROM products WHERE id = ?', [id]);
    if (!row) {
      console.log('[Products] Sản phẩm không tồn tại:', id);
      return res.status(404).json({ message: 'Sản phẩm không tồn tại' });
    }

    const images = row.images ? JSON.parse(row.images) : [];
    const model3d = row.model3d;
    
    const result = await runAsync('DELETE FROM products WHERE id = ?', [id]);
    if (result.changes === 0) {
      console.log('[Products] Sản phẩm không tồn tại:', id);
      return res.status(404).json({ message: 'Sản phẩm không tồn tại' });
    }

    // Xóa hình ảnh
    images.forEach(img => {
      if (img !== 'https://via.placeholder.com/300x200?text=No+Image') {
        const fileName = path.basename(img);
        const filePath = path.join(__dirname, '../../Uploads', fileName);
        fs.unlink(filePath, (err) => {
          if (err) {
            console.error('[Products] Lỗi khi xóa ảnh:', err.message);
          } else {
            console.log('[Products] Đã xóa ảnh:', fileName);
          }
        });
      }
    });

    // Xóa file 3D nếu có
    if (model3d) {
      const fileName = path.basename(model3d);
      const filePath = path.join(__dirname, '../../Uploads/3d', fileName);
      fs.unlink(filePath, (err) => {
        if (err) {
          console.error('[Products] Lỗi khi xóa file 3D:', err.message);
        } else {
          console.log('[Products] Đã xóa file 3D:', fileName);
        }
      });
    }

    console.log('[Products] Xóa sản phẩm thành công:', { 
      id, 
      deletedImages: images.length,
      deletedModel3D: !!model3d 
    });
    
    res.json({ message: 'Xóa sản phẩm thành công' });
  } catch (err) {
    console.error('[Products] Lỗi xóa sản phẩm:', err.message);
    res.status(500).json({ message: 'Lỗi khi xóa sản phẩm: ' + err.message });
  }
});

// Cập nhật tồn kho sản phẩm
router.put('/inventory/:id', authenticate, restrictTo('admin'), async (req, res) => {
  const { id } = req.params;
  const { stock, variants } = req.body;
  if (stock < 0) {
    console.log('[Products] Tồn kho không hợp lệ:', { stock });
    return res.status(400).json({ message: 'Tồn kho không thể âm' });
  }
  try {
    const result = await runAsync(
      'UPDATE products SET stock = ?, variants = ? WHERE id = ?',
      [stock, JSON.stringify(variants || []), id]
    );
    if (result.changes === 0) {
      console.log('[Products] Sản phẩm không tồn tại:', id);
      return res.status(404).json({ message: 'Sản phẩm không tồn tại' });
    }
    console.log('[Products] Cập nhật tồn kho thành công:', { id, stock });
    res.json({ message: 'Cập nhật tồn kho thành công' });
  } catch (err) {
    console.error('[Products] Lỗi cập nhật tồn kho:', err.message);
    res.status(500).json({ message: 'Lỗi khi cập nhật tồn kho: ' + err.message });
  }
});

module.exports = router;