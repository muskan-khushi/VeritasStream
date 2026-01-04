import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  const isAuth = localStorage.getItem('isAuthenticated');

  if (!isAuth) {
    // ⛔ No ticket? Go to Login.
    return <Navigate to="/login" replace />;
  }

  // ✅ Have ticket? Enter.
  return children;
};

export default ProtectedRoute;