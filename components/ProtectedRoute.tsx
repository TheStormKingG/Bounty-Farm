
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Role } from '../types';

interface ProtectedRouteProps {
  allowedRoles: Role[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
  const { user } = useAuth();

  console.log('ProtectedRoute check:', {
    user: user?.role,
    userName: user?.name,
    userEmail: user?.email,
    allowedRoles,
    hasAccess: user && allowedRoles.includes(user.role),
    userObject: user
  });

  if (!user || !allowedRoles.includes(user.role)) {
    // Redirect them to the root, which will then handle role-based redirection.
    console.log('ProtectedRoute: Access denied, redirecting to /');
    console.log('Access denied details:', {
      hasUser: !!user,
      userRole: user?.role,
      allowedRoles,
      roleMatch: user ? allowedRoles.includes(user.role) : false
    });
    return <Navigate to="/" replace />;
  }

  console.log('ProtectedRoute: Access granted');
  return <Outlet />;
};

export default ProtectedRoute;