import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import useCreditoDashboard from '../hooks/useCreditoDashboard';
import TiendaCreditCard from '../components/creditos/TiendaCreditCard';
import TiendaCreditDetailModal from '../components/creditos/TiendaCreditDetailModal';
import StatCard from '../components/StatCard';

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
};

const CreditoDashboard = () => {
  const { empleado } = useAuth();
  const { tiendas, creditosPorTienda, kpis, loading, error, lastUpdated, refresh } = useCreditoDashboard();
  const [selectedTienda, setSelectedTienda] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const tieneTiendasAsignadas = empleado?.rol === 'manager' ? tiendas.length > 0 : true;

  const handleTiendaClick = (tiendaId) => {
    setSelectedTienda(tiendas.find(t => t.id === tiendaId));
    setShowDetailModal(true);
  };

  const formatLastUpdated = () => {
    if (!lastUpdated) return '';
    const minutos = Math.floor((new Date() - lastUpdated) / 60000);
    if (minutos < 1) return 'hace un momento';
    if (minutos === 1) return 'hace 1 min';
    return `hace ${minutos} min`;
  };

  const getUsoColor = (pct) => {
    if (pct > 70) return '#EF4444';
    if (pct < 50) return '#10B981';
    return '#F59E0B';
  };

  const getCumplimientoColor = (pct) => {
    if (pct > 80) return '#10B981';
    if (pct >= 60) return '#F59E0B';
    return '#EF4444';
  };

  if (loading) {
    return (
      <div style={{ padding: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="stat-card skeleton">
              <div className="skeleton-icon"></div>
              <div className="skeleton-text"></div>
              <div className="skeleton-value"></div>
            </div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{ height: '280px', background: '#f3f4f6', borderRadius: '14px', animation: 'pulse 2s infinite' }} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '24px' }}>
        <div style={{ 
          padding: '16px', 
          background: '#FEE2E2', 
          border: '1px solid #EF4444', 
          borderRadius: '8px',
          color: '#EF4444'
        }}>
          <div style={{ fontWeight: 600, marginBottom: '8px' }}>Error al cargar datos</div>
          <div style={{ marginBottom: '12px' }}>{error}</div>
          <button 
            onClick={refresh}
            style={{ 
              padding: '8px 16px', 
              background: '#EF4444', 
              color: 'white', 
              border: 'none', 
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="credito-dashboard">
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'flex-start',
        marginBottom: '24px',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 700 }}>Salud del Crédito</h1>
          <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '14px' }}>
            Visión por sucursal · actualizado {formatLastUpdated()}
          </p>
        </div>
        <button 
          onClick={refresh}
          style={{ 
            padding: '8px 12px', 
            background: 'white', 
            border: '1px solid var(--border)', 
            borderRadius: '8px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '13px'
          }}
        >
          <i className="bi bi-arrow-clockwise"></i>
          Actualizar
        </button>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '16px', 
        marginBottom: '32px' 
      }}>
        <StatCard 
          titulo="Cartera Total" 
          valor={formatCurrency(kpis.carteraTotal)} 
          icono={<i className="bi bi-cash-stack"></i>} 
          color="var(--role-primary)" 
        />
        <div style={{ background: 'white', borderRadius: '12px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Crédito en Uso</span>
            <span style={{ fontSize: '14px', fontWeight: 600, color: getUsoColor(kpis.porcentajeUso) }}>
              {Math.round(kpis.porcentajeUso)}%
            </span>
          </div>
          <div style={{ height: '6px', background: '#E5E7EB', borderRadius: '999px', overflow: 'hidden' }}>
            <div style={{ 
              height: '100%', 
              width: `${Math.min(kpis.porcentajeUso, 100)}%`, 
              background: getUsoColor(kpis.porcentajeUso),
              borderRadius: '999px',
              transition: 'width 0.3s'
            }} />
          </div>
        </div>
        <StatCard 
          titulo="Cartera Vencida" 
          valor={formatCurrency(kpis.carteraVencida)} 
          icono={<i className="bi bi-exclamation-triangle"></i>} 
          color={kpis.carteraVencida > 0 ? '#EF4444' : '#64748B'} 
        />
        <StatCard 
          titulo="Tasa de Cumplimiento" 
          valor={`${Math.round(kpis.tasaCumplimiento)}%`} 
          icono={<i className="bi bi-check-circle"></i>} 
          color={getCumplimientoColor(kpis.tasaCumplimiento)} 
        />
      </div>

      {!tieneTiendasAsignadas ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '60px 20px',
          background: '#F4F5F7',
          borderRadius: '12px'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏪</div>
          <div style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>
            No tienes tiendas asignadas
          </div>
          <div style={{ color: 'var(--text-muted)' }}>
            Contacta al administrador para que te asigne tiendas
          </div>
        </div>
      ) : tiendas.length === 0 ? (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
          gap: '20px' 
        }}>
          <div style={{ 
            background: 'white', 
            borderRadius: '14px', 
            overflow: 'hidden',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <div style={{ 
              padding: '12px 16px',
              background: '#F4F5F7',
              borderLeft: '3px solid #64748B',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#64748B' }} />
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#64748B' }}>
                Sin actividad crediticia
              </span>
            </div>
            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
              No se encontraron tiendas con crédito activo
            </div>
          </div>
        </div>
      ) : (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', 
          gap: '20px' 
        }}>
          {tiendas.map(tienda => (
            <TiendaCreditCard 
              key={tienda.id}
              tienda={tienda}
              creditos={creditosPorTienda[tienda.id] || []}
              onClick={handleTiendaClick}
            />
          ))}
        </div>
      )}

      {showDetailModal && selectedTienda && (
        <TiendaCreditDetailModal 
          tienda={selectedTienda}
          creditos={creditosPorTienda[selectedTienda.id] || []}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedTienda(null);
          }}
        />
      )}
    </div>
  );
};

export default CreditoDashboard;
