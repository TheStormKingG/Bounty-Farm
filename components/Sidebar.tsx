import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Role } from '../types';

const Sidebar: React.FC = () => {
  const { user } = useAuth();

  const navLinkClasses = "flex items-center px-3 py-1.5 lg:px-4 lg:py-2 text-[#333333] hover:bg-[#FFE4D6] rounded-xl transition-all duration-300 font-medium text-sm lg:text-base";
  const activeNavLinkClasses = "bg-[#FFE4D6] text-[#5C3A6B] font-semibold";

  const hasRole = (roles: Role[]) => user && roles.includes(user.role);

  return (
    <aside className="modern-sidebar w-72 flex-shrink-0 p-4 lg:p-6 flex flex-col h-screen">
      <div className="text-center mb-4 lg:mb-6">
        <div className="w-12 h-12 lg:w-16 lg:h-16 bg-gradient-to-br from-[#F86F6F] to-[#FFB0B0] rounded-2xl mx-auto mb-2 lg:mb-3 flex items-center justify-center">
          <span className="text-white font-bold text-lg lg:text-xl">BF</span>
        </div>
        <h1 className="heading-tertiary text-[#333333] text-lg lg:text-xl">Company View</h1>
      </div>
      
      <nav className="space-y-1 flex-1">
        {hasRole([Role.Admin]) && (
            <NavLink to="/dashboard" className={({ isActive }) => `${navLinkClasses} ${isActive ? activeNavLinkClasses : ''}`}>
              <span className="mr-3">📊</span>
              Dashboard
            </NavLink>
        )}

        {hasRole([Role.Admin, Role.HatcheryClerk]) && (
          <NavLink to="/hatch-cycles" className={({ isActive }) => `${navLinkClasses} ${isActive ? activeNavLinkClasses : ''}`}>
            <span className="mr-3">🥚</span>
            Hatches
          </NavLink>
        )}
        
        {hasRole([Role.Admin, Role.SalesClerk]) && (
          <NavLink to="/sales" className={({ isActive }) => `${navLinkClasses} ${isActive ? activeNavLinkClasses : ''}`}>
            <span className="mr-3">🐣</span>
            Chicks
          </NavLink>
        )}

        {hasRole([Role.Admin, Role.SalesClerk]) && (
          <NavLink to="/dispatch" className={({ isActive }) => `${navLinkClasses} ${isActive ? activeNavLinkClasses : ''}`}>
            <span className="mr-3">🚚</span>
            Dispatch
          </NavLink>
        )}

        {hasRole([Role.Admin]) && (
          <>
            <NavLink to="/farm" className={({ isActive }) => `${navLinkClasses} ${isActive ? activeNavLinkClasses : ''}`}>
              <span className="mr-3">🚜</span>
              Farm
            </NavLink>
            <NavLink to="/grow-out" className={({ isActive }) => `${navLinkClasses} ${isActive ? activeNavLinkClasses : ''}`}>
              <span className="mr-3">🌱</span>
              Grow-Out
            </NavLink>
            <NavLink to="/catching" className={({ isActive }) => `${navLinkClasses} ${isActive ? activeNavLinkClasses : ''}`}>
              <span className="mr-3">🎯</span>
              Catching
            </NavLink>
            <NavLink to="/plant" className={({ isActive }) => `${navLinkClasses} ${isActive ? activeNavLinkClasses : ''}`}>
              <span className="mr-3">🏭</span>
              Plant
            </NavLink>
            <NavLink to="/mill" className={({ isActive }) => `${navLinkClasses} ${isActive ? activeNavLinkClasses : ''}`}>
              <span className="mr-3">⚙️</span>
              Mill
            </NavLink>
            <NavLink to="/inventory" className={({ isActive }) => `${navLinkClasses} ${isActive ? activeNavLinkClasses : ''}`}>
              <span className="mr-3">📦</span>
              Inventory
            </NavLink>
            <NavLink to="/employees" className={({ isActive }) => `${navLinkClasses} ${isActive ? activeNavLinkClasses : ''}`}>
              <span className="mr-3">👥</span>
              Employees
            </NavLink>
            <NavLink to="/payroll" className={({ isActive }) => `${navLinkClasses} ${isActive ? activeNavLinkClasses : ''}`}>
              <span className="mr-3">💰</span>
              Payroll
            </NavLink>
            <NavLink to="/qhse" className={({ isActive }) => `${navLinkClasses} ${isActive ? activeNavLinkClasses : ''}`}>
              <span className="mr-3">🛡️</span>
              QHSE
            </NavLink>
            <div className="pt-2 mt-4 border-t border-[#F5F0EE]"></div>
            <NavLink to="/flock-management" className={({ isActive }) => `${navLinkClasses} ${isActive ? activeNavLinkClasses : ''}`}>
              <span className="mr-3">🐔</span>
              Flocks
            </NavLink>
            <NavLink to="/breed-management" className={({ isActive }) => `${navLinkClasses} ${isActive ? activeNavLinkClasses : ''}`}>
              <span className="mr-3">🧬</span>
              Breeds
            </NavLink>
            <NavLink to="/vaccine-profile" className={({ isActive }) => `${navLinkClasses} ${isActive ? activeNavLinkClasses : ''}`}>
              <span className="mr-3">💉</span>
              Vaccines
            </NavLink>
            <NavLink to="/customers" className={({ isActive }) => `${navLinkClasses} ${isActive ? activeNavLinkClasses : ''}`}>
              <span className="mr-3">👥</span>
              Customers
            </NavLink>
            <NavLink to="/settings" className={({ isActive }) => `${navLinkClasses} ${isActive ? activeNavLinkClasses : ''}`}>
              <span className="mr-3">⚙️</span>
              Settings
            </NavLink>
          </>
        )}
      </nav>
    </aside>
  );
};

export default Sidebar;