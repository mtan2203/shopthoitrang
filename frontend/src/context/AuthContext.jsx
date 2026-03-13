import React, { createContext, useState, useEffect } from 'react';
import api from '../services/api';

export const AuthContext = createContext();
// Khởi tạo context cho người dùng
export const AuthProvider = ({ children }) => { 
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      api
        .get('/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => {
          if (!res.data.role) {
            console.error('API /auth/me không trả về role');
            throw new Error('Dữ liệu người dùng không đầy đủ');
          }
          setUser({ ...res.data, token });
          setLoading(false);
        })
        .catch((err) => {
          console.error('Lỗi khi lấy thông tin user:', err.response?.data || err);
          localStorage.removeItem('token');
          setUser(null);
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);
  // Hàm đăng nhập
  const login = (userData) => { 
    if (!userData || !userData.token || !userData.role || userData.total_spent === undefined || userData.is_vip === undefined) {
      throw new Error('Dữ liệu đăng nhập không hợp lệ');
    }
    setUser(userData);
    localStorage.setItem('token', userData.token);
  };
  // Hàm cập nhật thông tin người dùng
  const updateUser = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await api.get('/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser({ ...res.data, token });
    } catch (err) {
      console.error('Lỗi khi làm mới thông tin người dùng:', err.response?.data || err);
      throw err;
    }
  };
  // Hàm đăng xuất
  const logout = () => {
    setUser(null);
    localStorage.removeItem('token');
  };
  // Trả về context với các hàm và trạng thái
  return (
    <AuthContext.Provider value={{ user, login, updateUser, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};