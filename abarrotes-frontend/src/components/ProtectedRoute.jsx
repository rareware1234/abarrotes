import React, { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { onAuthChange } from '../services/firebaseAuth';

const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutos

const ProtectedRoute = ({ children, allowedProfiles = [] }) => {
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const location = useLocation();

  useEffect(() => {
    // Verificar timeout de sesión
    const checkSession = () => {
      const isDesktopApp = sessionStorage.getItem('desktop_isDesktopApp');
      const loginTime = sessionStorage.getItem('desktop_loginTime');
      
      if (isDesktopApp === 'true' && loginTime) {
        const elapsed = Date.now() - parseInt(loginTime, 10);
        if (elapsed > SESSION_TIMEOUT) {
          // Sesión expirada
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

    // Verificar sesión al cargar
    if (!checkSession()) {
      setIsAuthenticated(false);
      setIsChecking(false);
      return;
    }

    // Usar Firebase Auth para verificar el estado
    const unsubscribe = onAuthChange((state) => {
      if (state.isAuthenticated && state.user) {
        setIsAuthenticated(true);
        setUserProfile(state.user.profile);
        
        // Actualizar sessionStorage con prefijo escritorio
        sessionStorage.setItem('desktop_employeeId', state.user.id);
        sessionStorage.setItem('desktop_employeeName', state.user.nombre);
        sessionStorage.setItem('desktop_employeeProfile', state.user.profile);
        sessionStorage.setItem('desktop_employeeProfileColor', state.user.color);
        sessionStorage.setItem('desktop_loginTime', Date.now().toString());
        sessionStorage.setItem('desktop_isDesktopApp', 'true');
      } else {
        setIsAuthenticated(false);
      }
      setIsChecking(false);
    });
    
    return () => unsubscribe();
  }, []);

  // Reset timer on activity
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
      <div className="d-flex justify-content-center align-items-center min-vh-100" style={{ backgroundColor: '#0a0a0f' }}>
        <div className="spinner-border text-success" role="status">
          <span className="visually-hidden">Verificando autenticación...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Verificar permisos de perfil si se especifican
  if (allowedProfiles.length > 0 && !allowedProfiles.includes(userProfile)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;
