import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate, useLocation } from 'react-router-dom';

export const ProtectedRoute = ({ children, roles }) => {
  const { user, isAuthenticated, loading, initialized } = useSelector(
    (state) => state.auth
  );
  const location = useLocation();

  if (!initialized || loading) {
    return (
      <div className='loader'>
        <div className='loader-spinner'></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Save the attempted URL
    return <Navigate to='/' state={{ from: location }} replace />;
  }

  if (roles && !roles.includes(user?.role)) {
    return <Navigate to='/dashboard' replace />;
  }

  return children;
};
