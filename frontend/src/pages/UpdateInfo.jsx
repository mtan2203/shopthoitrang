import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { updateUser } from '../services/api';
import { toast } from 'react-toastify';
import { User, Phone, Save, ArrowLeft, Loader2 } from 'lucide-react';

const UpdateInfo = () => {
  const { user, updateUser: setUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    phone_number: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [touched, setTouched] = useState({
    username: false,
    phone_number: false
  });

  useEffect(() => {
    if (!user) {
      navigate('/dang-nhap');
      return;
    }
    
    setFormData({
      username: user.username || '',
      phone_number: user.phone_number || '',
    });
  }, [user, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleBlur = (field) => {
    setTouched({ ...touched, [field]: true });
  };

  const validate = () => {
    const errors = {};
    if (!formData.username.trim()) {
      errors.username = 'Tên người dùng không được để trống';
    }
    
    if (formData.phone_number && !/^[0-9]{10,11}$/.test(formData.phone_number)) {
      errors.phone_number = 'Số điện thoại không hợp lệ (10-11 số)';
    }
    
    return errors;
  };

  const errors = validate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Kiểm tra lỗi trước khi submit
    const formErrors = validate();
    if (Object.keys(formErrors).length > 0) {
      // Đánh dấu tất cả các trường là đã chạm vào để hiển thị lỗi
      setTouched({
        username: true,
        phone_number: true
      });
      return;
    }
    
    setIsSubmitting(true);
    try {
      await updateUser(user.id, formData);
      
      // Cập nhật context state với thông tin mới
      setUser({ ...user, ...formData });
      
      toast.success('Cập nhật thông tin thành công!', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      
      // Tự động chuyển về trang Account sau khi cập nhật thành công
      navigate('/thong-tin-tai-khoan');
    } catch (err) {
      toast.error('Lỗi khi cập nhật thông tin: ' + (err.response?.data?.message || err.message), {
        position: "top-right",
        autoClose: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
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
      <div className="max-w-2xl mx-auto">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-t-2xl shadow-lg p-8">
          <h1 className="text-4xl font-bold text-white flex items-center">
            <User size={36} className="mr-4" />
            Cập Nhật Thông Tin
          </h1>
          <p className="text-blue-100 mt-2">Thay đổi thông tin cá nhân của tài khoản</p>
        </div>

        <div className="bg-white rounded-b-2xl shadow-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
                <User size={16} className="mr-2 text-blue-500" />
                Tên người dùng
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                onBlur={() => handleBlur('username')}
                className={`w-full px-4 py-3 border ${
                  touched.username && errors.username 
                    ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
                    : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                } rounded-lg transition-all duration-200`}
                placeholder="Nhập tên người dùng"
              />
              {touched.username && errors.username && (
                <p className="mt-1 text-sm text-red-600">{errors.username}</p>
              )}
            </div>
            
            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
                <Phone size={16} className="mr-2 text-blue-500" />
                Số điện thoại
              </label>
              <input
                type="text"
                name="phone_number"
                value={formData.phone_number}
                onChange={handleChange}
                onBlur={() => handleBlur('phone_number')}
                className={`w-full px-4 py-3 border ${
                  touched.phone_number && errors.phone_number 
                    ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
                    : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                } rounded-lg transition-all duration-200`}
                placeholder="Nhập số điện thoại"
              />
              {touched.phone_number && errors.phone_number && (
                <p className="mt-1 text-sm text-red-600">{errors.phone_number}</p>
              )}
            </div>
            
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 pt-4">
              <button
                type="button"
                onClick={() => navigate('/thong-tin-tai-khoan')}
                className="px-5 py-2.5 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 transition duration-200 flex items-center justify-center"
                disabled={isSubmitting}
              >
                <ArrowLeft size={18} className="mr-2" />
                Quay lại
              </button>
              
              <button
                type="submit"
                disabled={isSubmitting || Object.keys(errors).length > 0}
                className={`px-6 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition duration-300 flex items-center justify-center ${
                  (isSubmitting || Object.keys(errors).length > 0) 
                    ? 'opacity-70 cursor-not-allowed' 
                    : ''
                }`}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={18} className="mr-2 animate-spin" />
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <Save size={18} className="mr-2" />
                    Lưu thay đổi
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UpdateInfo;