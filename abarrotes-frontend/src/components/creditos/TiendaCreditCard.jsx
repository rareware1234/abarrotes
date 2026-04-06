import React from 'react';
import { calcularSaludTienda } from '../../hooks/useCreditoDashboard';

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
};

const FORMATO_GRADIENTS = {
  puntoVerde: 'linear-gradient(135deg, #0F4D2E, #1A7A48)',
  puntoVerdeGo: 'linear-gradient(135deg, #1E3A5F, #2563EB)',
  puntoVerdeXL: 'linear-gradient(135deg, #4C1D95, #7C3AED)'
};

const FORMATO_BADGES = {
  puntoVerde: 'PV',
  puntoVerdeGo: 'GO',
  puntoVerdeXL: 'XL'
};

const SALUD_CONFIG = {
  saludable: { color: '#10B981', label: 'Saludable' },
  enRiesgo: { color: '#F59E0B', label: 'En Riesgo' },
  critico: { color: '#EF4444', label: 'Crítico' }
};

const TiendaCreditCard = ({ tienda, creditos, onClick }) => {
  const salud = calcularSaludTienda(creditos);
  const saludConfig = SALUD_CONFIG[salud];
  
  const activos = creditos.filter(c => c.estado === 'activo');
  const vencidos = creditos.filter(c => c.estado === 'vencido');
  const porVencer = activos.filter(c => {
    if (!c.fechaVencimiento) return false;
    const vencimiento = c.fechaVencimiento.toDate ? c.fechaVencimiento.toDate() : new Date(c.fechaVencimiento);
    const dias = Math.ceil((vencimiento - new Date()) / (1000 * 60 * 60 * 24));
    return dias >= 0 && dias <= 7;
  });

  const carteraTotal = activos.reduce((sum, c) => sum + (c.montoAprobado || 0), 0);
  const montoUsado = activos.reduce((sum, c) => sum + (c.montoUsado || 0), 0);
  const porcentajeUso = carteraTotal > 0 ? (montoUsado / carteraTotal) * 100 : 0;

  const formato = tienda.formato?.toLowerCase() || 'puntoverdev';
  const gradient = FORMATO_GRADIENTS[formato] || FORMATO_GRADIENTS.puntoVerde;
  const badgeLabel = FORMATO_BADGES[formato] || formato.substring(0, 2).toUpperCase();

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const getUsoColor = (pct) => {
    if (pct > 75) return '#EF4444';
    if (pct > 50) return '#F59E0B';
    return '#10B981';
  };

  const alertas = [];
  if (vencidos.length > 0) {
    alertas.push({ type: 'critico', text: `${vencidos.length} crédito${vencidos.length > 1 ? 's' : ''} vencidos` });
  }
  if (porVencer.length > 0) {
    const dias = porVencer.map(c => {
      const v = c.fechaVencimiento.toDate ? c.fechaVencimiento.toDate() : new Date(c.fechaVencimiento);
      return Math.ceil((v - new Date()) / (1000 * 60 * 60 * 24));
    });
    const minDias = Math.min(...dias);
    alertas.push({ type: 'warning', text: `${porVencer.length} vence${porVencer.length > 1 ? 'n' : ''} en ${minDias} día${minDias > 1 ? 's' : ''}` });
  }

  return (
    <div 
      className="tienda-credit-card" 
      onClick={() => onClick && onClick(tienda.id)}
      style={{ 
        background: 'white', 
        borderRadius: '14px', 
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.2s, box-shadow 0.2s'
      }}
      onMouseEnter={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
        }
      }}
      onMouseLeave={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
        }
      }}
    >
      <div 
        className="tienda-card-header"
        style={{ 
          background: gradient,
          padding: '20px',
          height: '100px',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '1px' }}>
            {tienda.formato || 'Punto Verde'}
          </div>
          <div style={{ color: 'white', fontSize: '15px', fontWeight: 600 }}>
            {tienda.nombre}
          </div>
        </div>
        
        <div 
          style={{ 
            position: 'absolute',
            bottom: '8px',
            right: '12px',
            background: 'rgba(255,255,255,0.18)',
            color: 'white',
            padding: '3px 8px',
            borderRadius: '12px',
            fontSize: '10px',
            fontWeight: 700,
            letterSpacing: '1px'
          }}
        >
          {badgeLabel}
        </div>
      </div>

      <div 
        style={{ 
          padding: '12px 16px',
          background: `${saludConfig.color}15`,
          borderLeft: `3px solid ${saludConfig.color}`,
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}
      >
        <div style={{ 
          width: '8px', 
          height: '8px', 
          borderRadius: '50%', 
          background: saludConfig.color 
        }} />
        <span style={{ fontSize: '13px', fontWeight: 600, color: saludConfig.color }}>
          {saludConfig.label}
        </span>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr', 
        gap: '12px',
        padding: '16px'
      }}>
        <div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '2px' }}>Créditos activos</div>
          <div style={{ fontSize: '20px', fontWeight: 700 }}>{activos.length}</div>
        </div>
        <div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '2px' }}>Cartera</div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--role-primary)' }}>
            {formatCurrency(carteraTotal)}
          </div>
        </div>
        <div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '2px' }}>En uso</div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: getUsoColor(porcentajeUso) }}>
            {Math.round(porcentajeUso)}%
          </div>
        </div>
        <div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '2px' }}>Vencidos</div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: vencidos.length > 0 ? '#EF4444' : '#10B981' }}>
            {vencidos.length}
          </div>
        </div>
      </div>

      <div style={{ padding: '0 16px 12px' }}>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Uso de cartera</div>
        <div style={{ 
          height: '6px', 
          background: '#E5E7EB', 
          borderRadius: '999px',
          overflow: 'hidden'
        }}>
          <div style={{ 
            height: '100%', 
            width: `${Math.min(porcentajeUso, 100)}%`, 
            background: getUsoColor(porcentajeUso),
            borderRadius: '999px',
            transition: 'width 0.3s'
          }} />
        </div>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
          {formatCurrency(montoUsado)} usado de {formatCurrency(carteraTotal)} · {Math.round(porcentajeUso)}%
        </div>
      </div>

      {alertas.length > 0 && (
        <div style={{ 
          padding: '12px 16px',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px'
        }}>
          {alertas.slice(0, 2).map((alerta, idx) => (
            <div key={idx} style={{ fontSize: '12px' }}>
              <span>{alerta.type === 'critico' ? '🔴' : '🟡'}</span>{' '}
              <span style={{ color: alerta.type === 'critico' ? '#EF4444' : '#F59E0B' }}>{alerta.text}</span>
            </div>
          ))}
        </div>
      )}

      <div style={{ 
        padding: '12px 16px',
        borderTop: '1px solid var(--border)',
        background: '#FAFAFA',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ 
            width: '28px', 
            height: '28px', 
            borderRadius: '50%', 
            background: 'var(--role-tinted-bg)',
            color: 'var(--role-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '10px',
            fontWeight: 600
          }}>
            {getInitials(tienda.responsable)}
          </div>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            {tienda.responsable || 'Sin encargado'}
          </span>
        </div>
        <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--role-primary)', cursor: 'pointer' }}>
          Ver detalle →
        </span>
      </div>
    </div>
  );
};

export default TiendaCreditCard;
