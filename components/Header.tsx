import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, NavLink } from 'react-router-dom';
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
      <header className="modern-header p-4 lg:p-6 flex items-center relative">
        {/* Mobile menu button */}
        {user?.role === Role.Admin && (
          <button
            onClick={toggleMobileMenu}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 absolute left-4"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        )}
        
        {/* Logo and BFLOS version - Centered */}
        <div className="flex items-center space-x-2 lg:space-x-4 mx-auto">
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
            <h1 className="text-lg lg:text-xl font-bold text-[#333333]">BFLOS Version 1.0</h1>
          </div>
        </div>
        
        {/* User info and logout - Right aligned */}
        <div className="flex items-center space-x-2 lg:space-x-6 absolute right-4">
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
          <div className="fixed left-0 top-0 h-full w-72 bg-white shadow-xl overflow-y-auto" onClick={(e) => e.stopPropagation()}>
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
                <NavLink to="/dashboard" className="block px-4 py-3 text-[#333333] hover:bg-[#FFE4D6] rounded-xl transition-all duration-300 font-medium" onClick={toggleMobileMenu}>
                  📊 Dashboard
                </NavLink>
                <NavLink to="/hatch-cycles" className="block px-4 py-3 text-[#333333] hover:bg-[#FFE4D6] rounded-xl transition-all duration-300 font-medium" onClick={toggleMobileMenu}>
                  🥚 Hatches
                </NavLink>
                <NavLink to="/sales" className="block px-4 py-3 text-[#333333] hover:bg-[#FFE4D6] rounded-xl transition-all duration-300 font-medium" onClick={toggleMobileMenu}>
                  🐣 Chicks
                </NavLink>
                <NavLink to="/dispatch" className="block px-4 py-3 text-[#333333] hover:bg-[#FFE4D6] rounded-xl transition-all duration-300 font-medium" onClick={toggleMobileMenu}>
                  🚚 Dispatch
                </NavLink>
                <NavLink to="/farm" className="block px-4 py-3 text-[#333333] hover:bg-[#FFE4D6] rounded-xl transition-all duration-300 font-medium" onClick={toggleMobileMenu}>
                  🚜 Farm
                </NavLink>
                <NavLink to="/grow-out" className="block px-4 py-3 text-[#333333] hover:bg-[#FFE4D6] rounded-xl transition-all duration-300 font-medium" onClick={toggleMobileMenu}>
                  🌱 Grow-Out
                </NavLink>
                <NavLink to="/catching" className="block px-4 py-3 text-[#333333] hover:bg-[#FFE4D6] rounded-xl transition-all duration-300 font-medium" onClick={toggleMobileMenu}>
                  🎯 Catching
                </NavLink>
                <NavLink to="/plant" className="block px-4 py-3 text-[#333333] hover:bg-[#FFE4D6] rounded-xl transition-all duration-300 font-medium" onClick={toggleMobileMenu}>
                  🏭 Plant
                </NavLink>
                <NavLink to="/mill" className="block px-4 py-3 text-[#333333] hover:bg-[#FFE4D6] rounded-xl transition-all duration-300 font-medium" onClick={toggleMobileMenu}>
                  ⚙️ Mill
                </NavLink>
                <NavLink to="/inventory" className="block px-4 py-3 text-[#333333] hover:bg-[#FFE4D6] rounded-xl transition-all duration-300 font-medium" onClick={toggleMobileMenu}>
                  📦 Inventory
                </NavLink>
                <NavLink to="/employees" className="block px-4 py-3 text-[#333333] hover:bg-[#FFE4D6] rounded-xl transition-all duration-300 font-medium" onClick={toggleMobileMenu}>
                  👥 Employees
                </NavLink>
                <NavLink to="/payroll" className="block px-4 py-3 text-[#333333] hover:bg-[#FFE4D6] rounded-xl transition-all duration-300 font-medium" onClick={toggleMobileMenu}>
                  💰 Payroll
                </NavLink>
                <NavLink to="/qhse" className="block px-4 py-3 text-[#333333] hover:bg-[#FFE4D6] rounded-xl transition-all duration-300 font-medium" onClick={toggleMobileMenu}>
                  🛡️ QHSE
                </NavLink>
                <div className="pt-4 mt-6 border-t border-[#F5F0EE]"></div>
                <NavLink to="/flock-management" className="block px-4 py-3 text-[#333333] hover:bg-[#FFE4D6] rounded-xl transition-all duration-300 font-medium" onClick={toggleMobileMenu}>
                  🐔 Flocks
                </NavLink>
                <NavLink to="/breed-management" className="block px-4 py-3 text-[#333333] hover:bg-[#FFE4D6] rounded-xl transition-all duration-300 font-medium" onClick={toggleMobileMenu}>
                  🧬 Breeds
                </NavLink>
                <NavLink to="/vaccine-profile" className="block px-4 py-3 text-[#333333] hover:bg-[#FFE4D6] rounded-xl transition-all duration-300 font-medium" onClick={toggleMobileMenu}>
                  💉 Vaccines
                </NavLink>
                <NavLink to="/customers" className="block px-4 py-3 text-[#333333] hover:bg-[#FFE4D6] rounded-xl transition-all duration-300 font-medium" onClick={toggleMobileMenu}>
                  👥 Customers
                </NavLink>
                <NavLink to="/settings" className="block px-4 py-3 text-[#333333] hover:bg-[#FFE4D6] rounded-xl transition-all duration-300 font-medium" onClick={toggleMobileMenu}>
                  ⚙️ Settings
                </NavLink>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;