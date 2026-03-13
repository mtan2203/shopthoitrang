// AdminStats.jsx
import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { Helmet } from 'react-helmet-async';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { getDashboardStats, getRevenueStats } from '../../services/api';

// Custom colors cho biểu đồ
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];
const STATUS_COLORS = {
  pending: '#FFB74D',    // Cam
  processing: '#42A5F5', // Xanh dương
  shipped: '#9575CD',    // Tím nhạt
  delivered: '#4CAF50',  // Xanh lá
  cancelled: '#EF5350'   // Đỏ
};

const AdminStats = () => {
  const { user } = useContext(AuthContext);
  const [dashboardStats, setDashboardStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    bestSellingProduct: null,
    monthlySales: [],
    customerCount: 0,
    avgOrderValue: 0,
    orderStatusStats: {
      pending: 0,
      processing: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0
    }
  });
  // NEW: State cho thống kê doanh thu chi tiết
  const [revenueStats, setRevenueStats] = useState({
    revenueData: [],
    totalRevenue: 0,
    totalOrders: 0
  });
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('all');
  const [groupBy, setGroupBy] = useState('month'); // NEW: Bộ lọc groupBy
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchStats();
      fetchRevenueStats(); // NEW: Gọi API doanh thu
    }
  }, [user, timeRange, groupBy]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await getDashboardStats(timeRange);
      setDashboardStats(response.data);
    } catch (error) {
      console.error('Lỗi khi lấy dữ liệu thống kê:', error);
      setError('Không thể tải dữ liệu thống kê. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  // NEW: Hàm lấy thống kê doanh thu
  const fetchRevenueStats = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await getRevenueStats(timeRange, groupBy);
      setRevenueStats(response.data);
    } catch (error) {
      console.error('Lỗi khi lấy dữ liệu thống kê doanh thu:', error);
      setError('Không thể tải dữ liệu thống kê doanh thu. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  const handleTimeRangeChange = (range) => {
    setTimeRange(range);
  };

  // NEW: Xử lý thay đổi groupBy
  const handleGroupByChange = (group) => {
    setGroupBy(group);
  };

  // Chuẩn bị dữ liệu cho biểu đồ tròn trạng thái đơn hàng
  const prepareOrderStatusData = () => {
    const { orderStatusStats } = dashboardStats;
    return Object.keys(orderStatusStats).map(key => ({
      name: key.charAt(0).toUpperCase() + key.slice(1),
      value: orderStatusStats[key]
    }));
  };

  // Format tiền tệ VND
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('vi-VN', { 
      style: 'currency', 
      currency: 'VND',
      maximumFractionDigits: 0
    }).format(value);
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center bg-red-50 p-8 rounded-lg shadow">
          <p className="text-xl text-red-600 font-medium">
            Vui lòng đăng nhập để truy cập.
          </p>
        </div>
      </div>
    );
  }

  if (user?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center bg-red-50 p-8 rounded-lg shadow">
          <p className="text-xl text-red-600 font-medium">
            Bạn không có quyền truy cập trang này.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xl font-semibold text-gray-700">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center bg-red-50 p-8 rounded-lg shadow">
          <p className="text-xl text-red-600 font-medium">{error}</p>
          <button 
            onClick={() => { fetchStats(); fetchRevenueStats(); }}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  const orderStatusData = prepareOrderStatusData();

  return (
    <div className="container mx-auto py-10 px-4">
      <Helmet>
        <title>Thống Kê - Quản Trị XYZ</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2 text-center">
          Bảng Điều Khiển Thống Kê
        </h1>
        <p className="text-gray-600 text-center">
          Dữ liệu thống kê được cập nhật theo thời gian thực
        </p>
      </header>

      {/* Time Range and GroupBy Filter */}
      <div className="mb-8 flex justify-between flex-wrap gap-4">
        {/* Time Range Filter */}
        <div className="inline-flex bg-gray-200 rounded-lg p-1 shadow-sm">
          <button
            onClick={() => handleTimeRangeChange('all')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              timeRange === 'all'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-700 hover:bg-gray-300'
            }`}
          >
            Tất cả
          </button>
          <button
            onClick={() => handleTimeRangeChange('6m')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              timeRange === '6m'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-700 hover:bg-gray-300'
            }`}
          >
            6 Tháng
          </button>
          <button
            onClick={() => handleTimeRangeChange('3m')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              timeRange === '3m'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-700 hover:bg-gray-300'
            }`}
          >
            3 Tháng
          </button>
        </div>

        {/* NEW: GroupBy Filter */}
        <div className="inline-flex bg-gray-200 rounded-lg p-1 shadow-sm">
          <button
            onClick={() => handleGroupByChange('day')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              groupBy === 'day'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-700 hover:bg-gray-300'
            }`}
          >
            Theo Ngày
          </button>
          <button
            onClick={() => handleGroupByChange('week')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              groupBy === 'week'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-700 hover:bg-gray-300'
            }`}
          >
            Theo Tuần
          </button>
          <button
            onClick={() => handleGroupByChange('month')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              groupBy === 'month'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-700 hover:bg-gray-300'
            }`}
          >
            Theo Tháng
          </button>
          <button
            onClick={() => handleGroupByChange('year')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              groupBy === 'year'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-700 hover:bg-gray-300'
            }`}
          >
            Theo Năm
          </button>
        </div>
      </div>

      {/* Dashboard Statistics Cards */}
      <section className="mb-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Tổng đơn hàng */}
          <div className="bg-white shadow-lg rounded-xl p-6 border-l-4 border-blue-500">
            <h3 className="text-gray-500 text-sm uppercase font-medium">Tổng Đơn Hàng</h3>
            <div className="mt-2 flex items-baseline">
              <p className="text-3xl font-bold text-gray-800">{revenueStats.totalOrders.toLocaleString()}</p>
              <p className="ml-2 text-sm text-gray-500">đơn</p>
            </div>
          </div>
          
          {/* Tổng doanh thu */}
          <div className="bg-white shadow-lg rounded-xl p-6 border-l-4 border-green-500">
            <h3 className="text-gray-500 text-sm uppercase font-medium">Tổng Doanh Thu</h3>
            <div className="mt-2">
              <p className="text-3xl font-bold text-gray-800">
                {formatCurrency(revenueStats.totalRevenue)}
              </p>
            </div>
          </div>
          
          {/* Số khách hàng */}
          <div className="bg-white shadow-lg rounded-xl p-6 border-l-4 border-purple-500">
            <h3 className="text-gray-500 text-sm uppercase font-medium">Khách Hàng</h3>
            <div className="mt-2 flex items-baseline">
              <p className="text-3xl font-bold text-gray-800">{dashboardStats.customerCount.toLocaleString()}</p>
              <p className="ml-2 text-sm text-gray-500">người</p>
            </div>
          </div>
          
          {/* Giá trị đơn hàng trung bình */}
          <div className="bg-white shadow-lg rounded-xl p-6 border-l-4 border-amber-500">
            <h3 className="text-gray-500 text-sm uppercase font-medium">Giá Trị Đơn TB</h3>
            <div className="mt-2">
              <p className="text-3xl font-bold text-gray-800">
                {formatCurrency(dashboardStats.avgOrderValue)}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
        {/* Revenue Chart */}
        <div className="bg-white shadow-lg rounded-xl p-6 lg:col-span-2">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Doanh Thu Theo {groupBy === 'day' ? 'Ngày' : groupBy === 'week' ? 'Tuần' : groupBy === 'month' ? 'Tháng' : 'Năm'}</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueStats.revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="period" />
                <YAxis 
                  tickFormatter={(value) => value.toLocaleString()} 
                  width={80}
                />
                <Tooltip 
                  formatter={(value) => [formatCurrency(value), 'Doanh thu']}
                  labelStyle={{fontWeight: 'bold'}}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  name="Doanh thu" 
                  stroke="#2563eb" 
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Order Status Chart */}
        <div className="bg-white shadow-lg rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Trạng Thái Đơn Hàng</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={orderStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {orderStatusData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={STATUS_COLORS[entry.name.toLowerCase()] || COLORS[index % COLORS.length]} 
                    />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} đơn hàng`, '']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Best Selling Product */}
      <section className="bg-white shadow-lg rounded-xl p-6 mb-10">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Sản Phẩm Bán Chạy Nhất</h3>
        {dashboardStats.bestSellingProduct ? (
          <div className="flex flex-col md:flex-row items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h4 className="text-xl font-semibold text-gray-800">
                {dashboardStats.bestSellingProduct.name}
              </h4>
              <p className="text-gray-600 mt-1">
                Mã sản phẩm: #{dashboardStats.bestSellingProduct.id}
              </p>
            </div>
            <div className="mt-4 md:mt-0">
              <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-full">
                <span className="font-bold">Đã bán: {dashboardStats.bestSellingProduct.sold} đơn vị</span>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-gray-500 italic">Chưa có dữ liệu</p>
        )}
      </section>

      {/* Orders Chart */}
      <section className="bg-white shadow-lg rounded-xl p-6 mb-10">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Số Lượng Đơn Hàng Theo {groupBy === 'day' ? 'Ngày' : groupBy === 'week' ? 'Tuần' : groupBy === 'month' ? 'Tháng' : 'Năm'}</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={revenueStats.revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="period" />
              <YAxis />
              <Tooltip formatter={(value) => [`${value} đơn hàng`, 'Số đơn hàng']} />
              <Legend />
              <Bar dataKey="orders" name="Số đơn hàng" fill="#16a34a" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
};

export default AdminStats;