import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types/api';

interface ProtectedRouteProps {
  allowedRoles: UserRole[];
  children: React.ReactNode;
  redirectTo?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  allowedRoles,
  children,
  redirectTo = '/access-denied',
}) => {
  const { user, isLoading } = useAuth();

  // Still loading auth state
  if (isLoading) {
    return null;
  }

  // Not authenticated - MainLayout handles this redirect
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check if user's role is in allowed roles
  if (!allowedRoles.includes(user.Role)) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
