import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Scanner from './pages/Scanner';
import Asistencia from './pages/Asistencia';
import Caja from './pages/Caja';
import Tasks from './pages/Tasks';
import Perfil from './pages/Perfil';
import TestAuth from './pages/TestAuth';
import Pos from './pages/Pos';
import { onAuthChange } from './services/firebaseAuth';
import { canAccessRoute } from './data/employeeProfiles';

// Componente para proteger rutas con autenticación
const ProtectedRoute = ({ children, route }) => {
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [employeeProfile, setEmployeeProfile] = useState(null);
  
  useEffect(() => {
    // Usar Firebase Auth para verificar el estado
    const unsubscribe = onAuthChange((state) => {
      if (state.isAuthenticated && state.user) {
        setIsAuthenticated(true);
        setEmployeeProfile(state.user.profile);
        
        // Actualizar sessionStorage con prefijo móvil
        sessionStorage.setItem('mobile_employeeId', state.user.id);
        sessionStorage.setItem('mobile_employeeName', state.user.nombre);
        sessionStorage.setItem('mobile_employeeProfile', state.user.profile);
        sessionStorage.setItem('mobile_employeeProfileColor', state.user.color);
        sessionStorage.setItem('mobile_loginTime', Date.now().toString());
        sessionStorage.setItem('mobile_isMobileApp', 'true');
      } else {
        setIsAuthenticated(false);
      }
      setIsChecking(false);
    });
    
    return () => unsubscribe();
  }, []);
  
  if (isChecking) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Verificando autenticación...</span>
        </div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  // Verificar si el empleado tiene acceso a la ruta
  if (route && employeeProfile && !canAccessRoute(employeeProfile, route)) {
    console.log(`Empleado ${employeeProfile} no tiene acceso a la ruta ${route}`);
    return <Navigate to="/pos" replace />;
  }
  
  return children;
};

function App() {
  return (
    <div className="app-container">
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/test-auth" element={<TestAuth />} />
        
        <Route
          path="/"
          element={
            <ProtectedRoute route="">
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/pos" replace />} />
          <Route path="dashboard" element={<Navigate to="/pos" replace />} />
          <Route 
            path="pos" 
            element={
              <ProtectedRoute route="pos">
                <Pos />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="scanner" 
            element={
              <ProtectedRoute route="scanner">
                <Scanner />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="tasks" 
            element={
              <ProtectedRoute route="tasks">
                <Tasks />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="asistencia" 
            element={
              <ProtectedRoute route="asistencia">
                <Asistencia />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="caja" 
            element={
              <ProtectedRoute route="caja">
                <Caja />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="perfil" 
            element={
              <ProtectedRoute route="perfil">
                <Perfil />
              </ProtectedRoute>
            } 
          />
        </Route>
        
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </div>
  );
}

export default App;
