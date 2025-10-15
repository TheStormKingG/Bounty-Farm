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
    <header className="modern-header p-6 flex justify-between items-center">
      {/* Logo and BFLOS version */}
      <div className="flex items-center space-x-4">
        <div className="w-12 h-12">
          <img 
            src="images/BPF-Stefan-8.png" 
            alt="Bounty Farm Logo" 
            className="w-full h-full object-contain"
            onError={(e) => {
              console.error('Logo failed to load:', e);
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>
        <div>
          <h1 className="text-xl font-bold text-[#333333]">BFLOS 1.0</h1>
        </div>
      </div>
      
      {/* User info and logout */}
      <div className="flex items-center space-x-6">
        {user && (
          <div className="text-right">
            <p className="font-semibold text-[#333333] text-lg">{user.name}</p>
            <p className="text-sm text-[#AAAAAA] font-medium">{user.role}</p>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="btn-secondary px-6 py-2 text-sm"
        >
          Logout
        </button>
      </div>
    </header>
  );
};

export default Header;