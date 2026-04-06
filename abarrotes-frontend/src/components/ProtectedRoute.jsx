import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AuthLoading = () => (
  <div style={{
    position: 'fixed', inset: 0,
    background: 'linear-gradient(135deg, #0F4D2E, #1A7A48)',
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', zIndex: 9999
  }}>
    <div style={{
      width: 44, height: 44,
      border: '3px solid rgba(255,255,255,0.25)',
      borderTopColor: 'white', borderRadius: '50%',
      animation: 'spin 0.8s linear infinite'
    }} />
    <p style={{ color: 'rgba(255,255,255,0.7)', marginTop: 16, fontSize: 14 }}>
      Verificando sesión...
    </p>
    <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
  </div>
);

export function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <AuthLoading />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}

export function RoleProtectedRoute({ children, requiredPermission }) {
  const { isAuthenticated, isLoading, hasPermission } = useAuth();
  if (isLoading) return <AuthLoading />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (requiredPermission && !hasPermission(requiredPermission))
    return <Navigate to="/" replace />;
  return children;
}

export function PublicRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <AuthLoading />;
  if (isAuthenticated) return <Navigate to="/" replace />;
  return children;
}