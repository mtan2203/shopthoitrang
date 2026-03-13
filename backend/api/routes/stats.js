const express = require('express');
const router = express.Router();
const db = require('../../config/db');
const { authenticate, restrictTo } = require('../middleware/auth');

// API lấy thống kê tổng quan cho dashboard
router.get('/dashboard', authenticate, restrictTo('admin'), async (req, res) => {
  try {
    const { timeRange = 'all' } = req.query;
    console.log('[Stats] Lấy thống kê dashboard, timeRange:', timeRange);
    
    let timeFilter = '';
    let params = [];
    
    const now = new Date();
    if (timeRange === '3m') {
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(now.getMonth() - 3);
      timeFilter = 'WHERE o.createdAt >= ?';
      params.push(threeMonthsAgo.toISOString());
    } else if (timeRange === '6m') {
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(now.getMonth() - 6);
      timeFilter = 'WHERE o.createdAt >= ?';
      params.push(sixMonthsAgo.toISOString());
    }
    
    const totalOrdersResult = await db.getAsync(
      `SELECT COUNT(*) as total FROM orders o ${timeFilter} ${timeFilter ? 'AND' : 'WHERE'} o.status != 'cancelled'`,
      params
    );
    
    const totalRevenueResult = await db.getAsync(
      `SELECT SUM(total) as total FROM orders o ${timeFilter} ${timeFilter ? 'AND' : 'WHERE'} o.status != 'cancelled'`,
      params
    );
    
    const bestSellingProductResult = await db.getAsync(
      `SELECT p.id, p.name, SUM(oi.quantity) as sold
       FROM products p
       JOIN order_items oi ON p.id = oi.productId
       JOIN orders o ON oi.orderId = o.id
       ${timeFilter} ${timeFilter ? 'AND' : 'WHERE'} o.status != 'cancelled'
       GROUP BY p.id
       ORDER BY sold DESC
       LIMIT 1`,
      params
    );

    let monthlyQuery;
    if (timeRange === 'all') {
      monthlyQuery = `
        SELECT 
          DATE_FORMAT(o.createdAt, '%m') as month,
          DATE_FORMAT(o.createdAt, '%Y') as year,
          SUM(o.total) as revenue,
          COUNT(DISTINCT o.id) as orders
        FROM orders o
        WHERE o.status != 'cancelled'
        GROUP BY year, month
        ORDER BY year, month
        LIMIT 12`;
    } else {
      monthlyQuery = `
        SELECT 
          DATE_FORMAT(o.createdAt, '%m') as month,
          DATE_FORMAT(o.createdAt, '%Y') as year,
          SUM(o.total) as revenue,
          COUNT(DISTINCT o.id) as orders
        FROM orders o
        ${timeFilter} AND o.status != 'cancelled'
        GROUP BY year, month
        ORDER BY year, month`;
    }
    
    const monthlySalesResult = await db.allAsync(monthlyQuery, params.length > 0 ? params : []);
    
    const monthNames = ['Th1', 'Th2', 'Th3', 'Th4', 'Th5', 'Th6', 'Th7', 'Th8', 'Th9', 'Th10', 'Th11', 'Th12'];
    const formattedMonthlySales = monthlySalesResult.map(item => ({
      month: `${monthNames[parseInt(item.month) - 1]}/${item.year.slice(2)}`,
      revenue: parseInt(item.revenue) || 0,
      orders: parseInt(item.orders) || 0
    }));
    
    const customerCountResult = await db.getAsync(
      `SELECT COUNT(DISTINCT userId) as total FROM orders o ${timeFilter}`,
      params
    );
    
    const avgOrderValueResult = await db.getAsync(
      `SELECT AVG(total) as average FROM orders o ${timeFilter} ${timeFilter ? 'AND' : 'WHERE'} o.status != 'cancelled'`,
      params
    );

    const newCommentsResult = await db.getAsync(
      `SELECT COUNT(*) as total 
       FROM comments c
       JOIN posts p ON c.postId = p.id
       ${timeFilter ? timeFilter.replace('o.createdAt', 'c.createdAt') : ''}`,
      params
    );

    const result = {
      totalOrders: totalOrdersResult.total || 0,
      totalRevenue: totalRevenueResult.total || 0,
      bestSellingProduct: bestSellingProductResult || null,
      monthlySales: formattedMonthlySales,
      customerCount: customerCountResult.total || 0,
      avgOrderValue: Math.round(avgOrderValueResult.average) || 0,
      newComments: newCommentsResult.total || 0,
      orderStatusStats: await getOrderStatusStats(timeFilter, params)
    };

    console.log('[Stats] Thống kê dashboard:', result);
    res.json(result);
  } catch (err) {
    console.error('[Stats] Lỗi lấy thống kê dashboard:', err.message);
    res.status(500).json({ message: 'Lỗi server: ' + err.message });
  }
});

// API lấy thống kê doanh thu chi tiết
router.get('/revenue', authenticate, restrictTo('admin'), async (req, res) => {
  try {
    const { timeRange = 'all', groupBy = 'month' } = req.query;
    console.log('[Stats] Lấy thống kê doanh thu, timeRange:', timeRange, 'groupBy:', groupBy);

    let timeFilter = '';
    let params = [];
    const now = new Date();

    if (timeRange === '3m') {
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(now.getMonth() - 3);
      timeFilter = 'WHERE o.createdAt >= ?';
      params.push(threeMonthsAgo.toISOString());
    } else if (timeRange === '6m') {
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(now.getMonth() - 6);
      timeFilter = 'WHERE o.createdAt >= ?';
      params.push(sixMonthsAgo.toISOString());
    }

    let groupByClause = '';
    let formatLabel = (item) => '';
    if (groupBy === 'day') {
      groupByClause = `DATE_FORMAT(o.createdAt, '%Y-%m-%d') as period`;
      formatLabel = (item) => item.period;
    } else if (groupBy === 'week') {
      groupByClause = `DATE_FORMAT(o.createdAt, '%Y-%U') as period`;
      formatLabel = (item) => `Tuần ${item.period.split('-')[1]}/${item.period.split('-')[0].slice(2)}`;
    } else if (groupBy === 'month') {
      groupByClause = `DATE_FORMAT(o.createdAt, '%m') as month, DATE_FORMAT(o.createdAt, '%Y') as year`;
      const monthNames = ['Th1', 'Th2', 'Th3', 'Th4', 'Th5', 'Th6', 'Th7', 'Th8', 'Th9', 'Th10', 'Th11', 'Th12'];
      formatLabel = (item) => `${monthNames[parseInt(item.month) - 1]}/${item.year.slice(2)}`;
    } else if (groupBy === 'year') {
      groupByClause = `DATE_FORMAT(o.createdAt, '%Y') as period`;
      formatLabel = (item) => item.period;
    } else {
      return res.status(400).json({ message: 'groupBy không hợp lệ. Chọn: day, week, month, year' });
    }

    const revenueQuery = `
      SELECT 
        ${groupByClause},
        SUM(o.total) as revenue,
        COUNT(DISTINCT o.id) as orders
      FROM orders o
      ${timeFilter} ${timeFilter ? 'AND' : 'WHERE'} o.status != 'cancelled'
      GROUP BY ${groupBy === 'month' ? 'year, month' : 'period'}
      ORDER BY ${groupBy === 'month' ? 'year, month' : 'period'}
      ${timeRange === 'all' ? 'LIMIT 12' : ''}
    `;

    const revenueResult = await db.allAsync(revenueQuery, params);

    const formattedRevenue = revenueResult.map(item => ({
      period: formatLabel(item),
      revenue: parseInt(item.revenue) || 0,
      orders: parseInt(item.orders) || 0
    }));

    res.json({
      revenueData: formattedRevenue,
      totalRevenue: formattedRevenue.reduce((sum, item) => sum + item.revenue, 0),
      totalOrders: formattedRevenue.reduce((sum, item) => sum + item.orders, 0)
    });
  } catch (err) {
    console.error('[Stats] Lỗi lấy thống kê doanh thu:', err.message);
    res.status(500).json({ message: 'Lỗi server: ' + err.message });
  }
});

// Hàm lấy thống kê theo trạng thái đơn hàng
async function getOrderStatusStats(timeFilter, params) {
  const statusQuery = `
    SELECT 
      status, 
      COUNT(*) as count
    FROM orders o
    ${timeFilter}
    GROUP BY status
  `;
  
  const statusResults = await db.allAsync(statusQuery, params);
  const statusStats = {
    pending: 0,
    processing: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0
  };
  
  statusResults.forEach(item => {
    if (statusStats.hasOwnProperty(item.status)) {
      statusStats[item.status] = item.count;
    }
  });
  
  return statusStats;
}

module.exports = router;