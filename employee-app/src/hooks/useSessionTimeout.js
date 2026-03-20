import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { logout } from '../services/firebaseAuth';

const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutos

export const useSessionTimeout = () => {
  const navigate = useNavigate();
  const timeoutRef = useRef(null);

  useEffect(() => {
    const checkSession = () => {
      // Verificar sesión móvil con prefijo
      const isMobileApp = sessionStorage.getItem('mobile_isMobileApp');
      const loginTime = sessionStorage.getItem('mobile_loginTime');
      
      if (isMobileApp === 'true' && loginTime) {
        const elapsed = Date.now() - parseInt(loginTime, 10);
        if (elapsed > SESSION_TIMEOUT) {
          // Sesión expirada
          logout();
          navigate('/login', { replace: true });
          return true;
        }
      }
      return false;
    };

    // Verificar al inicio
    if (checkSession()) return;

    // Reset timer on activity
    const resetTimer = () => {
      const isMobileApp = sessionStorage.getItem('mobile_isMobileApp');
      if (isMobileApp === 'true') {
        sessionStorage.setItem('mobile_loginTime', Date.now().toString());
      }
    };

    const events = ['mousedown', 'keydown', 'touchstart', 'scroll'];
    
    // Agregar event listeners
    events.forEach(event => {
      window.addEventListener(event, resetTimer, { passive: true });
    });

    // Verificar cada minuto
    const intervalId = setInterval(checkSession, 60000);

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, resetTimer);
      });
      clearInterval(intervalId);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [navigate]);
};

export default useSessionTimeout;
