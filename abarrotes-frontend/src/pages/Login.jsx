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
  const navigate = useNavigate();
  const { signIn } = useAuth();

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
        localStorage.setItem('recordar_usuario', numEmpleado.trim());
        navigate('/', { replace: true });
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
    } catch (err) {
      setError('Error de conexión. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-desktop-container">
      <div className="login-bg-circles">
        <div className="login-bg-circle login-bg-circle-1"></div>
        <div className="login-bg-circle login-bg-circle-2"></div>
        <div className="login-bg-circle login-bg-circle-3"></div>
        <div className="login-bg-circle login-bg-circle-4"></div>
        <div className="login-bg-circle login-bg-circle-5"></div>
        <div className="login-bg-circle login-bg-circle-6"></div>
      </div>

      <div className="login-branding">
        <div className="login-branding-content">
          <div className="login-logo-container">
            <img src={logoBlanco} alt="PuntoVerde" className="login-logo-img" />
          </div>
          
          <h1 className="login-brand-title">Punto Verde POS</h1>
          <p className="login-subtitle">Tu tienda inteligente</p>
          
          <div className="login-features">
            <div className="login-feature-item">
              <div className="login-feature-check">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </div>
              <span>Punto de venta rápido y eficiente</span>
            </div>
            <div className="login-feature-item">
              <div className="login-feature-check">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </div>
              <span>Control de inventario en tiempo real</span>
            </div>
            <div className="login-feature-item">
              <div className="login-feature-check">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </div>
              <span>Reportes y analytics inteligentes</span>
            </div>
          </div>
          
          <p style={{ marginTop: '48px', color: 'rgba(255,255,255,0.35)', fontSize: '0.8rem' }}>
            v2.0 · 2025
          </p>
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
            <div className="login-error-alert">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              {error}
            </div>
          )}

          <form className="login-form" onSubmit={handleSubmit}>
            <div className="login-field">
              <label>Número de Empleado</label>
              <div className="login-input-group">
                <span className="login-input-icon">
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                </span>
                <input
                  type="text"
                  value={numEmpleado}
                  onChange={(e) => setNumEmpleado(e.target.value.toUpperCase())}
                  placeholder="EMP001"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="login-field">
              <label>Contraseña</label>
              <div className="login-input-group">
                <span className="login-input-icon">
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                </span>
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
                  className="login-input-action"
                  onClick={() => setShowPassword(!showPassword)}
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
              className="login-submit-btn"
              disabled={loading || (lockoutUntil && Date.now() < lockoutUntil)}
            >
              {loading ? (
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