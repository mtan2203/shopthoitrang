import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Mail, AlertCircle } from 'lucide-react';
import { requestPasswordReset } from '../services/api';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    console.log('[ForgotPassword] Email gửi đi:', email); // Thêm log để kiểm tra email

    try {
      const response = await requestPasswordReset(email);
      console.log('[ForgotPassword] Phản hồi từ API:', response.data); // Thêm log để kiểm tra phản hồi
      setMessage(response.data.message);
    } catch (err) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra. Vui lòng thử lại.');
      console.error('Lỗi yêu cầu đặt lại mật khẩu:', err.response?.data || err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 py-12">
      <Helmet>
        <title>Quên Mật Khẩu - Thời Trang XYZ</title>
      </Helmet>
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">Quên Mật Khẩu</h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                <Mail className="h-5 w-5 text-gray-400" aria-hidden="true" />
              </span>
              <input
                type="email"
                name="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
                required
                aria-describedby="email-error"
              />
            </div>
          </div>
          {error && (
            <div className="flex items-center text-red-600 text-sm" role="alert">
              <AlertCircle className="h-5 w-5 mr-2" aria-hidden="true" />
              <span id="email-error">{error}</span>
            </div>
          )}
          {message && (
            <div className="flex items-center text-green-600 text-sm" role="alert">
              <span>{message}</span>
            </div>
          )}
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-200"
          >
            Gửi Yêu Cầu
          </button>
        </form>
        <div className="mt-4 text-center text-sm text-gray-600">
          <p>
            Đã nhớ mật khẩu?{' '}
            <Link to="/dang-nhap" className="text-blue-600 hover:underline font-medium">
              Đăng nhập
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;