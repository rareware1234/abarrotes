import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/logo.png';

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
    <div className="login-page">
      <div className="login-brand-panel" style={{ alignItems: 'center', textAlign: 'center' }}>
        <img src={logo} alt="PuntoVerde" style={{ maxWidth: '240px', filter: 'brightness(0) invert(1)' }} />
      </div>
      
      <div className="login-form-panel">
        <div className="login-card">
          <img src={logo} alt="PuntoVerde" className="login-logo-mobile" />
          <h2>Iniciar sesión</h2>
          <p>Bienvenido a PuntoVerde</p>
          
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
                  value={numEmpleado}
                  onChange={(e) => setNumEmpleado(e.target.value.toUpperCase())}
                  placeholder="Ej: 001"
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
                  <i className="bi bi-box-arrow-in-right me-2"></i>
                  Iniciar sesión
                </>
              )}
            </button>
          </form>
          
          <p className="login-footer">PuntoVerde v2.0</p>
        </div>
      </div>
    </div>
  );
};

export default Login;