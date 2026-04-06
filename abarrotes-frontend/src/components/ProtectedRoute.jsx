import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { onAuthChange } from '../services/firebaseAuth';
import { useAuth } from '../context/AuthContext';

const SESSION_TIMEOUT = 30 * 60 * 1000;

const ProtectedRoute = ({ children, allowedProfiles = [] }) => {
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    const checkSession = () => {
      const isDesktopApp = sessionStorage.getItem('desktop_isDesktopApp');
      const loginTime = sessionStorage.getItem('desktop_loginTime');
      
      if (isDesktopApp === 'true' && loginTime) {
        const elapsed = Date.now() - parseInt(loginTime, 10);
        if (elapsed > SESSION_TIMEOUT) {
          sessionStorage.removeItem('desktop_employeeId');
          sessionStorage.removeItem('desktop_employeeName');
          sessionStorage.removeItem('desktop_employeeProfile');
          sessionStorage.removeItem('desktop_employeeProfileColor');
          sessionStorage.removeItem('desktop_loginTime');
          sessionStorage.removeItem('desktop_isDesktopApp');
          return false;
        }
        return true;
      }
      return false;
    };

    if (!checkSession()) {
      setIsAuthenticated(false);
      setIsChecking(false);
      return;
    }

    const unsubscribe = onAuthChange((state) => {
      if (state.isAuthenticated && state.user) {
        setIsAuthenticated(true);
        setUserProfile(state.user.profile);
        sessionStorage.setItem('desktop_employeeId', state.user.id);
        sessionStorage.setItem('desktop_employeeName', state.user.nombre);
        const mappedProfile = { supervisor: 'manager', lider: 'manager', director: 'admin', administrador: 'admin' }[state.user.profile] || state.user.profile;
        sessionStorage.setItem('desktop_employeeProfile', mappedProfile);
        sessionStorage.setItem('desktop_employeeProfileColor', state.user.color);
        sessionStorage.setItem('desktop_employeeProfileColorDark', state.user.colorDark || '#0F4D2E');
        sessionStorage.setItem('desktop_loginTime', Date.now().toString());
        sessionStorage.setItem('desktop_isDesktopApp', 'true');
      } else {
        setIsAuthenticated(false);
      }
      setIsChecking(false);
    });
    
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const resetTimer = () => {
      const isDesktopApp = sessionStorage.getItem('desktop_isDesktopApp');
      if (isDesktopApp === 'true') {
        sessionStorage.setItem('desktop_loginTime', Date.now().toString());
      }
    };

    const events = ['mousedown', 'keydown', 'touchstart', 'scroll'];
    
    events.forEach(event => {
      window.addEventListener(event, resetTimer, { passive: true });
    });

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, []);

  if (isChecking) {
    return (
      <div style={{ 
        position: 'fixed', inset: 0, 
        background: 'linear-gradient(135deg, #004d2f, #00843D)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 9999
      }}>
        <div style={{ textAlign: 'center', color: 'white' }}>
          <div style={{
            width: 40, height: 40, border: '3px solid rgba(255,255,255,0.3)',
            borderTopColor: 'white', borderRadius: '50%',
            animation: 'spin 0.8s linear infinite', margin: '0 auto 12px'
          }} />
          <p style={{ margin: 0, fontSize: '0.9rem', opacity: 0.8 }}>Verificando sesión...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedProfiles.length > 0 && !allowedProfiles.includes(userProfile)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Route wrapper que verifica permisos específicos
export function RoleProtectedRoute({ children, requiredPermission }) {
  const { hasPermission, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={{ 
        position: 'fixed', inset: 0, 
        background: 'var(--role-gradient, linear-gradient(135deg, #004d2f, #00843D))',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 9999
      }}>
        <div style={{ textAlign: 'center', color: 'white' }}>
          <div style={{
            width: 40, height: 40, border: '3px solid rgba(255,255,255,0.3)',
            borderTopColor: 'white', borderRadius: '50%',
            animation: 'spin 0.8s linear infinite', margin: '0 auto 12px'
          }} />
          <p style={{ margin: 0, fontSize: '0.9rem', opacity: 0.8 }}>Verificando permisos...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredPermission && !hasPermission(requiredPermission)) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default ProtectedRoute;
