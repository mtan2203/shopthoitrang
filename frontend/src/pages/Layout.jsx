import React, { useContext } from 'react';
import { Outlet } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import UserNavbar from './UserNavbar';
import AdminNavbar from './AdminNavbar';
import UserFooter from './UserFooter';
import AdminFooter from './AdminFooter';

const Layout = () => {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-xl text-gray-600">Đang tải...</p>
      </div>
    );
  }

  const isAdmin = user && user.role === 'admin';

  return (
    <div className="flex flex-col min-h-screen">
      {isAdmin ? <AdminNavbar /> : <UserNavbar />}
      <main className="flex-grow">
        <Outlet />
      </main>
      {isAdmin ? <AdminFooter /> : <UserFooter />}
    </div>
  );
};

export default Layout;