import { useState } from 'react';
import { getAuth, updatePassword } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import logoBlanco from '../assets/logo-blanco.png';
import './CambioPassword.css';

export default function CambioPassword() {
  const { empleado, clearRequiereCambioPassword, roleTheme } = useAuth();
  const navigate = useNavigate();
  const [nueva, setNueva] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Only accessible when password change is required
  if (empleado && !empleado.requiereCambioPassword) {
    navigate('/perfil', { replace: true });
    return null;
  }

  const validLen = nueva.length >= 6;
  const match = nueva === confirmar && confirmar.length > 0;
  const canSave = validLen && match && !saving;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSave) return;
    setSaving(true);
    setError('');
    try {
      const auth = getAuth();
      await updatePassword(auth.currentUser, nueva);
      if (empleado?.uid) {
        await updateDoc(doc(db, 'empleados', empleado.uid), {
          requiereCambioPassword: false,
        });
      }
      clearRequiereCambioPassword();
    } catch (err) {
      if (err.code === 'auth/requires-recent-login') {
        setError('Tu sesión es antigua. Cierra sesión, inicia de nuevo y cambia la contraseña.');
      } else {
        setError('Error al cambiar contraseña: ' + err.message);
      }
    } finally {
      setSaving(false);
    }
  };

  const CheckRow = ({ ok, text }) => (
    <div className="cp-check-row">
      <i className={`bi ${ok ? 'bi-check-circle-fill' : 'bi-circle'} cp-check-icon ${ok ? 'ok' : ''}`} />
      <span className={ok ? 'ok' : ''}>{text}</span>
    </div>
  );

  return (
    <div className="cp-root">
      <div className="cp-bg" />

      <div className="cp-logo">
        <img src={logoBlanco} alt="Punto Verde" height={32} />
      </div>

      <div className="cp-card">
        <div className="cp-card-icon" style={{ background: `${roleTheme?.primary}22`, color: roleTheme?.primary }}>
          <i className="bi bi-lock-fill" style={{ fontSize: 26 }} />
        </div>

        <h2 className="cp-title">Cambiar Contraseña</h2>
        <p className="cp-subtitle">
          Por seguridad, establece una nueva contraseña para tu cuenta
        </p>

        <form onSubmit={handleSubmit} className="cp-form">
          {/* Nueva contraseña */}
          <div className="cp-field">
            <label className="cp-label">Nueva contraseña</label>
            <div className={`cp-input-wrap ${nueva && (validLen ? 'ok' : 'err')}`}>
              <i className="bi bi-lock cp-input-icon" />
              {showPwd
                ? <input type="text" className="cp-input" placeholder="Mínimo 6 caracteres" value={nueva} onChange={e => setNueva(e.target.value)} autoFocus />
                : <input type="password" className="cp-input" placeholder="Mínimo 6 caracteres" value={nueva} onChange={e => setNueva(e.target.value)} autoFocus />
              }
              <button type="button" className="cp-eye" onClick={() => setShowPwd(v => !v)}>
                <i className={`bi ${showPwd ? 'bi-eye-slash' : 'bi-eye'}`} />
              </button>
            </div>
            {nueva && !validLen && <p className="cp-hint err">La contraseña debe tener al menos 6 caracteres</p>}
          </div>

          {/* Confirmar */}
          <div className="cp-field">
            <label className="cp-label">Confirmar contraseña</label>
            <div className={`cp-input-wrap ${confirmar && (match ? 'ok' : 'err')}`}>
              <i className="bi bi-lock cp-input-icon" />
              {showConfirm
                ? <input type="text" className="cp-input" placeholder="Repite la contraseña" value={confirmar} onChange={e => setConfirmar(e.target.value)} />
                : <input type="password" className="cp-input" placeholder="Repite la contraseña" value={confirmar} onChange={e => setConfirmar(e.target.value)} />
              }
              <button type="button" className="cp-eye" onClick={() => setShowConfirm(v => !v)}>
                <i className={`bi ${showConfirm ? 'bi-eye-slash' : 'bi-eye'}`} />
              </button>
            </div>
            {confirmar && !match && <p className="cp-hint err">Las contraseñas no coinciden</p>}
          </div>

          {/* Checklist */}
          <div className="cp-checks">
            <CheckRow ok={validLen} text="Mínimo 6 caracteres" />
            <CheckRow ok={match} text="Las contraseñas coinciden" />
          </div>

          {/* Error */}
          {error && (
            <div className="cp-error">
              <i className="bi bi-exclamation-triangle-fill" />
              <span>{error}</span>
            </div>
          )}

          {/* Botón */}
          <button type="submit" className="cp-btn" disabled={!canSave}
            style={{ background: canSave ? `linear-gradient(135deg, ${roleTheme?.primaryDark || '#155d33'}, ${roleTheme?.primary || 'var(--role-primary)'})` : undefined }}>
            {saving
              ? <span className="cp-spinner" />
              : <><span>Establecer Contraseña</span><i className="bi bi-arrow-right" /></>
            }
          </button>
        </form>
      </div>

      <p className="cp-footer">PuntoVerde POS · Cambio de contraseña obligatorio</p>
    </div>
  );
}
