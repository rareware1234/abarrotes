import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaUser, FaLock, FaSignInAlt, FaEye, FaEyeSlash, FaShieldAlt, FaCheck } from 'react-icons/fa';
import { loginWithEmail } from '../services/firebaseAuth';
import './Login.css';

const Login = () => {
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  const fromProtected = location.state?.from?.pathname;

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
        
        const redirectTo = fromProtected || '/dashboard';
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
    <div className="login-desktop-container">
      {/* Background Circles */}
      <div className="login-bg-circles">
        <div className="login-bg-circle login-bg-circle-1"></div>
        <div className="login-bg-circle login-bg-circle-2"></div>
        <div className="login-bg-circle login-bg-circle-3"></div>
        <div className="login-bg-circle login-bg-circle-4"></div>
        <div className="login-bg-circle login-bg-circle-5"></div>
        <div className="login-bg-circle login-bg-circle-6"></div>
      </div>

      {/* Lado izquierdo - Branding */}
      <div className="login-branding">
        <div className="login-branding-content">
          <div className="login-logo-container">
            <img 
              src="/src/assets/logo.png" 
              alt="Abarrotes Digitales" 
              className="login-logo-img"
            />
          </div>
          <h1 className="login-brand-title">Abarrotes Digitales</h1>
          <p className="login-subtitle">Sistema de Punto de Venta</p>
          
          <div className="login-features">
            <div className="login-feature-item">
              <span className="login-feature-check">
                <FaCheck />
              </span>
              <span>Ventas rápidas y eficientes</span>
            </div>
            <div className="login-feature-item">
              <span className="login-feature-check">
                <FaCheck />
              </span>
              <span>Inventario en tiempo real</span>
            </div>
            <div className="login-feature-item">
              <span className="login-feature-check">
                <FaCheck />
              </span>
              <span>Reportes detallados</span>
            </div>
          </div>
        </div>
      </div>

      {/* Lado derecho - Formulario */}
      <div className="login-form-side">
        <div className="login-form-container">
          <div className="login-form-header">
            <h2>Iniciar Sesión</h2>
            <p>Ingresa tus credenciales para continuar</p>
          </div>

          {error && (
            <div className="login-error-alert">
              <FaShieldAlt />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="login-form">
            {/* Campo de usuario */}
            <div className="login-field">
              <label htmlFor="employeeId">Número de Empleado</label>
              <div className="login-input-group">
                <span className="login-input-icon">
                  <FaUser />
                </span>
                <input
                  type="text"
                  id="employeeId"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value.toUpperCase())}
                  placeholder="Ej: EMP001"
                  required
                  autoFocus
                  autoComplete="username"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Campo de contraseña */}
            <div className="login-field">
              <label htmlFor="password">Contraseña</label>
              <div className="login-input-group">
                <span className="login-input-icon">
                  <FaLock />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  disabled={loading}
                />
                <button
                  type="button"
                  className="login-input-action"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            {/* Indicador de intentos */}
            {attempts > 0 && attempts < 3 && (
              <div className="login-attempts">
                Intentos: {attempts}/3
              </div>
            )}

            {/* Botón de login */}
            <button
              type="submit"
              className="login-submit-btn"
              disabled={loading || (lockoutUntil && Date.now() < lockoutUntil)}
            >
              {loading ? (
                <>
                  <span className="login-spinner"></span>
                  Verificando...
                </>
              ) : (
                <>
                  <FaSignInAlt />
                  Entrar al Sistema
                </>
              )}
            </button>
          </form>

          {/* Seguridad */}
          <div className="login-security">
            <FaShieldAlt />
            <span>Conexión segura con Firebase</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
