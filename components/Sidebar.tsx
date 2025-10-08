import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Role } from '../types';

const Sidebar: React.FC = () => {
  const { user } = useAuth();

  const navLinkClasses = "flex items-center px-4 py-2 text-gray-100 hover:bg-bounty-blue-700 rounded-md transition-colors";
  const activeNavLinkClasses = "bg-bounty-blue-700";

  const hasRole = (roles: Role[]) => user && roles.includes(user.role);

  return (
    <aside className="w-64 bg-bounty-blue-900 text-white flex-shrink-0 p-4 flex flex-col">
      <div className="text-2xl font-bold mb-10 text-center">
        <img src="https://picsum.photos/80/80" alt="Bounty Farm Logo" className="mx-auto rounded mb-2 w-20 h-20 object-contain"/>
        <span className="mt-2 block text-xl">Hatchery MIS</span>
      </div>
      <nav className="space-y-2">
        {hasRole([Role.Admin]) && (
            <NavLink to="/dashboard" className={({ isActive }) => `${navLinkClasses} ${isActive ? activeNavLinkClasses : ''}`}>Dashboard</NavLink>
        )}


        {hasRole([Role.Admin, Role.HatcheryClerk]) && (
          <>
            <NavLink to="/egg-procurement" className={({ isActive }) => `${navLinkClasses} ${isActive ? activeNavLinkClasses : ''}`}>Egg Procurement</NavLink>
            <NavLink to="/hatch-cycles" className={({ isActive }) => `${navLinkClasses} ${isActive ? activeNavLinkClasses : ''}`}>Hatch Cycles</NavLink>
            <NavLink to="/chick-processing" className={({ isActive }) => `${navLinkClasses} ${isActive ? activeNavLinkClasses : ''}`}>Chick Processing</NavLink>
            <NavLink to="/non-viable-eggs" className={({ isActive }) => `${navLinkClasses} ${isActive ? activeNavLinkClasses : ''}`}>Non-Viable Eggs</NavLink>
          </>
        )}
        
        {hasRole([Role.Admin, Role.SalesClerk]) && (
          <NavLink to="/sales" className={({ isActive }) => `${navLinkClasses} ${isActive ? activeNavLinkClasses : ''}`}>Sales & Dispatch</NavLink>
        )}

        {hasRole([Role.Admin]) && (
          <>
            <div className="pt-4 mt-4 border-t border-bounty-blue-700"></div>
            <NavLink to="/settings" className={({ isActive }) => `${navLinkClasses} ${isActive ? activeNavLinkClasses : ''}`}>
                Settings
            </NavLink>
          </>
        )}
      </nav>
    </aside>
  );
};

export default Sidebar;