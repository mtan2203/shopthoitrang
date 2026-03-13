import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { changePassword } from '../services/api'; // Import hàm changePassword
import { toast } from 'react-toastify';
import { X, User, Mail, Phone, Calendar, Lock, ChevronRight, Save, ChevronLeft } from 'lucide-react';

const AccountInfo = () => {
  const { user, updateUser, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isEditMode, setIsEditMode] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    phone_number: '',
  });
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/dang-nhap');
    } else {
      setFormData({
        username: user.username || '',
        email: user.email || '',
        phone_number: user.phone_number || '',
      });
    }
  }, [user, navigate]);

  const handleSaveChanges = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/auth/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Cập nhật thất bại');
      }
      await updateUser();
      toast.success('Cập nhật thông tin thành công!');
      setIsEditMode(false);
    } catch (err) {
      console.error('Lỗi cập nhật thông tin:', err.message);
      toast.error(err.message || 'Cập nhật thất bại!');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!oldPassword || !newPassword) {
      toast.error('Vui lòng nhập đầy đủ mật khẩu cũ và mới');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Mật khẩu mới và xác nhận mật khẩu không khớp');
      return;
    }

    setIsLoading(true);
    try {
      await changePassword(oldPassword, newPassword); // Sử dụng hàm changePassword từ api.js
      toast.success('Đổi mật khẩu thành công! Vui lòng đăng nhập lại.');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setIsPasswordModalOpen(false);
      logout();
      navigate('/dang-nhap');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi khi đổi mật khẩu');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-16 h-16 bg-blue-200 rounded-full mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-48 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-32"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 px-4 min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="max-w-4xl mx-auto">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-t-2xl shadow-lg p-8">
          <h1 className="text-4xl font-bold text-white flex items-center">
            <User size={36} className="mr-4" />
            Thông Tin Tài Khoản
          </h1>
          <p className="text-blue-100 mt-2">Quản lý thông tin cá nhân và bảo mật tài khoản của bạn</p>
        </div>

        <div className="bg-white rounded-b-2xl shadow-lg p-8">
          {/* Thông tin cá nhân */}
          <div className="mb-10">
            <div className="flex items-center mb-6">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                <User size={20} className="text-blue-600" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-800">Thông tin cá nhân</h2>
              {!isEditMode && (
                <button
                  onClick={() => setIsEditMode(true)}
                  className="ml-auto bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-2 rounded-lg hover:from-blue-600 hover:to-indigo-700 transition duration-300 flex items-center"
                >
                  Chỉnh sửa
                  <ChevronRight className="ml-2" size={18} />
                </button>
              )}
            </div>

            <form onSubmit={handleSaveChanges} className="space-y-6 text-gray-700 bg-gray-50 p-6 rounded-xl border border-gray-100">
              <div className="flex flex-col md:flex-row md:items-center py-3 border-b border-gray-200">
                <div className="flex items-center md:w-1/3">
                  <User size={18} className="text-blue-500 mr-3" />
                  <span className="font-medium">Tên người dùng:</span>
                </div>
                <div className="mt-1 md:mt-0 md:w-2/3">
                  {isEditMode ? (
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  ) : (
                    formData.username || 'Chưa cập nhật'
                  )}
                </div>
              </div>

              <div className="flex flex-col md:flex-row md:items-center py-3 border-b border-gray-200">
                <div className="flex items-center md:w-1/3">
                  <Mail size={18} className="text-blue-500 mr-3" />
                  <span className="font-medium">Email:</span>
                </div>
                <div className="mt-1 md:mt-0 md:w-2/3">
                  {isEditMode ? (
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  ) : (
                    formData.email || 'Chưa cập nhật'
                  )}
                </div>
              </div>

              <div className="flex flex-col md:flex-row md:items-center py-3 border-b border-gray-200">
                <div className="flex items-center md:w-1/3">
                  <Phone size={18} className="text-blue-500 mr-3" />
                  <span className="font-medium">Số điện thoại:</span>
                </div>
                <div className="mt-1 md:mt-0 md:w-2/3">
                  {isEditMode ? (
                    <input
                      type="text"
                      name="phone_number"
                      value={formData.phone_number || ''}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  ) : (
                    formData.phone_number || 'Chưa cập nhật'
                  )}
                </div>
              </div>

              <div className="flex flex-col md:flex-row md:items-center py-3">
                <div className="flex items-center md:w-1/3">
                  <Calendar size={18} className="text-blue-500 mr-3" />
                  <span className="font-medium">Ngày tham gia:</span>
                </div>
                <div className="mt-1 md:mt-0 md:w-2/3">
                  {user.createdAt ? new Date(user.createdAt).toLocaleDateString('vi-VN', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                  }) : 'Chưa cập nhật'}
                </div>
              </div>

              {isEditMode && (
                <div className="flex justify-end space-x-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsEditMode(false)}
                    className="flex items-center px-5 py-2.5 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 transition duration-200"
                    disabled={isLoading}
                  >
                    <ChevronLeft size={18} className="mr-2" />
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="flex items-center px-6 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition duration-300"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Đang lưu...
                      </>
                    ) : (
                      <>
                        <Save size={18} className="mr-2" />
                        Lưu thay đổi
                      </>
                    )}
                  </button>
                </div>
              )}
            </form>
          </div>

          {/* Quản lý mật khẩu */}
          <div className="mt-12">
            <div className="flex items-center mb-6">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                <Lock size={20} className="text-blue-600" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-800">Quản lý mật khẩu</h2>
            </div>
            
            <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
              <p className="text-gray-600 mb-4">Bảo vệ tài khoản của bạn bằng cách thay đổi mật khẩu thường xuyên.</p>
              <button
                onClick={() => setIsPasswordModalOpen(true)}
                className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-3 rounded-lg hover:from-blue-600 hover:to-indigo-700 transition duration-300 shadow-md flex items-center group"
              >
                Đổi mật khẩu
                <ChevronRight className="ml-2 group-hover:translate-x-1 transition-transform" size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal đổi mật khẩu */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-md transform transition-all duration-300 ease-in-out">
            <div className="flex justify-between items-center border-b pb-4 mb-6">
              <h3 className="text-xl font-semibold text-gray-800 flex items-center">
                <Lock size={20} className="mr-2 text-blue-600" />
                Đổi Mật Khẩu
              </h3>
              <button
                onClick={() => setIsPasswordModalOpen(false)}
                className="text-gray-500 hover:text-gray-700 transition duration-200"
              >
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu cũ</label>
                <input
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  placeholder="Nhập mật khẩu cũ"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu mới</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  placeholder="Nhập mật khẩu mới"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Xác nhận mật khẩu mới</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  placeholder="Nhập lại mật khẩu mới"
                />
              </div>
              <div className="flex justify-end space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="px-5 py-2.5 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 transition duration-200"
                  disabled={isLoading}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition duration-300 flex items-center"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0-5 5.373 0 12h4zm2 5.291A7.962 7.962-5-10-8-4 12H0c0 3 5-1 0 3 5 7.938l3-2.647z"></path>
                      </svg>
                      Đang xử lý...
                    </>
                  ) : (
                    'span'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountInfo;