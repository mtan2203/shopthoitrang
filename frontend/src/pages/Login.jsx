import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { login } from '../services/api';
import { Helmet } from 'react-helmet-async';
import { Mail, Lock, AlertCircle } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import TwoFactorAuth from './admin/TwoFactorAuth'; // Sửa đường dẫn để trỏ đến file trong thư mục admin

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const { login: loginUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const [twoFactorRequired, setTwoFactorRequired] = useState(false);
  const [tempUserId, setTempUserId] = useState(null);
  const [tempUsername, setTempUsername] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await login(formData.email, formData.password);
      
      // Kiểm tra xem có yêu cầu xác thực hai lớp không
      if (response.data.requireTwoFactor) {
        setTwoFactorRequired(true);
        setTempUserId(response.data.userId);
        setTempUsername(response.data.username);
        return;
      }
      
      loginUser(response.data);
      
      // Điều hướng dựa trên vai trò
      if (response.data.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } catch (err) {
      if (err.response?.data?.is_locked) {
        const lockedUntil = new Date(err.response.data.locked_until);
        const now = new Date();
        const diffTime = lockedUntil - now;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
        const lockedMessage = diffDays > 0 
          ? `Tài khoản của bạn đã bị khóa trong vòng ${diffDays} ngày.`
          : `Tài khoản của bạn đã bị khóa trong vòng ${diffHours} giờ.`;
        setError(lockedMessage);
      } else {
        setError('Email hoặc mật khẩu không đúng');
      }
      console.error('Lỗi đăng nhập:', err);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const token = credentialResponse.credential;
      const response = await fetch('http://localhost:5000/api/auth/google', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();
      if (response.ok) {
        // Kiểm tra xem có cần xác thực hai lớp cho tài khoản admin không
        if (data.requireTwoFactor) {
          setTwoFactorRequired(true);
          setTempUserId(data.userId);
          setTempUsername(data.username);
          return;
        }
        
        loginUser(data);
        
        // Điều hướng dựa trên vai trò
        if (data.role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/');
        }
      } else {
        throw new Error(data.message || 'Đăng nhập Google thất bại');
      }
    } catch (err) {
      setError(err.message);
      console.error('[Login] Lỗi đăng nhập Google:', err);
    }
  };

  const handleGoogleError = () => {
    setError('Đăng nhập bằng Google thất bại');
  };

  const triggerGoogleLogin = () => {
    const googleLoginButton = document.querySelector('.google-login-button div[role="button"]');
    if (googleLoginButton) {
      googleLoginButton.click();
    }
  };

  // Hiển thị màn hình xác thực hai lớp nếu cần
  if (twoFactorRequired) {
    return <TwoFactorAuth userId={tempUserId} username={tempUsername} />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 py-12">
      <Helmet>
        <title>Đăng Nhập - Thời Trang XYZ</title>
      </Helmet>
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">Đăng Nhập</h1>
        
        <div className="mb-6">
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
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
                  required
                  aria-describedby="email-error"
                />
              </div>
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Mật Khẩu
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                  <Lock className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </span>
                <input
                  type="password"
                  name="password"
                  id="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
                  required
                  aria-describedby="password-error"
                />
              </div>
            </div>
            {error && (
              <div className="flex items-center text-red-600 text-sm" role="alert">
                <AlertCircle className="h-5 w-5 mr-2" aria-hidden="true" />
                <span id="email-error password-error">{error}</span>
              </div>
            )}
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-200"
            >
              Đăng Nhập
            </button>
          </form>
          
          <div className="relative flex items-center justify-center my-4 mt-6">
            <div className="border-t border-gray-300 w-full"></div>
            <div className="px-3 bg-white text-sm text-gray-500">hoặc</div>
            <div className="border-t border-gray-300 w-full"></div>
          </div>
        </div>

        <div className="mb-4">
          <button
            type="button"
            onClick={triggerGoogleLogin}
            className="w-full flex items-center justify-center bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-700 hover:bg-gray-50 transition duration-200"
          >
            <div className="h-5 w-5 mr-3">
              <GoogleIcon />
            </div>
            <span>Đăng nhập bằng Google</span>
          </button>
        </div>
        
        <div className="hidden google-login-button">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
            text="signin_with"
            shape="rectangular"
            width="100%"
          />
        </div>
        
        <div className="mt-4 text-center text-sm text-gray-600">
          <p>
            Chưa có tài khoản?{' '}
            <Link to="/dang-ky" className="text-blue-600 hover:underline font-medium">
              Đăng ký ngay
            </Link>
          </p>
          <p className="mt-2">
            <Link to="/quen-mat-khau" className="text-blue-600 hover:underline">
              Quên mật khẩu?
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
    <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
      <path
        fill="#4285F4"
        d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"
      />
      <path
        fill="#34A853"
        d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"
      />
      <path
        fill="#FBBC05"
        d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z"
      />
      <path
        fill="#EA4335"
        d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z"
      />
    </g>
  </svg>
);

export default Login;