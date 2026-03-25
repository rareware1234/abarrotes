import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import Login from './pages/Login';
import Pos from './pages/Pos';
import Scanner from './pages/Scanner';
import Tasks from './pages/Tasks';
import Caja from './pages/Caja';
import Perfil from './pages/Perfil';
import Asistencia from './pages/Asistencia';
import { onAuthChange } from './services/firebaseAuth';

const ProtectedRoute = ({ children }) => {
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthChange((state) => {
      if (state.isAuthenticated && state.user) {
        sessionStorage.setItem('mobile_employeeId', state.user.id);
        sessionStorage.setItem('mobile_employeeName', state.user.nombre);
        sessionStorage.setItem('mobile_employeeProfile', state.user.profile);
        sessionStorage.setItem('mobile_employeeProfileColor', state.user.color);
        sessionStorage.setItem('mobile_loginTime', Date.now().toString());
        sessionStorage.setItem('mobile_isMobileApp', 'true');
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
      setIsChecking(false);
    });
    return () => unsubscribe();
  }, []);

  if (isChecking) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--primary-dark)'
      }}>
        <div className="loading-spinner" style={{ borderTopColor: 'white', borderColor: 'rgba(255,255,255,0.2)' }}></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Routes>
                <Route path="/" element={<Navigate to="/pos" replace />} />
                <Route path="/pos" element={<Pos />} />
                <Route path="/scanner" element={<Scanner />} />
                <Route path="/tasks" element={<Tasks />} />
                <Route path="/caja" element={<Caja />} />
                <Route path="/perfil" element={<Perfil />} />
                <Route path="/asistencia" element={<Asistencia />} />
              </Routes>
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;
