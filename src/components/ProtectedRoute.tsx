import { type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading, emailVerified } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="full-screen-loader">
        <Loader2 className="spinner icon-lg" />
        <p>Loading MyWorkspace...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!emailVerified) {
    return <Navigate to="/verify-email" replace />;
  }

  return <>{children}</>;
};
