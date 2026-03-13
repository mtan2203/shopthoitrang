import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { AlertCircle, Lock } from 'lucide-react';

const TwoFactorAuth = ({ userId, username }) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login: loginUser } = useContext(AuthContext);
  const navigate = useNavigate();

  console.log('DEBUG 2FA → userId:', userId, 'username:', username); 

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!code) {
      setError('Vui lòng nhập mã xác thực');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/2fa/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, token: code }),
      });

      const data = await response.json();

      if (response.ok) {
        loginUser(data);
        navigate('/admin');
      } else {
        setError(data.message || 'Mã xác thực không đúng');
      }
    } catch (err) {
      setError('Lỗi kết nối máy chủ');
      console.error('Lỗi xác thực 2FA:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 py-12">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <div className="flex items-center justify-center mb-6">
          <Lock className="w-10 h-10 text-blue-600 mr-3" />
          <h1 className="text-2xl font-bold text-gray-800">Xác thực hai lớp</h1>
        </div>

        <p className="text-gray-600 mb-6 text-center">
          Vui lòng nhập mã từ ứng dụng Google Authenticator để hoàn tất đăng nhập.
        </p>

        {error && (
          <div className="flex items-center text-red-600 text-sm mb-4" role="alert">
            <AlertCircle className="h-5 w-5 mr-2" aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-1">
              Mã xác thực
            </label>
            <input
              type="text"
              id="code"
              name="code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Nhập mã 6 chữ số"
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              pattern="[0-9]*"
              maxLength="6"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-200 disabled:opacity-70"
          >
            {loading ? 'Đang xác thực...' : 'Xác thực'}
          </button>
        </form>

        <div className="mt-4 text-center text-sm text-gray-500">
          <p>
            Đăng nhập với tài khoản <span className="font-semibold">{username}</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default TwoFactorAuth;
