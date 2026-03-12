import { Navigate } from 'react-router-dom';
import { isAuthenticated } from '../services/api';

export function ProtectedRoute({ children }) {
  // Check if user has valid token
  if (!isAuthenticated()) {
    // Clear any stale data
    localStorage.removeItem('user');
    // Redirect to login
    return <Navigate to="/login" replace />;
  }

  return children;
}

export function PublicRoute({ children }) {
  // If user is already authenticated, redirect to dashboard
  if (isAuthenticated()) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}