import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getOrders } from '../services/api';
import { toast } from 'react-toastify';
import { Helmet } from 'react-helmet-async';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await getOrders();
        setOrders(response.data.orders || []);
        setLoading(false);
      } catch (err) {
        toast.error(err.response?.data?.message || 'Lỗi tải đơn hàng');
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'shipped':
        return 'bg-purple-100 text-purple-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-red-100 text-red-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return 'Đang xử lý';
      case 'processing': return 'Đang chuẩn bị';
      case 'shipped': return 'Đang giao';
      case 'delivered': return 'Đã giao';
      default: return 'Đã hủy';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-gray-600">Đang tải...</span>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <Helmet>
        <title>Đơn Hàng - Thời Trang XYZ</title>
        <meta name="description" content="Xem danh sách đơn hàng của bạn" />
      </Helmet>
      
      <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Đơn Hàng Của Bạn</h1>
          <p className="mt-2 text-gray-600">Quản lý và theo dõi trạng thái đơn hàng của bạn</p>
        </div>

        {orders.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
            </svg>
            <p className="mt-4 text-lg font-medium text-gray-900">Bạn chưa có đơn hàng nào</p>
            <p className="mt-2 text-gray-500">Hãy khám phá các sản phẩm của chúng tôi và đặt hàng ngay</p>
            <Link to="/san-pham" className="mt-6 inline-block px-6 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors">
              Xem sản phẩm
            </Link>
          </div>
        ) : (
          <div className="grid gap-6">
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-lg shadow overflow-hidden">
                <div className="p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">Đơn hàng #{order.id}</h2>
                      <p className="text-sm text-gray-500 mt-1">
                        Đặt ngày: {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                      </p>
                    </div>
                    <div className={`${getStatusColor(order.status)} px-3 py-1 rounded-full text-sm font-medium inline-flex mt-2 sm:mt-0`}>
                      {getStatusText(order.status)}
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-gray-700">
                        <span className="font-medium">Tổng tiền:</span>{' '}
                        <span className="text-lg font-bold text-blue-600">{order.total.toLocaleString()} VNĐ</span>
                      </p>
                    </div>
                    <div className="mt-3 sm:mt-0">
                      <Link
                        to={`/don-hang/${order.id}`}
                        className="inline-flex items-center justify-center px-5 py-2 border border-blue-600 text-blue-600 bg-white hover:bg-blue-600 hover:text-white font-medium rounded-md transition-colors duration-200"
                      >
                        Xem chi tiết
                        <svg className="ml-1.5 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                        </svg>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;