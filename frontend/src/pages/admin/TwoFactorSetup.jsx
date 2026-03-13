import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { AuthContext } from '../../context/AuthContext';
import { AlertCircle, CheckCircle, Lock } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

const TwoFactorSetup = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [secretKey, setSecretKey] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isEnabled, setIsEnabled] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    // Kiểm tra xem người dùng có quyền admin không
    if (!user || user.role !== 'admin') {
      navigate('/admin');
      return;
    }

    // Kiểm tra trạng thái 2FA
    checkTwoFactorStatus();
  }, [user, navigate]);

  // Ham kiểm tra trạng thái 2FA và thiết lập nếu chưa có
  const checkTwoFactorStatus = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/2fa/status', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      setIsEnabled(data.enabled);
      
      if (!data.enabled) {
        await setupTwoFactor();
      }
    } catch (err) {
      setError('Không thể kiểm tra trạng thái 2FA');
      console.error('Lỗi kiểm tra trạng thái 2FA:', err);
    } finally {
      setLoading(false);
    }
  };

  // Hàm thiết lập 2FA
  const setupTwoFactor = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/2fa/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      setSecretKey(data.secret);
      
      // Thay vì sử dụng URL từ server, tạo URL OTP Auth ngắn hơn
      if (data.secret && user) {
        // Tạo URL OTP Auth tối giản
        const otpauth = `otpauth://totp/XYZ_Admin:${user.username || 'admin'}?secret=${data.secret}&issuer=XYZ_Fashion`;
        setQrCodeUrl(otpauth);
      }
    } catch (err) {
      setError('Không thể thiết lập 2FA');
      console.error('Lỗi thiết lập 2FA:', err);
    }
  };
  // Hàm xác minh mã xác thực
  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!verificationCode) {
      setError('Vui lòng nhập mã xác thực');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/2fa/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ token: verificationCode })
      });

      const data = await response.json();
      // Hàm xác minh mã xác thực
      if (response.ok) {
        setIsEnabled(true);
        setSuccess('Xác thực hai lớp đã được kích hoạt thành công!');
        setVerificationCode('');
      } else {
        setError(data.message || 'Mã xác thực không đúng');
      }
    } catch (err) {
      setError('Lỗi khi xác minh mã');
      console.error('Lỗi xác minh 2FA:', err);
    }
  };
  // Hàm vô hiệu hóa 2FA
  const handleDisable = async () => {
    try {
      const verificationInput = prompt('Nhập mã xác thực từ ứng dụng Google Authenticator để vô hiệu hóa 2FA:');
      
      if (!verificationInput) return;

      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/2fa/disable', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ token: verificationInput })
      });

      const data = await response.json();
      
      if (response.ok) {
        setIsEnabled(false);
        setSuccess('Đã vô hiệu hóa xác thực hai lớp');
        // Thiết lập lại 2FA
        await setupTwoFactor();
      } else {
        setError(data.message || 'Không thể vô hiệu hóa 2FA');
      }
    } catch (err) {
      setError('Lỗi khi vô hiệu hóa 2FA');
      console.error('Lỗi vô hiệu hóa 2FA:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="py-10 px-4">
      <Helmet>
        <title>Thiết lập xác thực hai lớp - Admin</title>
      </Helmet>
      
      <div className="max-w-lg mx-auto bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-center mb-6">
          <Lock className="w-10 h-10 text-blue-600 mr-3" />
          <h1 className="text-2xl font-bold text-gray-800">Thiết lập xác thực hai lớp</h1>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6" role="alert">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6" role="alert">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
              <p className="text-green-700">{success}</p>
            </div>
          </div>
        )}

        {isEnabled ? (
          <div className="text-center">
            <div className="p-4 mb-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex justify-center mb-2">
                <CheckCircle className="h-12 w-12 text-green-500" />
              </div>
              <h2 className="text-xl font-semibold text-green-800 mb-2">Xác thực hai lớp đã được kích hoạt</h2>
              <p className="text-gray-600 mb-4">
                Tài khoản của bạn hiện đang được bảo vệ bằng xác thực hai lớp. Mỗi khi đăng nhập, bạn sẽ cần nhập mã từ ứng dụng Google Authenticator.
              </p>
              <button
                onClick={handleDisable}
                className="bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition duration-200"
              >
                Vô hiệu hóa xác thực hai lớp
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="mb-6">
              <p className="text-gray-700 mb-4">
                Thiết lập xác thực hai lớp giúp bảo vệ tài khoản của bạn bằng cách yêu cầu mã xác thực từ ứng dụng Google Authenticator mỗi khi đăng nhập.
              </p>
              <ol className="list-decimal pl-5 text-gray-700 space-y-2">
                <li>Tải ứng dụng Google Authenticator trên điện thoại</li>
                <li>Quét mã QR bên dưới hoặc nhập mã thiết lập thủ công</li>
                <li>Nhập mã xác thực từ ứng dụng để hoàn tất thiết lập</li>
              </ol>
            </div>

            <div className="border rounded-lg p-4 mb-6">
              <div className="flex flex-col items-center justify-center">
                <h3 className="font-semibold text-gray-800 mb-4">Quét mã QR bằng ứng dụng Google Authenticator</h3>
                {qrCodeUrl && (
                  <div className="bg-white p-3 border rounded mb-4">
                    {/* Sử dụng QRCodeSVG với errorLevel cao hơn và kích thước lớn hơn */}
                    <QRCodeSVG 
                      value={qrCodeUrl} 
                      size={200} 
                      level="M" // Mức độ sửa lỗi
                      includeMargin={true}
                    />
                  </div>
                )}
                <div className="w-full">
                  <h3 className="font-semibold text-gray-800 mb-2">Hoặc nhập mã này thủ công:</h3>
                  <div className="bg-gray-100 p-3 rounded-lg text-center font-mono mb-2 break-all">
                    {secretKey}
                  </div>
                  <p className="text-sm text-gray-600">
                    Lưu trữ mã này ở nơi an toàn. Bạn sẽ cần nó để khôi phục truy cập nếu mất điện thoại.
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleVerify} className="mb-6">
              <div className="mb-4">
                <label htmlFor="verificationCode" className="block text-sm font-medium text-gray-700 mb-1">
                  Mã xác thực từ ứng dụng
                </label>
                <input
                  type="text"
                  id="verificationCode"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  placeholder="Nhập mã 6 chữ số"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  pattern="[0-9]*"
                  maxLength="6"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-200"
              >
                Xác minh và kích hoạt
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default TwoFactorSetup;