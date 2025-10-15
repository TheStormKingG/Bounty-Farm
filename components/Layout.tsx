
import React, { ReactNode } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { useAuth } from '../context/AuthContext';
import { Role } from '../types';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user } = useAuth();
  
  // Only show sidebar for Admin users
  const showSidebar = user?.role === Role.Admin;

  return (
    <div className="flex h-screen bg-gray-50">
      {showSidebar && (
        <div className="hidden lg:block">
          <Sidebar />
        </div>
      )}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Header />
        <main className="flex-1 overflow-x-auto overflow-y-auto p-4 lg:p-6">
          <div className="max-w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
