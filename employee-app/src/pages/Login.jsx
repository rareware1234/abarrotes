import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUser, FaLock, FaEye, FaEyeSlash, FaSignInAlt, FaShieldAlt, FaStore } from 'react-icons/fa';
import { loginWithEmail } from '../services/firebaseAuth';

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
  }, [lockoutUntil, attempts]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (lockoutUntil && Date.now() < lockoutUntil) return;
    if (!employeeId.trim() || !password.trim()) {
      setError('Ingresa tu usuario y contraseña');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await loginWithEmail(employeeId.trim().toUpperCase(), password);

      if (result.success) {
        setAttempts(0);
        sessionStorage.setItem('mobile_employeeId', result.user.id);
        sessionStorage.setItem('mobile_employeeName', result.user.nombre);
        sessionStorage.setItem('mobile_employeeProfile', result.user.profile);
        sessionStorage.setItem('mobile_employeeProfileColor', result.user.color);
        sessionStorage.setItem('mobile_loginTime', Date.now().toString());
        sessionStorage.setItem('mobile_isMobileApp', 'true');
        navigate('/', { replace: true });
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
      <div className="login-bg-shapes">
        <div className="login-shape login-shape-1"></div>
        <div className="login-shape login-shape-2"></div>
        <div className="login-shape login-shape-3"></div>
      </div>

      <div className="login-header">
        <div className="login-logo-wrap">
          <FaStore />
        </div>
        <h1 className="login-brand-name">Abarrotes Digitales</h1>
        <p className="login-brand-sub">App de Empleado</p>
      </div>

      <div className="login-form-area">
        <div className="login-card">
          <h2 className="login-card-title">Bienvenido</h2>
          <p className="login-card-sub">Ingresa tus credenciales para continuar</p>

          {error && (
            <div className="login-error">
              <FaShieldAlt />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="login-field">
              <label className="login-field-label">Número de Empleado</label>
              <div className="login-input-wrap">
                <span className="input-icon"><FaUser /></span>
                <input
                  type="text"
                  className="form-control"
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

            <div className="login-field">
              <label className="login-field-label">Contraseña</label>
              <div className="login-input-wrap">
                <span className="input-icon"><FaLock /></span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-control"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  disabled={loading}
                />
                <button
                  type="button"
                  className="input-action"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            {attempts > 0 && attempts < 3 && (
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', marginBottom: '12px' }}>
                Intentos: {attempts}/3
              </p>
            )}

            <button
              type="submit"
              className="login-submit"
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
                  Entrar
                </>
              )}
            </button>
          </form>

          <div className="login-security">
            <FaShieldAlt style={{ fontSize: '0.7rem' }} />
            <span>Conexión segura</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
