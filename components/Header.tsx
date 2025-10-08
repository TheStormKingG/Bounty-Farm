import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-white shadow-md p-4 flex justify-end items-center">
      <div className="flex items-center space-x-4">
        {user && (
          <div className="text-right">
            <p className="font-semibold text-gray-700">{user.name}</p>
            <p className="text-sm text-gray-500">{user.role}</p>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
        >
          Logout
        </button>
      </div>
    </header>
  );
};

export default Header;