import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { getProducts, getOutOfStockProducts, updateInventory, deleteProduct } from '../../services/api';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Package,
  AlertTriangle,
  TrendingUp,
  Users,
  DollarSign,
  ShoppingCart,
  Eye,
  Edit,
  Trash2,
  Plus,
  Search,
  Filter,
  Grid,
  List,
  Download,
  Upload,
  BarChart3,
  Calendar,
  Star,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  FileText,
  FileSpreadsheet,
  X
} from 'lucide-react';

const AdminDashboard = () => {
  const { user } = useContext(AuthContext);
  const [products, setProducts] = useState([]);
  const [outOfStockProducts, setOutOfStockProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewMode, setViewMode] = useState('grid'); // grid or list
  const [sortBy, setSortBy] = useState('name');
  const [filterStatus, setFilterStatus] = useState('all');
  
  // Dashboard stats
  const [stats, setStats] = useState({
    totalProducts: 0,
    outOfStock: 0,
    lowStock: 0,
    totalValue: 0,
    avgRating: 0
  });
  const [showExportModal, setShowExportModal] = useState(false);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchData();
    }
  }, [user]);

  useEffect(() => {
    calculateStats();
  }, [products, outOfStockProducts]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [productRes, outOfStockRes] = await Promise.all([
        getProducts({}),
        getOutOfStockProducts({})
      ]);
      
      setProducts(productRes.data.products || []);
      setOutOfStockProducts(outOfStockRes.data.products || []);
    } catch (error) {
      console.error('Lỗi khi lấy dữ liệu:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
    const allProductsList = [...products, ...outOfStockProducts.filter(outProduct => 
      !products.some(product => product.id === outProduct.id)
    )];
    
    const totalProducts = allProductsList.length;
    const outOfStock = allProductsList.filter(p => (p.stock || 0) === 0).length;
    const lowStock = allProductsList.filter(p => (p.stock || 0) > 0 && (p.stock || 0) < 10).length;
    const totalValue = allProductsList.reduce((sum, p) => sum + ((p.price || 0) * (p.stock || 0)), 0);
    const avgRating = allProductsList.reduce((sum, p) => sum + (p.averageRating || 0), 0) / totalProducts || 0;
    
    setStats({
      totalProducts,
      outOfStock,
      lowStock,
      totalValue,
      avgRating
    });
  };

  const handleUpdateStock = async (productId, stock) => {
    try {
      await updateInventory(productId, { stock });
      fetchData();
    } catch (error) {
      console.error('Lỗi khi cập nhật tồn kho:', error);
    }
  };

  const handleDeleteProduct = async (productId, productName) => {
    if (window.confirm(`Bạn có chắc muốn xóa sản phẩm "${productName}"?`)) {
      try {
        await deleteProduct(productId);
        fetchData();
      } catch (error) {
        console.error('Lỗi khi xóa sản phẩm:', error);
      }
    }
  };

  // Xuất Excel functions
  const downloadExcelFile = (data, filename) => {
    if (data.length === 0) {
      alert('Không có dữ liệu để xuất');
      return;
    }
    
    const headers = Object.keys(data[0]);
    const csvContent = [
      '\uFEFF' + headers.join(','), // Add BOM for UTF-8
      ...data.map(row => headers.map(header => {
        const value = row[header];
        // Escape commas and quotes
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return '"' + value.replace(/"/g, '""') + '"';
        }
        return value;
      }).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename.replace('.xlsx', '.csv');
    link.click();
  };

  const downloadMultiSheetExcel = (sheets, filename) => {
    // For simplicity, combine all sheets into one CSV with separators
    let combinedContent = '\uFEFF'; // BOM for UTF-8
    
    sheets.forEach((sheet, index) => {
      if (index > 0) combinedContent += '\n\n';
      combinedContent += `=== ${sheet.sheetName} ===\n`;
      
      if (sheet.data.length > 0) {
        const headers = Object.keys(sheet.data[0]);
        combinedContent += headers.join(',') + '\n';
        combinedContent += sheet.data.map(row => 
          headers.map(header => {
            const value = row[header];
            if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
              return '"' + value.replace(/"/g, '""') + '"';
            }
            return value;
          }).join(',')
        ).join('\n');
      }
    });

    const blob = new Blob([combinedContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename.replace('.xlsx', '.csv');
    link.click();
  };

  const exportProductsToExcel = () => {
    const allProductsList = [...products, ...outOfStockProducts.filter(outProduct => 
      !products.some(product => product.id === outProduct.id)
    )];

    const exportData = allProductsList.map(product => ({
      'ID': product.id,
      'Tên sản phẩm': product.name || '',
      'Thương hiệu': product.brand || '',
      'Danh mục': product.categoryName || '',
      'Giá gốc': product.price || 0,
      'Giá khuyến mãi': product.discount_price || '',
      'Tồn kho': product.stock || 0,
      'Kích thước': product.sizes?.join(', ') || '',
      'Màu sắc': product.colors?.join(', ') || '',
      'Trạng thái': (product.stock || 0) === 0 ? 'Hết hàng' : (product.stock || 0) < 10 ? 'Sắp hết' : 'Còn hàng',
      'Ngày tạo': product.createdAt ? new Date(product.createdAt).toLocaleDateString('vi-VN') : '',
      'Mô tả': product.description || ''
    }));

    downloadExcelFile(exportData, `san-pham-${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const exportStatsToExcel = () => {
    const allProductsList = [...products, ...outOfStockProducts.filter(outProduct => 
      !products.some(product => product.id === outProduct.id)
    )];

    // Báo cáo tổng quan
    const summaryData = [{
      'Chỉ số': 'Tổng số sản phẩm',
      'Giá trị': stats.totalProducts,
      'Ghi chú': 'Tất cả sản phẩm trong hệ thống'
    }, {
      'Chỉ số': 'Sản phẩm hết hàng',
      'Giá trị': stats.outOfStock,
      'Ghi chú': 'Cần nhập hàng'
    }, {
      'Chỉ số': 'Sản phẩm sắp hết',
      'Giá trị': stats.lowStock,
      'Ghi chú': 'Tồn kho < 10'
    }, {
      'Chỉ số': 'Tổng giá trị tồn kho',
      'Giá trị': stats.totalValue.toLocaleString() + ' VNĐ',
      'Ghi chú': 'Tính theo giá gốc'
    }, {
      'Chỉ số': 'Đánh giá trung bình',
      'Giá trị': stats.avgRating.toFixed(1) + '/5',
      'Ghi chú': 'Dựa trên đánh giá khách hàng'
    }];

    // Báo cáo theo danh mục
    const categoryStats = {};
    allProductsList.forEach(product => {
      const category = product.categoryName || 'Không xác định';
      if (!categoryStats[category]) {
        categoryStats[category] = {
          count: 0,
          totalValue: 0,
          outOfStock: 0,
          lowStock: 0
        };
      }
      categoryStats[category].count++;
      categoryStats[category].totalValue += (product.price || 0) * (product.stock || 0);
      if ((product.stock || 0) === 0) categoryStats[category].outOfStock++;
      if ((product.stock || 0) > 0 && (product.stock || 0) < 10) categoryStats[category].lowStock++;
    });

    const categoryData = Object.entries(categoryStats).map(([category, data]) => ({
      'Danh mục': category,
      'Số lượng SP': data.count,
      'Giá trị tồn kho': data.totalValue.toLocaleString() + ' VNĐ',
      'SP hết hàng': data.outOfStock,
      'SP sắp hết': data.lowStock,
      '% hết hàng': ((data.outOfStock / data.count) * 100).toFixed(1) + '%'
    }));

    // Xuất nhiều sheets
    downloadMultiSheetExcel([
      { data: summaryData, sheetName: 'Tổng quan' },
      { data: categoryData, sheetName: 'Theo danh mục' }
    ], `bao-cao-${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const exportLowStockToExcel = () => {
    const allProductsList = [...products, ...outOfStockProducts.filter(outProduct => 
      !products.some(product => product.id === outProduct.id)
    )];

    const lowStockProducts = allProductsList.filter(p => (p.stock || 0) <= 10);
    
    const exportData = lowStockProducts.map(product => ({
      'ID': product.id,
      'Tên sản phẩm': product.name || '',
      'Thương hiệu': product.brand || '',
      'Danh mục': product.categoryName || '',
      'Tồn kho hiện tại': product.stock || 0,
      'Trạng thái': (product.stock || 0) === 0 ? 'HẾT HÀNG' : 'SẮP HẾT',
      'Giá bán': (product.discount_price || product.price || 0).toLocaleString() + ' VNĐ',
      'Mức độ ưu tiên': (product.stock || 0) === 0 ? 'CAO' : 'TRUNG BÌNH',
      'Ghi chú': (product.stock || 0) === 0 ? 'Cần nhập gấp' : 'Cần theo dõi'
    })).sort((a, b) => a['Tồn kho hiện tại'] - b['Tồn kho hiện tại']);

    downloadExcelFile(exportData, `san-pham-can-nhap-${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const getStockStatus = (stock) => {
    if (stock === 0) return { text: 'Hết hàng', color: 'bg-red-100 text-red-800', icon: XCircle };
    if (stock < 10) return { text: 'Sắp hết', color: 'bg-yellow-100 text-yellow-800', icon: AlertTriangle };
    return { text: 'Còn hàng', color: 'bg-green-100 text-green-800', icon: CheckCircle };
  };

  // Kết hợp cả products và outOfStockProducts để hiển thị đầy đủ
  const allProducts = [...products, ...outOfStockProducts.filter(outProduct => 
    !products.some(product => product.id === outProduct.id)
  )];

  const filteredProducts = allProducts.filter(product => {
    const matchesSearch = product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.brand?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.categoryName === selectedCategory;
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'in-stock' && (product.stock || 0) > 0) ||
                         (filterStatus === 'out-of-stock' && (product.stock || 0) === 0) ||
                         (filterStatus === 'low-stock' && (product.stock || 0) > 0 && (product.stock || 0) < 10);
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return (a.name || '').localeCompare(b.name || '');
      case 'price':
        return (b.price || 0) - (a.price || 0);
      case 'stock':
        return (b.stock || 0) - (a.stock || 0);
      case 'created':
        return new Date(b.createdAt) - new Date(a.createdAt);
      default:
        return 0;
    }
  });

  const StatCard = ({ icon: Icon, title, value, subtitle, color, trend }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-all duration-300"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
          {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className={`p-4 rounded-2xl ${color}`}>
          <Icon size={24} className="text-white" />
        </div>
      </div>
      {trend && (
        <div className="flex items-center mt-4 text-sm">
          <TrendingUp size={16} className="text-green-500 mr-1" />
          <span className="text-green-600 font-medium">{trend}</span>
          <span className="text-gray-500 ml-1">vs tháng trước</span>
        </div>
      )}
    </motion.div>
  );

  const ProductCard = ({ product, onUpdateStock, onDelete }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [tempStock, setTempStock] = useState(product.stock || 0);
    const stockStatus = getStockStatus(product.stock || 0);
    const StatusIcon = stockStatus.icon;

    const handleSaveStock = async () => {
      await onUpdateStock(product.id, tempStock);
      setIsEditing(false);
    };

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300 group"
      >
        <div className="relative">
          <img
            src={product.image || 'https://via.placeholder.com/300x200'}
            alt={product.name}
            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute top-3 right-3 flex gap-2">
            {product.discount_price && (
              <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-lg">
                -{Math.round(((product.price - product.discount_price) / product.price) * 100)}%
              </span>
            )}
            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${stockStatus.color}`}>
              <StatusIcon size={12} />
              {stockStatus.text}
            </span>
          </div>
        </div>

        <div className="p-6">
          <div className="flex items-start justify-between mb-3">
            <h3 className="font-semibold text-gray-900 text-lg line-clamp-2 flex-1">
              {product.name || 'Không có tên'}
            </h3>
          </div>

          <div className="space-y-2 mb-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Giá bán:</span>
              <div className="flex items-center gap-2">
                {product.discount_price ? (
                  <>
                    <span className="text-sm text-gray-400 line-through">
                      {product.price?.toLocaleString()} VNĐ
                    </span>
                    <span className="font-bold text-red-600">
                      {product.discount_price.toLocaleString()} VNĐ
                    </span>
                  </>
                ) : (
                  <span className="font-bold text-gray-900">
                    {(product.price || 0).toLocaleString()} VNĐ
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Danh mục:</span>
              <span className="text-sm font-medium">{product.categoryName || 'N/A'}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Thương hiệu:</span>
              <span className="text-sm font-medium">{product.brand || 'N/A'}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Tồn kho:</span>
              {isEditing ? (
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={tempStock}
                    onChange={(e) => setTempStock(parseInt(e.target.value) || 0)}
                    className="w-20 px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="0"
                  />
                  <button
                    onClick={handleSaveStock}
                    className="p-1 text-green-600 hover:bg-green-50 rounded"
                  >
                    <CheckCircle size={16} />
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setTempStock(product.stock || 0);
                    }}
                    className="p-1 text-red-600 hover:bg-red-50 rounded"
                  >
                    <XCircle size={16} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-1 text-sm font-medium hover:text-blue-600 transition-colors"
                >
                  {product.stock || 0}
                  <Edit size={12} />
                </button>
              )}
            </div>

            {(product.sizes?.length > 0 || product.colors?.length > 0) && (
              <div className="pt-2 border-t border-gray-100">
                {product.sizes?.length > 0 && (
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-gray-500">Size:</span>
                    <div className="flex gap-1">
                      {product.sizes.slice(0, 3).map((size, idx) => (
                        <span key={idx} className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {size}
                        </span>
                      ))}
                      {product.sizes.length > 3 && (
                        <span className="text-xs text-gray-400">+{product.sizes.length - 3}</span>
                      )}
                    </div>
                  </div>
                )}
                {product.colors?.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">Màu:</span>
                    <div className="flex gap-1">
                      {product.colors.slice(0, 3).map((color, idx) => (
                        <span key={idx} className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {color}
                        </span>
                      ))}
                      {product.colors.length > 3 && (
                        <span className="text-xs text-gray-400">+{product.colors.length - 3}</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Link
              to={`/admin/san-pham/${product.id}`}
              className="flex-1 flex items-center justify-center gap-2 bg-blue-50 text-blue-700 py-2 px-3 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
            >
              <Eye size={16} />
              Xem
            </Link>
            <Link
              to={`/admin/sua-san-pham/${product.id}`}
              className="flex-1 flex items-center justify-center gap-2 bg-green-50 text-green-700 py-2 px-3 rounded-lg hover:bg-green-100 transition-colors text-sm font-medium"
            >
              <Edit size={16} />
              Sửa
            </Link>
            <button
              onClick={() => onDelete(product.id, product.name)}
              className="flex items-center justify-center gap-2 bg-red-50 text-red-700 py-2 px-3 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      </motion.div>
    );
  };

  const LoadingSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array(8).fill().map((_, index) => (
        <div key={index} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-pulse">
          <div className="w-full h-48 bg-gray-200"></div>
          <div className="p-6 space-y-3">
            <div className="h-6 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </div>
      ))}
    </div>
  );

  const ExportModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl p-6 w-full max-w-md mx-4"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Xuất dữ liệu Excel</h3>
          <button
            onClick={() => setShowExportModal(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="space-y-3">
          <button
            onClick={() => {
              exportProductsToExcel();
              setShowExportModal(false);
            }}
            className="w-full flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
          >
            <FileSpreadsheet className="text-green-600" size={20} />
            <div>
              <p className="font-medium text-gray-900">Danh sách sản phẩm</p>
              <p className="text-sm text-gray-600">Xuất tất cả sản phẩm với thông tin chi tiết</p>
            </div>
          </button>
          
          <button
            onClick={() => {
              exportStatsToExcel();
              setShowExportModal(false);
            }}
            className="w-full flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
          >
            <BarChart3 className="text-blue-600" size={20} />
            <div>
              <p className="font-medium text-gray-900">Báo cáo thống kê</p>
              <p className="text-sm text-gray-600">Xuất báo cáo tổng quan và phân tích</p>
            </div>
          </button>
          
          <button
            onClick={() => {
              exportLowStockToExcel();
              setShowExportModal(false);
            }}
            className="w-full flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
          >
            <AlertTriangle className="text-red-600" size={20} />
            <div>
              <p className="font-medium text-gray-900">Sản phẩm cần nhập hàng</p>
              <p className="text-sm text-gray-600">Xuất danh sách sản phẩm hết/sắp hết hàng</p>
            </div>
          </button>
        </div>
      </motion.div>
    </div>
  );

  if (!user || user?.role !== 'admin') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center text-red-600 py-12 bg-white rounded-2xl shadow-sm p-6"
      >
        Bạn không có quyền truy cập trang này.
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gray-50"
    >
      <Helmet>
        <title>Bảng Điều Khiển Admin - Thời Trang XYZ</title>
        <meta name="robots" content="noindex" />
      </Helmet>

      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Bảng Điều Khiển</h1>
            <p className="text-gray-600 mt-1">Quản lý sản phẩm và theo dõi hiệu suất</p>
          </div>
          <div className="flex items-center gap-3 mt-4 lg:mt-0">
            <button
              onClick={fetchData}
              className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <RefreshCw size={18} />
              Làm mới
            </button>
            <Link
              to="/admin/them-san-pham"
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus size={18} />
              Thêm Sản Phẩm
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={Package}
            title="Tổng sản phẩm"
            value={stats.totalProducts.toLocaleString()}
            color="bg-blue-500"
            trend="+12%"
          />
          <StatCard
            icon={AlertTriangle}
            title="Sắp hết hàng"
            value={stats.lowStock.toLocaleString()}
            subtitle={`${stats.outOfStock} hết hàng`}
            color="bg-yellow-500"
          />
          <StatCard
            icon={DollarSign}
            title="Giá trị tồn kho"
            value={`${(stats.totalValue / 1000000).toFixed(1)}M`}
            subtitle="VNĐ"
            color="bg-green-500"
            trend="+8.2%"
          />
          <StatCard
            icon={Star}
            title="Đánh giá TB"
            value={stats.avgRating.toFixed(1)}
            subtitle="/ 5.0 sao"
            color="bg-purple-500"
          />
        </div>

        {/* Filters & Search */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Tìm kiếm sản phẩm..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div className="flex items-center gap-3">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="in-stock">Còn hàng</option>
                <option value="low-stock">Sắp hết</option>
                <option value="out-of-stock">Hết hàng</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="name">Sắp xếp theo tên</option>
                <option value="price">Theo giá</option>
                <option value="stock">Theo tồn kho</option>
                <option value="created">Mới nhất</option>
              </select>

              <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-3 ${viewMode === 'grid' ? 'bg-blue-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'} transition-colors`}
                >
                  <Grid size={18} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-3 ${viewMode === 'list' ? 'bg-blue-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'} transition-colors`}
                >
                  <List size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Products Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              Danh Sách Sản Phẩm ({sortedProducts.length})
            </h2>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setShowExportModal(true)}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Download size={18} />
                Xuất Excel
              </button>
              <button className="flex items-center gap-2 text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors">
                <Upload size={18} />
                Nhập Excel
              </button>
            </div>
          </div>

          {loading ? (
            <LoadingSkeleton />
          ) : sortedProducts.length === 0 ? (
            <div className="text-center py-12">
              <Package size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Không tìm thấy sản phẩm</h3>
              <p className="text-gray-600 mb-4">Hãy thử thay đổi bộ lọc hoặc thêm sản phẩm mới</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {sortedProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onUpdateStock={handleUpdateStock}
                  onDelete={handleDeleteProduct}
                />
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link
            to="/admin/quan-ly-don-hang"
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-300 group"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Quản lý đơn hàng</h3>
                <p className="text-sm text-gray-600">Xem và xử lý đơn hàng</p>
              </div>
              <ShoppingCart className="text-blue-500 group-hover:scale-110 transition-transform" size={24} />
            </div>
          </Link>

          <Link
            to="/admin/thong-ke"
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-300 group"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Thống kê</h3>
                <p className="text-sm text-gray-600">Xem báo cáo và phân tích</p>
              </div>
              <BarChart3 className="text-green-500 group-hover:scale-110 transition-transform" size={24} />
            </div>
          </Link>

          <Link
            to="/admin/quan-ly-nguoi-dung"
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-300 group"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Quản lý người dùng</h3>
                <p className="text-sm text-gray-600">Quản lý tài khoản khách hàng</p>
              </div>
              <Users className="text-purple-500 group-hover:scale-110 transition-transform" size={24} />
            </div>
          </Link>
        </div>
      </div>

      {/* Export Modal */}
      {showExportModal && <ExportModal />}
    </motion.div>
  );
};

export default AdminDashboard;