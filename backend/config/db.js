require('dotenv').config();
const mysql = require('mysql2/promise');
// thông tin kết nối cơ sở dữ liệu MySQL
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '12345678',
  database: process.env.DB_DATABASE || 'Nemshop',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};
// Tạo pool kết nối MySQL
const pool = mysql.createPool(dbConfig);

console.log('[Database] MySQL pool created with config:', {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  database: process.env.DB_DATABASE
});

// Kiểm tra kết nối và schema
async function initializeDatabase() {
  let connection;
  try {
    connection = await pool.getConnection();
    console.log('[Database] Connected to MySQL successfully');

    // Kiểm tra các bảng cần thiết
    const requiredTables = ['products', 'categories', 'notifications', 'orders', 'order_items', 'reviews', 'comments', 'posts', 'users'];
    const [existingTables] = await connection.query(
      `SELECT TABLE_NAME FROM information_schema.tables WHERE table_schema = ?`,
      [process.env.DB_DATABASE || 'Nemshop']
    );
    console.log('[Database] Raw query result:', existingTables);

    const tableNames = Array.isArray(existingTables)
      ? existingTables.map(row => (row.TABLE_NAME || '').toLowerCase())
      : [];
    console.log('[Database] Existing tables:', tableNames);

    for (const table of requiredTables) {
      if (!tableNames.includes(table.toLowerCase())) {
        console.warn(`[Database] Warning: Table ${table} does not exist in database ${process.env.DB_DATABASE}`);
      }
    }

    // Kiểm tra schema của bảng orders
    if (tableNames.includes('orders')) {
      const requiredColumns = [
        'id', 'userId', 'status', 'address', 'phone', 'email', 'total', 'subtotal',
        'shipping_fee', 'discount_amount', 'coupon_id', 'notes', 'payment_method',
        'payment_status', 'tracking_order', 'created_at'
      ];
      const [columns] = await connection.query(
        `SELECT COLUMN_NAME FROM information_schema.columns WHERE table_schema = ? AND table_name = 'orders'`,
        [process.env.DB_DATABASE || 'Nemshop']
      );
      const columnNames = Array.isArray(columns)
        ? columns.map(row => (row.COLUMN_NAME || '').toLowerCase())
        : [];
      console.log('[Database] Existing columns in orders:', columnNames);

      for (const column of requiredColumns) {
        if (!columnNames.includes(column.toLowerCase())) {
          console.warn(`[Database] Warning: Column ${column} does not exist in table orders`);
        }
      }
    }
  } catch (err) {
    console.error('[Database] Error initializing database:', err.message);
    console.log('[Database] Continuing despite error, API functionality may be affected');
  } finally {
    if (connection) connection.release();
  }
}

initializeDatabase();
// Hàm để thực thi câu lệnh SQL với retry logic
const runAsync = async (sql, params = [], retries = 5, delay = 300) => {
  let attempts = 0;
  while (attempts < retries) {
    const connection = await pool.getConnection();
    try {
      const [result] = await connection.execute(sql, params);
      return { changes: result.affectedRows || 0, lastID: result.insertId || 0 };
    } catch (err) {
      if (err.code === 'ER_LOCK_DEADLOCK' && attempts < retries - 1) {
        attempts++;
        console.log(`[Database] ER_LOCK_DEADLOCK, retry ${attempts} after ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        throw err;
      }
    } finally {
      connection.release();
    }
  }
  throw new Error('Max retries reached');
};
// Hàm để lấy một dòng dữ liệu
const getAsync = async (sql, params = []) => {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.execute(sql, params);
    return rows[0] || null;
  } finally {
    connection.release();
  }
};
// Hàm để lấy tất cả dữ liệu
const allAsync = async (sql, params = []) => {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.execute(sql, params);
    return rows;
  } finally {
    connection.release();
  }
};

module.exports = { pool, runAsync, getAsync, allAsync,query: pool.execute.bind(pool)};