import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Role } from '../types';

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <>
      <header className="modern-header p-4 lg:p-6 flex justify-between items-center">
        {/* Mobile menu button */}
        {user?.role === Role.Admin && (
          <button
            onClick={toggleMobileMenu}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        )}
        
        {/* Logo and BFLOS version */}
        <div className="flex items-center space-x-2 lg:space-x-4">
          <div className="w-8 h-8 lg:w-12 lg:h-12">
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
            <h1 className="text-lg lg:text-xl font-bold text-[#333333]">BFLOS 1.0</h1>
          </div>
        </div>
        
        {/* User info and logout */}
        <div className="flex items-center space-x-2 lg:space-x-6">
          {user && (
            <div className="text-right hidden sm:block">
              <p className="font-semibold text-[#333333] text-sm lg:text-lg">{user.name}</p>
              <p className="text-xs lg:text-sm text-[#AAAAAA] font-medium">{user.role}</p>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="btn-secondary px-3 py-2 lg:px-6 lg:py-2 text-xs lg:text-sm"
          >
            Logout
          </button>
        </div>
      </header>
      
      {/* Mobile menu overlay */}
      {isMobileMenuOpen && user?.role === Role.Admin && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black bg-opacity-50" onClick={toggleMobileMenu}>
          <div className="fixed left-0 top-0 h-full w-64 bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-4">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold text-[#333333]">Company View</h2>
                <button
                  onClick={toggleMobileMenu}
                  className="p-2 rounded-lg hover:bg-gray-100"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="space-y-2">
                <a href="/dashboard" className="block px-4 py-3 text-[#333333] hover:bg-[#FFE4D6] rounded-xl transition-all duration-300 font-medium">
                  📊 Dashboard
                </a>
                <a href="/hatch-cycles" className="block px-4 py-3 text-[#333333] hover:bg-[#FFE4D6] rounded-xl transition-all duration-300 font-medium">
                  🥚 Hatches
                </a>
                <a href="/sales" className="block px-4 py-3 text-[#333333] hover:bg-[#FFE4D6] rounded-xl transition-all duration-300 font-medium">
                  🐣 Chicks
                </a>
                <a href="/dispatch" className="block px-4 py-3 text-[#333333] hover:bg-[#FFE4D6] rounded-xl transition-all duration-300 font-medium">
                  🚚 Dispatch
                </a>
                <a href="/farm" className="block px-4 py-3 text-[#333333] hover:bg-[#FFE4D6] rounded-xl transition-all duration-300 font-medium">
                  🚜 Farm
                </a>
                <a href="/grow-out" className="block px-4 py-3 text-[#333333] hover:bg-[#FFE4D6] rounded-xl transition-all duration-300 font-medium">
                  🌱 Grow-Out
                </a>
                <a href="/catching" className="block px-4 py-3 text-[#333333] hover:bg-[#FFE4D6] rounded-xl transition-all duration-300 font-medium">
                  🎯 Catching
                </a>
                <a href="/plant" className="block px-4 py-3 text-[#333333] hover:bg-[#FFE4D6] rounded-xl transition-all duration-300 font-medium">
                  🏭 Plant
                </a>
                <a href="/mill" className="block px-4 py-3 text-[#333333] hover:bg-[#FFE4D6] rounded-xl transition-all duration-300 font-medium">
                  ⚙️ Mill
                </a>
                <a href="/inventory" className="block px-4 py-3 text-[#333333] hover:bg-[#FFE4D6] rounded-xl transition-all duration-300 font-medium">
                  📦 Inventory
                </a>
                <a href="/employees" className="block px-4 py-3 text-[#333333] hover:bg-[#FFE4D6] rounded-xl transition-all duration-300 font-medium">
                  👥 Employees
                </a>
                <a href="/payroll" className="block px-4 py-3 text-[#333333] hover:bg-[#FFE4D6] rounded-xl transition-all duration-300 font-medium">
                  💰 Payroll
                </a>
                <a href="/qhse" className="block px-4 py-3 text-[#333333] hover:bg-[#FFE4D6] rounded-xl transition-all duration-300 font-medium">
                  🛡️ QHSE
                </a>
                <div className="pt-4 mt-6 border-t border-[#F5F0EE]"></div>
                <a href="/flock-management" className="block px-4 py-3 text-[#333333] hover:bg-[#FFE4D6] rounded-xl transition-all duration-300 font-medium">
                  🐔 Flocks
                </a>
                <a href="/breed-management" className="block px-4 py-3 text-[#333333] hover:bg-[#FFE4D6] rounded-xl transition-all duration-300 font-medium">
                  🧬 Breeds
                </a>
                <a href="/vaccine-profile" className="block px-4 py-3 text-[#333333] hover:bg-[#FFE4D6] rounded-xl transition-all duration-300 font-medium">
                  💉 Vaccines
                </a>
                <a href="/customers" className="block px-4 py-3 text-[#333333] hover:bg-[#FFE4D6] rounded-xl transition-all duration-300 font-medium">
                  👥 Customers
                </a>
                <a href="/settings" className="block px-4 py-3 text-[#333333] hover:bg-[#FFE4D6] rounded-xl transition-all duration-300 font-medium">
                  ⚙️ Settings
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;