
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
    allowedRoles,
    hasAccess: user && allowedRoles.includes(user.role)
  });

  if (!user || !allowedRoles.includes(user.role)) {
    // Redirect them to the root, which will then handle role-based redirection.
    console.log('ProtectedRoute: Access denied, redirecting to /');
    return <Navigate to="/" replace />;
  }

  console.log('ProtectedRoute: Access granted');
  return <Outlet />;
};

export default ProtectedRoute;