import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Role } from '../types';

const Sidebar: React.FC = () => {
  const { user } = useAuth();

  const navLinkClasses = "flex items-center px-4 py-3 text-[#333333] hover:bg-[#FFE4D6] rounded-xl transition-all duration-300 font-medium";
  const activeNavLinkClasses = "bg-[#FFE4D6] text-[#5C3A6B] font-semibold";

  const hasRole = (roles: Role[]) => user && roles.includes(user.role);

  return (
    <aside className="modern-sidebar w-64 flex-shrink-0 p-6 flex flex-col">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-br from-[#F86F6F] to-[#FFB0B0] rounded-2xl mx-auto mb-4 flex items-center justify-center">
          <span className="text-white font-bold text-xl">BF</span>
        </div>
        <h1 className="heading-tertiary text-[#333333]">Hatchery MIS</h1>
      </div>
      
      <nav className="space-y-2 flex-1">
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

        {hasRole([Role.Admin, Role.SalesClerk]) && (
          <NavLink to="/delivery" className={({ isActive }) => `${navLinkClasses} ${isActive ? activeNavLinkClasses : ''}`}>
            <span className="mr-3">📦</span>
            Delivery
          </NavLink>
        )}

        {hasRole([Role.Admin]) && (
          <>
            <div className="pt-4 mt-6 border-t border-[#F5F0EE]"></div>
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