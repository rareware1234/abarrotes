import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUser, FaLock, FaSignInAlt, FaEye, FaEyeSlash, FaCheck } from 'react-icons/fa';
import { loginWithEmail } from '../services/firebaseAuth';
import logo from '../assets/logo.png';

const Login = () => {
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    document.body.classList.add('login-page-active');
    return () => document.body.classList.remove('login-page-active');
  }, []);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  useEffect(() => {
    if (lockoutUntil && Date.now() < lockoutUntil) {
      const remaining = Math.ceil((lockoutUntil - Date.now()) / 1000);
      setError(`Demasiados intentos. Espera ${remaining} segundos.`);
    } else {
      setLockoutUntil(null);
    }
  }, [lockoutUntil]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (lockoutUntil && Date.now() < lockoutUntil) {
      return;
    }

    if (!employeeId.trim() || !password.trim()) {
      setError('Por favor ingresa tu usuario y contraseña');
      return;
    }

    if (employeeId.length > 20 || password.length > 50) {
      setError('Datos inválidos');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await loginWithEmail(employeeId.trim(), password);

      if (result.success) {
        setAttempts(0);
        
        sessionStorage.setItem('desktop_employeeId', result.user.id);
        sessionStorage.setItem('desktop_employeeName', result.user.nombre);
        sessionStorage.setItem('desktop_employeeProfile', result.user.profile);
        sessionStorage.setItem('desktop_employeeProfileColor', result.user.color);
        sessionStorage.setItem('desktop_loginTime', Date.now().toString());
        sessionStorage.setItem('desktop_isDesktopApp', 'true');
        
        const redirectTo = '/';
        navigate(redirectTo, { replace: true });
      } else {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        
        if (newAttempts >= 3) {
          setLockoutUntil(Date.now() + 30000);
          setError('Demasiados intentos fallidos. Espera 30 segundos.');
        } else {
          setError('Usuario o contraseña incorrectos');
        }
      }
    } catch (err) {
      setError('Error de conexión. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* Panel Izquierdo - Branding (Desktop) */}
      <div className="login-brand-panel" style={{ alignItems: 'center', textAlign: 'center' }}>
        <img src={logo} alt="Abarrotes Digitales" style={{ maxWidth: '240px', filter: 'brightness(0) invert(1)' }} />
      </div>
      
      {/* Panel Derecho - Formulario */}
      <div className="login-form-panel">
        <div className="login-card">
          <img src={logo} alt="Abarrotes Digitales" className="login-logo-mobile" />
          <h2>Iniciar sesión</h2>
          <p>Bienvenido de vuelta</p>
          
          {error && (
            <div style={{ 
              background: '#fee2e2', 
              color: '#dc2626', 
              padding: '12px 16px', 
              borderRadius: '8px', 
              marginBottom: '20px',
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <i className="bi bi-exclamation-circle"></i>
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Número de Empleado</label>
              <div className="input-wrapper">
                <i className="bi bi-person input-icon"></i>
                <input
                  type="text"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value.toUpperCase())}
                  placeholder="Ej: EMP001"
                  required
                  disabled={loading}
                />
              </div>
            </div>
            
            <div className="form-group">
              <label>Contraseña</label>
              <div className="input-wrapper">
                <i className="bi bi-lock input-icon"></i>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>
            
            {attempts > 0 && attempts < 3 && (
              <div style={{ 
                textAlign: 'center', 
                color: '#f59e0b', 
                fontSize: '0.85rem',
                marginBottom: '16px'
              }}>
                Intentos: {attempts}/3
              </div>
            )}
            
            <button
              type="submit"
              className="btn-primary-custom w-100"
              disabled={loading || (lockoutUntil && Date.now() < lockoutUntil)}
              style={{ height: '50px', marginTop: '8px' }}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                  Verificando...
                </>
              ) : (
                <>
                  <FaSignInAlt />
                  Iniciar sesión
                </>
              )}
            </button>
          </form>
          
          <p className="login-footer">Abarrotes Digitales v1.0</p>
        </div>
      </div>
    </div>
  );
};

export default Login;