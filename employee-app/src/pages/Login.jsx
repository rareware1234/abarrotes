import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaUser, FaLock, FaSignInAlt, FaEye, FaEyeSlash, FaShieldAlt, FaCheck, FaTimes } from 'react-icons/fa';
import { loginWithEmail } from '../services/firebaseAuth';

const Login = () => {
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState(null);
  const [isFocused, setIsFocused] = useState({ employeeId: false, password: false });
  const navigate = useNavigate();
  const location = useLocation();
  const passwordRef = useRef(null);

  const fromProtected = location.state?.from?.pathname;
  const isDesktop = window.innerWidth >= 1024;

  useEffect(() => {
    const stored = sessionStorage.getItem('mobile_employeeId');
    if (stored) {
      navigate('/pos', { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    let interval;
    if (lockoutUntil) {
      interval = setInterval(() => {
        if (Date.now() >= lockoutUntil) {
          setLockoutUntil(null);
          setAttempts(0);
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [lockoutUntil]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (lockoutUntil && Date.now() < lockoutUntil) return;

    if (!employeeId.trim() || !password.trim()) {
      setError('Por favor, completa todos los campos');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await loginWithEmail(employeeId.trim(), password);

      if (result.success) {
        setAttempts(0);
        
        sessionStorage.setItem('mobile_employeeId', result.user.id);
        sessionStorage.setItem('mobile_employeeName', result.user.nombre);
        sessionStorage.setItem('mobile_employeeProfile', result.user.profile);
        sessionStorage.setItem('mobile_employeeProfileColor', result.user.color);
        sessionStorage.setItem('mobile_loginTime', Date.now().toString());
        sessionStorage.setItem('mobile_isMobileApp', 'true');
        
        navigate(fromProtected || '/pos', { replace: true });
      } else {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        
        if (newAttempts >= 3) {
          setLockoutUntil(Date.now() + 30000);
          setError('Demasiados intentos fallidos. Espera 30 segundos.');
        } else {
          setError(`Usuario o contraseña incorrectos (${3 - newAttempts} intentos restantes)`);
        }
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Error de conexión. Verifica tu red.');
    } finally {
      setLoading(false);
    }
  };

  const getLockoutTime = () => {
    if (!lockoutUntil) return '';
    const seconds = Math.ceil((lockoutUntil - Date.now()) / 1000);
    return `${seconds}s`;
  };

  return (
    <div className="login-wrapper">
      {/* Background Circles - Now for both mobile and desktop */}
      <div className="bg-decoration">
        <div className="circle circle-1"></div>
        <div className="circle circle-2"></div>
        <div className="circle circle-3"></div>
        <div className="circle circle-4"></div>
        <div className="circle circle-5"></div>
      </div>

      {/* Desktop Left Panel */}
      {isDesktop && (
        <motion.div 
          className="login-branding"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="branding-content">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <img src="/src/assets/logo.png" alt="Abarrotes Digitales" className="branding-logo" />
            </motion.div>
            <motion.h1
              className="branding-title"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              Abarrotes Digitales
            </motion.h1>
            <motion.p
              className="branding-subtitle"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              Sistema de Punto de Venta
            </motion.p>
            <motion.div
              className="branding-features"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.5 }}
            >
              <div className="feature-item">
                <FaCheck className="feature-icon" />
                <span>Ventas rápidas y eficientes</span>
              </div>
              <div className="feature-item">
                <FaCheck className="feature-icon" />
                <span>Inventario en tiempo real</span>
              </div>
              <div className="feature-item">
                <FaCheck className="feature-icon" />
                <span>Reportes detallados</span>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}

      {/* Login Form */}
      <motion.div 
        className="login-main"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        <motion.div 
          className="login-card"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: isDesktop ? 0.2 : 0 }}
        >
          {/* Mobile Header */}
          {!isDesktop && (
            <motion.div 
              className="mobile-header"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <img src="/src/assets/logo.png" alt="Abarrotes Digitales" className="mobile-logo" />
              <h1 className="mobile-title">Abarrotes Digitales</h1>
              <p className="mobile-subtitle">Accede a tu estación de trabajo</p>
            </motion.div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="login-form">
            <motion.div
              className={`input-group ${isFocused.employeeId ? 'focused' : ''} ${employeeId ? 'has-value' : ''}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="input-icon-wrapper">
                <FaUser className="input-icon" />
              </div>
              <input
                type="text"
                id="employeeId"
                className="modern-input"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value.toUpperCase())}
                onFocus={() => setIsFocused({ ...isFocused, employeeId: true })}
                onBlur={() => setIsFocused({ ...isFocused, employeeId: false })}
                placeholder=" "
                required
                autoComplete="username"
                disabled={loading}
              />
              <label htmlFor="employeeId" className="floating-label">Número de Empleado</label>
            </motion.div>

            <motion.div
              className={`input-group ${isFocused.password ? 'focused' : ''} ${password ? 'has-value' : ''}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="input-icon-wrapper">
                <FaLock className="input-icon" />
              </div>
              <input
                ref={passwordRef}
                type={showPassword ? 'text' : 'password'}
                id="password"
                className="modern-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setIsFocused({ ...isFocused, password: true })}
                onBlur={() => setIsFocused({ ...isFocused, password: false })}
                placeholder=" "
                required
                autoComplete="current-password"
                disabled={loading}
              />
              <label htmlFor="password" className="floating-label">Contraseña</label>
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </motion.div>

            <motion.div 
              className="form-options"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <label className="remember-me">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span className="checkbox-custom"></span>
                <span className="checkbox-label">Recordar sesión</span>
              </label>
              <a href="#" className="forgot-password">¿Olvidaste tu contraseña?</a>
            </motion.div>

            <AnimatePresence>
              {error && (
                <motion.div
                  className="error-alert"
                  initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                  animate={{ opacity: 1, height: 'auto', marginBottom: 16 }}
                  exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                >
                  <FaTimes className="error-icon" />
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button
              type="submit"
              className={`submit-button ${loading ? 'loading' : ''}`}
              disabled={loading || (lockoutUntil && Date.now() < lockoutUntil)}
              whileHover={{ scale: lockoutUntil ? 1 : 1.02 }}
              whileTap={{ scale: lockoutUntil ? 1 : 0.98 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              {loading ? (
                <span className="loader"></span>
              ) : lockoutUntil ? (
                <span className="lockout-text">Espera {getLockoutTime()}</span>
              ) : (
                <>
                  <span>Iniciar Sesión</span>
                  <FaSignInAlt />
                </>
              )}
            </motion.button>
          </form>

          <motion.div 
            className="login-footer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <FaShieldAlt />
            <span>Conexión segura</span>
          </motion.div>
        </motion.div>
      </motion.div>

      <style>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        .login-wrapper {
          min-height: 100vh;
          display: flex;
          background: linear-gradient(135deg, #0d5c36 0%, #1e7f5c 50%, #0a3d25 100%);
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          position: relative;
          overflow: hidden;
        }

        /* Background Circles */
        .bg-decoration {
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 0;
        }

        .circle {
          position: absolute;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 50%, transparent 70%);
          border: 1px solid rgba(255,255,255,0.1);
        }

        .circle-1 {
          width: 500px;
          height: 500px;
          top: -150px;
          right: -150px;
          animation: float1 8s ease-in-out infinite;
        }

        .circle-2 {
          width: 350px;
          height: 350px;
          bottom: -100px;
          left: -100px;
          animation: float2 10s ease-in-out infinite;
        }

        .circle-3 {
          width: 200px;
          height: 200px;
          top: 50%;
          left: 20%;
          transform: translateY(-50%);
          animation: float3 12s ease-in-out infinite;
        }

        .circle-4 {
          width: 150px;
          height: 150px;
          bottom: 20%;
          right: 10%;
          animation: float1 6s ease-in-out infinite reverse;
        }

        .circle-5 {
          width: 100px;
          height: 100px;
          top: 30%;
          left: 10%;
          animation: float2 8s ease-in-out infinite reverse;
        }

        @keyframes float1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(20px, -20px) scale(1.05); }
        }

        @keyframes float2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-15px, 15px) scale(1.03); }
        }

        @keyframes float3 {
          0%, 100% { transform: translateY(-50%) scale(1); }
          50% { transform: translateY(-50%) translateY(-10px) scale(1.02); }
        }

        /* Desktop Branding */
        .login-branding {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          padding: 60px;
          z-index: 1;
        }

        .branding-content {
          position: relative;
          z-index: 2;
          text-align: center;
          max-width: 480px;
        }

        .branding-logo {
          width: 140px;
          height: 140px;
          margin-bottom: 32px;
          filter: drop-shadow(0 20px 40px rgba(0,0,0,0.3));
        }

        .branding-title {
          font-size: 2.5rem;
          font-weight: 700;
          color: white;
          margin-bottom: 12px;
          letter-spacing: -1px;
        }

        .branding-subtitle {
          font-size: 1.25rem;
          color: rgba(255,255,255,0.8);
          margin-bottom: 48px;
        }

        .branding-features {
          text-align: left;
        }

        .feature-item {
          display: flex;
          align-items: center;
          gap: 16px;
          color: white;
          font-size: 1.1rem;
          margin-bottom: 20px;
          opacity: 0.9;
        }

        .feature-icon {
          width: 28px;
          height: 28px;
          background: rgba(255,255,255,0.2);
          border-radius: 50%;
          padding: 6px;
          flex-shrink: 0;
        }

        /* Login Main */
        .login-main {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px 20px;
          min-height: 100vh;
          position: relative;
          z-index: 1;
        }

        @media (min-width: 1024px) {
          .login-main {
            flex: 1;
            padding: 60px;
          }
        }

        /* Login Card */
        .login-card {
          width: 100%;
          max-width: 420px;
          background: rgba(255,255,255,0.05);
          backdrop-filter: blur(20px);
          border-radius: 24px;
          padding: 40px 30px;
          border: 1px solid rgba(255,255,255,0.1);
        }

        @media (min-width: 1024px) {
          .login-card {
            max-width: 400px;
          }
        }

        /* Mobile Header */
        .mobile-header {
          text-align: center;
          margin-bottom: 32px;
        }

        .mobile-logo {
          width: 80px;
          height: 80px;
          margin-bottom: 16px;
          filter: drop-shadow(0 10px 30px rgba(0,0,0,0.2));
        }

        .mobile-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: white;
          margin-bottom: 4px;
        }

        .mobile-subtitle {
          font-size: 0.9rem;
          color: rgba(255,255,255,0.7);
        }

        /* Form */
        .login-form {
          margin-bottom: 24px;
        }

        .input-group {
          position: relative;
          margin-bottom: 20px;
        }

        .input-icon-wrapper {
          position: absolute;
          left: 16px;
          top: 50%;
          transform: translateY(-50%);
          z-index: 2;
          pointer-events: none;
          transition: all 0.3s ease;
        }

        .input-icon {
          color: rgba(255,255,255,0.5);
          font-size: 1rem;
          transition: color 0.3s ease;
        }

        .input-group.focused .input-icon {
          color: #1e7f5c;
        }

        .modern-input {
          width: 100%;
          padding: 18px 50px 18px 48px;
          font-size: 1rem;
          background: rgba(255,255,255,0.08);
          border: 2px solid rgba(255,255,255,0.1);
          border-radius: 14px;
          color: white;
          outline: none;
          transition: all 0.3s ease;
        }

        .modern-input::placeholder {
          color: transparent;
        }

        .modern-input:focus {
          background: rgba(255,255,255,0.12);
          border-color: #1e7f5c;
          box-shadow: 0 0 0 4px rgba(30, 127, 92, 0.2);
        }

        .floating-label {
          position: absolute;
          left: 48px;
          top: 50%;
          transform: translateY(-50%);
          color: rgba(255,255,255,0.5);
          font-size: 1rem;
          pointer-events: none;
          transition: all 0.3s ease;
          background: transparent;
        }

        .modern-input:focus ~ .floating-label,
        .modern-input:not(:placeholder-shown) ~ .floating-label {
          top: 8px;
          transform: translateY(0);
          font-size: 0.75rem;
          color: #1e7f5c;
          left: 48px;
        }

        .toggle-password {
          position: absolute;
          right: 14px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: rgba(255,255,255,0.5);
          cursor: pointer;
          padding: 8px;
          transition: color 0.3s ease;
        }

        .toggle-password:hover {
          color: rgba(255,255,255,0.8);
        }

        /* Form Options */
        .form-options {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .remember-me {
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          color: rgba(255,255,255,0.7);
          font-size: 0.85rem;
        }

        .remember-me input {
          display: none;
        }

        .checkbox-custom {
          width: 18px;
          height: 18px;
          border: 2px solid rgba(255,255,255,0.3);
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
        }

        .remember-me input:checked + .checkbox-custom {
          background: #1e7f5c;
          border-color: #1e7f5c;
        }

        .remember-me input:checked + .checkbox-custom::after {
          content: '✓';
          color: white;
          font-size: 0.7rem;
          font-weight: bold;
        }

        .forgot-password {
          color: rgba(255,255,255,0.7);
          text-decoration: none;
          font-size: 0.85rem;
          transition: color 0.3s ease;
        }

        .forgot-password:hover {
          color: white;
        }

        /* Error Alert */
        .error-alert {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 14px;
          background: rgba(239, 68, 68, 0.2);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: 10px;
          color: #fca5a5;
          font-size: 0.85rem;
          margin-bottom: 16px;
        }

        .error-icon {
          flex-shrink: 0;
        }

        /* Submit Button */
        .submit-button {
          width: 100%;
          padding: 16px;
          font-size: 1rem;
          font-weight: 600;
          color: white;
          background: linear-gradient(135deg, #1e7f5c 0%, #0d5c36 100%);
          border: none;
          border-radius: 14px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(30, 127, 92, 0.4);
        }

        .submit-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(30, 127, 92, 0.5);
        }

        .submit-button.loading {
          opacity: 0.9;
        }

        .submit-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .loader {
          width: 20px;
          height: 20px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        .lockout-text {
          font-size: 0.9rem;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* Footer */
        .login-footer {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          color: rgba(255,255,255,0.4);
          font-size: 0.75rem;
        }

        .login-footer svg {
          font-size: 0.7rem;
        }

        /* Mobile Responsive */
        @media (max-width: 480px) {
          .circle-1 {
            width: 300px;
            height: 300px;
            top: -100px;
            right: -100px;
          }

          .circle-2 {
            width: 200px;
            height: 200px;
            bottom: -50px;
            left: -50px;
          }

          .circle-3 {
            width: 120px;
            height: 120px;
          }

          .circle-4, .circle-5 {
            display: none;
          }

          .login-card {
            padding: 30px 20px;
            backdrop-filter: blur(10px);
          }

          .mobile-header {
            margin-bottom: 24px;
          }

          .mobile-logo {
            width: 70px;
            height: 70px;
          }

          .input-group {
            margin-bottom: 16px;
          }

          .form-options {
            flex-direction: column;
            gap: 12px;
            align-items: flex-start;
          }

          .submit-button {
            padding: 14px;
          }
        }
      `}</style>
    </div>
  );
};

export default Login;
