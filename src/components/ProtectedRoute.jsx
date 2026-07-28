import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import CambioPassword from '../pages/CambioPassword';

/* ── Splash de carga — NEGRO neutro (biblia §12): sin branding de Punto Verde
   hasta conocer el tenant. Solo un spinner neutro. ────────────────────────── */
const AuthLoading = () => (
  <div style={{
    position: 'fixed', inset: 0,
    background: '#0B0B0C',
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', zIndex: 9999,
  }}>
    <div style={{
      width: 36, height: 36,
      border: '3px solid rgba(255,255,255,0.15)',
      borderTopColor: 'rgba(255,255,255,0.75)',
      borderRadius: '50%',
      animation: 'pv-spin 0.8s linear infinite',
    }} />
    <style>{`@keyframes pv-spin { to { transform: rotate(360deg) } }`}</style>
  </div>
);

/* ── Rutas protegidas ─────────────────────────────────────────────────────── */

export function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading, empleado } = useAuth();
  if (isLoading) return <AuthLoading />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (empleado?.requiereCambioPassword) return <CambioPassword />;
  return children;
}

export function RoleProtectedRoute({ children, requiredPermission }) {
  const { isAuthenticated, isLoading, hasPermission, empleado } = useAuth();
  if (isLoading) return <AuthLoading />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (empleado?.requiereCambioPassword) return <CambioPassword />;
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
