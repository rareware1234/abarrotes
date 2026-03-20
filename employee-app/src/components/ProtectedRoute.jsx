import React, { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

const ProtectedRoute = ({ children, allowedProfiles = [] }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const verifySession = () => {
      // Verificar sesión móvil con prefijo
      const mobileEmployeeId = sessionStorage.getItem('mobile_employeeId');
      const mobileIsMobileApp = sessionStorage.getItem('mobile_isMobileApp');
      
      if (mobileIsMobileApp === 'true' && mobileEmployeeId) {
        setIsAuthenticated(true);
        setUserProfile(sessionStorage.getItem('mobile_employeeProfile'));
      } else {
        setIsAuthenticated(false);
      }
      
      setLoading(false);
    };

    verifySession();
  }, [location.pathname]);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100" style={{ backgroundColor: '#0a0a0f' }}>
        <div className="spinner-border text-success" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Verificar permisos de perfil si se especifican
  if (allowedProfiles.length > 0 && !allowedProfiles.includes(userProfile)) {
    return <Navigate to="/pos" replace />;
  }

  return children;
};

export default ProtectedRoute;
