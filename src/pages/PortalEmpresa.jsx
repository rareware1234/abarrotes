import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useEmpresa } from '../context/EmpresaContext';
import { rgbHex } from '../data/formatos';
import { resolveTheme, THEMES, isLightBranded, resolveEmpresaLogo } from '../lib/empresaTheme';

// Portal de entrada para admin — port fiel de EmpresaPickerView.swift.
// El admin elige bajo qué empresa va a operar; el fondo muta al color de
// la empresa en hover/selección (como el lock screen de macOS).
export default function PortalEmpresa({ onSelect }) {
  const { empleado } = useAuth();
  const { empresas, setActiva } = useEmpresa();
  const [hoveredId, setHoveredId] = useState(null);
  const [pendingId, setPendingId] = useState(null);

  const focusId = pendingId || hoveredId;
  const focusEmp = empresas.find(e => e.id === focusId);
  const bg = focusEmp
    ? `linear-gradient(135deg, ${rgbHex(focusEmp, -0.18)} 0%, ${rgbHex(focusEmp, 0)} 100%)`
    : 'linear-gradient(135deg, #12141c 0%, #242633 100%)';

  const iniciales = (nombre) =>
    (nombre || '?').split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();

  const elegir = (emp) => {
    if (pendingId) return;
    setPendingId(emp.id);
    // Beat de 320ms para que se vea el feedback antes de entrar (igual que macOS).
    setTimeout(() => {
      setActiva(emp.id);
      onSelect?.(emp);
    }, 320);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1, background: bg,
      transition: 'background 0.45s ease-in-out',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '40px 40px', overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 60 }}>
        <div style={{ fontSize: 26, fontWeight: 800, color: '#fff', letterSpacing: -0.3 }}>
          ¿En cuál vas a operar?
        </div>
        <div style={{ fontSize: 14, fontWeight: 500, color: 'rgba(255,255,255,0.65)', marginTop: 8 }}>
          Selecciona la empresa para entrar a su panel.
        </div>
      </div>

      {/* Row de empresas */}
      <div style={{
        display: 'flex', gap: 40, overflowX: 'auto', maxWidth: '100%',
        padding: '30px 20px', scrollbarWidth: 'none',
      }}>
        {empresas.map(emp => {
          const isPending = pendingId === emp.id;
          const isHovered = hoveredId === emp.id;
          const scale = isPending ? 1.08 : (isHovered ? 1.04 : 1);
          const glow = isPending ? 28 : (isHovered ? 18 : 8);
          const color = rgbHex(emp, 0);
          const colorDark = rgbHex(emp, -0.18);
          const theme = resolveTheme(emp);
          const tokens = THEMES[theme];
          const isLight = isLightBranded(emp) || theme === 'elegantLight';
          const logoSrc = resolveEmpresaLogo(emp, isLight);
          const circleBg = theme === 'original'
            ? `linear-gradient(135deg, ${color} 0%, ${colorDark} 100%)`
            : tokens.cardGradient(emp);
          const ringColor = theme === 'neonParty' ? '#FF2E8C' : (theme === 'elegantLight' ? '#C6A052' : color);
          return (
            <button
              key={emp.id}
              onClick={() => elegir(emp)}
              onMouseEnter={() => setHoveredId(emp.id)}
              onMouseLeave={() => setHoveredId(h => (h === emp.id ? null : h))}
              disabled={!!pendingId}
              style={{
                background: 'none', border: 'none', cursor: pendingId ? 'default' : 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14,
                width: 170, flexShrink: 0, padding: 0,
              }}
            >
              <div style={{
                position: 'relative', width: 130, height: 130, borderRadius: '50%',
                background: circleBg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: theme === 'neonParty'
                  ? `0 6px ${glow}px ${ringColor}73, ${tokens.glow}`
                  : `0 6px ${glow}px ${ringColor}73`,
                transform: `scale(${scale})`,
                transition: 'transform 0.28s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.28s ease',
                border: `${isPending ? 3 : 1.5}px solid ${isPending || isHovered ? ringColor : 'rgba(255,255,255,0.35)'}`,
              }}>
                {logoSrc
                  ? <img src={logoSrc} alt="" style={{ width: 90, height: 90, objectFit: 'contain', borderRadius: '50%' }} />
                  : <span style={{ fontSize: 48, fontWeight: 800, color: isLight ? '#1B1B1B' : '#fff', letterSpacing: -1 }}>{iniciales(emp.nombre)}</span>
                }
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', lineHeight: 1.1 }}>{emp.nombre}</div>
                {emp.giro && (
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.65)', marginTop: 2 }}>{emp.giro}</div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <div style={{ textAlign: 'center', marginTop: 40 }}>
        {empleado && (
          <div style={{ fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.55)' }}>
            Conectado como {empleado.nombre}
          </div>
        )}
        <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: 0.8, color: 'rgba(255,255,255,0.35)', marginTop: 6 }}>
          Punto Verde · Tlalpan Studios
        </div>
      </div>
    </div>
  );
}
