import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import empleadoService from '../services/empleadoService';

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
};

const PerfilEmpleado = () => {
  const { empleado, signOut, roleTheme, hasPermission, updateEmpleadoFoto } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState('');
  const fileInputRef = useRef(null);

  if (!empleado) {
    return (
      <div style={{ textAlign: 'center', padding: '48px' }}>
        <div className="spinner-border"></div>
      </div>
    );
  }

  const isAdmin = empleado.rol === 'admin';
  const isManager = empleado.rol === 'manager';
  const initial = empleado.nombre ? empleado.nombre.charAt(0).toUpperCase() : '?';

  const getRoleLabel = (rol) => ({
    staff: 'Staff', manager: 'Manager', admin: 'Administrador'
  }[rol] || 'Empleado');

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar
    if (!file.type.startsWith('image/')) {
      setToast('Solo se permiten imágenes');
      setTimeout(() => setToast(''), 3000);
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setToast('La imagen no debe superar 5MB');
      setTimeout(() => setToast(''), 3000);
      return;
    }

    setUploading(true);
    const result = await empleadoService.uploadAvatar(empleado.uid, file);
    setUploading(false);

    if (result.success) {
      updateEmpleadoFoto(result.fotoUrl);
      setToast('Foto actualizada');
    } else {
      setToast('Error al subir la foto');
    }
    setTimeout(() => setToast(''), 3000);
    e.target.value = '';
  };

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <div>
      {/* Header con gradiente del rol */}
      <div style={{
        padding: '32px 24px', textAlign: 'center',
        background: `linear-gradient(135deg, ${roleTheme.dark}, ${roleTheme.primary})`,
        borderRadius: '16px', marginBottom: '20px', position: 'relative'
      }}>
        {/* Avatar con botón de cámara */}
        <div style={{ display: 'inline-block', marginBottom: '12px' }}>
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <div
              onClick={handleAvatarClick}
              style={{
                width: '90px', height: '90px', borderRadius: '50%',
                background: empleado.fotoUrl ? 'none' : 'rgba(255,255,255,0.15)',
                border: '3px solid rgba(255,255,255,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', overflow: 'hidden', position: 'relative'
              }}
            >
              {empleado.fotoUrl ? (
                <img src={empleado.fotoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ color: 'white', fontSize: '32px', fontWeight: 700 }}>{initial}</span>
              )}
              {uploading && (
                <div style={{
                  position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <div className="spinner-border spinner-border-sm" style={{ color: 'white' }}></div>
                </div>
              )}
            </div>
            <div
              onClick={handleAvatarClick}
              style={{
                position: 'absolute', bottom: '2px', right: '2px',
                width: '32px', height: '32px', borderRadius: '50%',
                background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.25)'
              }}
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke={roleTheme.primary} strokeWidth="2.5">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                <circle cx="12" cy="13" r="4"/>
              </svg>
            </div>
          </div>
          <div
            onClick={handleAvatarClick}
            style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px', marginTop: '8px', cursor: 'pointer' }}
          >
            {uploading ? 'Subiendo...' : 'Cambiar foto'}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
        </div>

        <h2 style={{ margin: '0 0 6px', fontSize: '22px', fontWeight: 700, color: 'white' }}>{empleado.nombre}</h2>
        <span style={{
          background: 'rgba(255,255,255,0.18)', color: 'white',
          padding: '4px 14px', borderRadius: '999px', fontSize: '12px', fontWeight: 600
        }}>
          {getRoleLabel(empleado.rol)}
        </span>
        <div style={{ marginTop: '8px', fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>
          {empleado.numEmpleado} · {empleado.email}
        </div>
      </div>

      {/* Métricas */}
      <div className="metrics-grid" style={{ marginBottom: '20px' }}>
        <div className="metric-card">
          <div className="metric-label">Ventas Hoy</div>
          <div style={{ fontSize: '22px', fontWeight: 700, color: roleTheme.primary }}>$0.00</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Tickets</div>
          <div style={{ fontSize: '22px', fontWeight: 700, color: roleTheme.primary }}>0</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Ticket Prom.</div>
          <div style={{ fontSize: '22px', fontWeight: 700, color: roleTheme.primary }}>$0.00</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Objetivo</div>
          <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--success, #10B981)' }}>—</div>
        </div>
      </div>

      {/* Actividad Reciente */}
      <div className="card" style={{ padding: '0', overflow: 'hidden', marginBottom: '20px' }}>
        <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border, #e5e7eb)' }}>
          <h5 style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>Actividad Reciente</h5>
        </div>
        {[
          { label: 'Inicio de sesión', time: 'Ahora' },
          { label: 'Turno activo', time: 'Hoy' },
        ].map((item, i, arr) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            padding: '12px 16px',
            borderBottom: i < arr.length - 1 ? '1px solid var(--border, #e5e7eb)' : 'none'
          }}>
            <div style={{
              width: '28px', height: '28px', borderRadius: '50%',
              background: roleTheme.tintedBg,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
            }}>
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke={roleTheme.primary} strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <span style={{ fontSize: '14px', flex: 1 }}>{item.label}</span>
            <span style={{ fontSize: '12px', color: '#9CA3AF' }}>{item.time}</span>
          </div>
        ))}
      </div>

      {/* Cerrar sesión */}
      <button
        onClick={handleLogout}
        style={{
          width: '100%', padding: '14px',
          background: 'rgba(230,57,70,0.06)', color: '#E63946',
          border: 'none', borderRadius: '12px',
          fontSize: '15px', fontWeight: 600, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
        }}
      >
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
          <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
        </svg>
        Cerrar Sesión
      </button>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)',
          background: 'var(--text-dark)', color: 'white',
          padding: '10px 20px', borderRadius: '10px', fontSize: '14px', fontWeight: 500,
          zIndex: 9999, boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
        }}>
          {toast}
        </div>
      )}
    </div>
  );
};

export default PerfilEmpleado;
