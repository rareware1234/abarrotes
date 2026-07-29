import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import logoBlanco from '../assets/logo-blanco.png';
import logoColor from '../assets/logo-color.png';
import './Login.css';

const Login = () => {
  const [numEmpleado, setNumEmpleado] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState(null);
  const [notice, setNotice] = useState('');   // mensaje informativo (ej. recuperación enviada)
  const [success, setSuccess] = useState(false); // estado de éxito antes de navegar
  const navigate = useNavigate();
  const { signIn, resetPassword } = useAuth();

  useEffect(() => {
    const savedNumEmpleado = localStorage.getItem('recordar_usuario');
    if (savedNumEmpleado) {
      setNumEmpleado(savedNumEmpleado);
    }
  }, []);

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

  const handleForgotPassword = async () => {
    setError('');
    setNotice('');
    const result = await resetPassword(numEmpleado);
    if (result.success) {
      setNotice('Si el número existe, te enviamos un correo para restablecer tu contraseña.');
    } else {
      setError(result.error || 'No se pudo iniciar la recuperación.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (lockoutUntil && Date.now() < lockoutUntil) {
      return;
    }

    if (!numEmpleado.trim() || !password.trim()) {
      setError('Por favor ingresa tu número de empleado y contraseña');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await signIn(numEmpleado.trim(), password);

      if (result.success) {
        setAttempts(0);
        setSuccess(true);
        localStorage.setItem('recordar_usuario', numEmpleado.trim());
        // Breve estado "success" (check) antes de navegar — feedback visual.
        setTimeout(() => navigate('/', { replace: true }), 450);
      } else {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        
        if (newAttempts >= 3) {
          setLockoutUntil(Date.now() + 30000);
          setError('Demasiados intentos fallidos. Espera 30 segundos.');
        } else {
          setError(result.error || 'Número de empleado o contraseña incorrectos');
        }
      }
    } catch {
      setError('Error de conexión. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-desktop-container">
      <div className="login-branding">
        <div className="login-branding-content">
          <img src={logoBlanco} alt="PuntoVerde" style={{ height: '55px', objectFit: 'contain' }} />
        </div>
      </div>

      <div className="login-form-side">
        <div className="login-form-container">
          <div className="login-form-header">
            <img src={logoColor} alt="PuntoVerde" style={{ width: '80px', marginBottom: '24px', display: 'none' }} className="mobile-logo" />
            <h2>Bienvenido</h2>
            <p>Ingresa tus credenciales para continuar</p>
          </div>

          {error && (
            <div className="login-error-alert" role="alert" aria-live="assertive">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              {error}
            </div>
          )}

          {notice && (
            <div className="login-notice-alert" role="status" aria-live="polite">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
              {notice}
            </div>
          )}

          <form className="login-form" onSubmit={handleSubmit} noValidate>
            <div className="login-field">
              <label htmlFor="login-num">Número de Empleado</label>
              <div className="login-input-group">
                <span className="login-input-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                </span>
                <input
                  id="login-num"
                  name="numEmpleado"
                  type="text"
                  autoComplete="username"
                  autoCapitalize="characters"
                  value={numEmpleado}
                  onChange={(e) => setNumEmpleado(e.target.value.toUpperCase())}
                  placeholder="EMP001"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="login-field">
              <label htmlFor="login-pass">Contraseña</label>
              <div className="login-input-group">
                <span className="login-input-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                </span>
                <input
                  id="login-pass"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  className="login-input-action"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            {attempts > 0 && attempts < 3 && (
              <div className="login-attempts">
                Intentos: {attempts}/3
              </div>
            )}

            <button
              type="submit"
              className={`login-submit-btn${success ? ' is-success' : ''}`}
              disabled={loading || success || (lockoutUntil && Date.now() < lockoutUntil)}
              aria-busy={loading}
            >
              {success ? (
                <>
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  Entrando…
                </>
              ) : loading ? (
                <div className="login-spinner"></div>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
                    <polyline points="10 17 15 12 10 7"></polyline>
                    <line x1="15" y1="12" x2="3" y2="12"></line>
                  </svg>
                  Iniciar sesión
                </>
              )}
            </button>

            <button
              type="button"
              className="login-forgot"
              onClick={handleForgotPassword}
              disabled={loading || success}
            >
              ¿Olvidaste tu contraseña?
            </button>
          </form>

          <div className="login-security">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
            </svg>
            Conexión segura · Punto Verde
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;