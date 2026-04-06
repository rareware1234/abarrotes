import React, { useState, useEffect, useRef } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { calcularSaludTienda } from '../../hooks/useCreditoDashboard';

ChartJS.register(ArcElement, Tooltip, Legend);

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

const ESTADO_COLORS = {
  activo: '#10B981',
  vencido: '#EF4444',
  suspendido: '#F59E0B',
  pagado: '#2563EB'
};

const TiendaCreditDetailModal = ({ tienda, creditos, onClose }) => {
  const [activeTab, setActiveTab] = useState('resumen');
  const chartRef = useRef(null);

  if (!tienda) return null;

  const salud = calcularSaludTienda(creditos);
  const saludConfig = SALUD_CONFIG[salud];
  
  const activos = creditos.filter(c => c.estado === 'activo');
  const vencidos = creditos.filter(c => c.estado === 'vencido');
  const suspendidos = creditos.filter(c => c.estado === 'suspendido');
  
  const carteraTotal = activos.reduce((sum, c) => sum + (c.montoAprobado || 0), 0);
  const montoUsado = activos.reduce((sum, c) => sum + (c.montoUsado || 0), 0);
  const montoDisponible = carteraTotal - montoUsado;
  const montoVencido = vencidos.reduce((sum, c) => sum + (c.montoUsado || 0), 0);

  const formato = tienda.formato?.toLowerCase() || 'puntoverdev';
  const gradient = FORMATO_GRADIENTS[formato] || FORMATO_GRADIENTS.puntoVerde;
  const badgeLabel = FORMATO_BADGES[formato] || formato.substring(0, 2).toUpperCase();

  const chartData = {
    labels: ['Disponible', 'En uso', 'Vencido'],
    datasets: [{
      data: [montoDisponible, montoUsado - montoVencido, montoVencido],
      backgroundColor: ['#10B981', '#F59E0B', '#EF4444'],
      borderWidth: 0,
      cutout: '70%'
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => formatCurrency(ctx.raw)
        }
      }
    }
  };

  const porVencer = activos.filter(c => {
    if (!c.fechaVencimiento) return false;
    const vencimiento = c.fechaVencimiento.toDate ? c.fechaVencimiento.toDate() : new Date(c.fechaVencimiento);
    const dias = Math.ceil((vencimiento - new Date()) / (1000 * 60 * 60 * 24));
    return dias >= 0 && dias <= 7;
  });

  const historial = [];
  creditos.forEach(c => {
    if (c.fechaAprobacion) {
      historial.push({
        tipo: 'aprobado',
        fecha: c.fechaAprobacion.toDate ? c.fechaAprobacion.toDate() : new Date(c.fechaAprobacion),
        monto: c.montoAprobado,
        clienteId: c.clienteId
      });
    }
    c.transacciones?.forEach(t => {
      historial.push({
        tipo: t.tipo,
        fecha: t.fecha?.toDate ? t.fecha.toDate() : new Date(t.fecha),
        monto: t.monto,
        clienteId: c.clienteId
      });
    });
  });
  historial.sort((a, b) => b.fecha - a.fecha);

  const formatFecha = (date) => {
    return date.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const tabs = [
    { id: 'resumen', label: 'Resumen' },
    { id: 'creditos', label: 'Créditos' },
    { id: 'historial', label: 'Historial' }
  ];

  const getDiasRestantes = (fechaVencimiento) => {
    if (!fechaVencimiento) return null;
    const vencimiento = fechaVencimiento.toDate ? fechaVencimiento.toDate() : new Date(fechaVencimiento);
    return Math.ceil((vencimiento - new Date()) / (1000 * 60 * 60 * 24));
  };

  const getNivelColor = (nivel) => {
    const colors = { 'Excelente': '#10B981', 'Bueno': '#2563EB', 'Regular': '#F59E0B', 'No aplica': '#64748B' };
    return colors[nivel] || '#64748B';
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="tienda-detail-modal"
        style={{ 
          background: 'white', 
          borderRadius: '16px',
          maxWidth: '680px',
          width: '95%',
          maxHeight: '90vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
        onClick={e => e.stopPropagation()}
      >
        <div 
          className="modal-header"
          style={{ 
            background: gradient,
            padding: '20px',
            position: 'relative',
            color: 'white'
          }}
        >
          <button 
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              color: 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px'
            }}
          >
            ×
          </button>
          
          <div style={{ textAlign: 'center', paddingRight: '30px' }}>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '1px' }}>
              {tienda.formato || 'Punto Verde'}
            </div>
            <div style={{ fontSize: '20px', fontWeight: 700 }}>{tienda.nombre}</div>
            <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)', marginTop: '4px' }}>
              {tienda.ciudad}, {tienda.estado}
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

        <div style={{ 
          display: 'flex', 
          borderBottom: '1px solid var(--border)',
          background: '#FAFAFA'
        }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1,
                padding: '12px',
                background: activeTab === tab.id ? 'white' : 'transparent',
                border: 'none',
                borderBottom: activeTab === tab.id ? '2px solid var(--role-primary)' : '2px solid transparent',
                color: activeTab === tab.id ? 'var(--role-primary)' : 'var(--text-muted)',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: '20px' }}>
          {activeTab === 'resumen' && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '12px', marginBottom: '24px' }}>
                <div style={{ background: '#F4F5F7', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '4px' }}>Cartera</div>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--role-primary)' }}>
                    {formatCurrency(carteraTotal)}
                  </div>
                </div>
                <div style={{ background: '#F4F5F7', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '4px' }}>En uso</div>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: '#F59E0B' }}>
                    {formatCurrency(montoUsado)}
                  </div>
                </div>
                <div style={{ background: '#F4F5F7', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '4px' }}>Vencido</div>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: '#EF4444' }}>
                    {formatCurrency(montoVencido)}
                  </div>
                </div>
                <div style={{ background: '#F4F5F7', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '4px' }}>Activos</div>
                  <div style={{ fontSize: '18px', fontWeight: 700 }}>{activos.length}</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '20px', alignItems: 'center', marginBottom: '24px' }}>
                <div style={{ width: '140px', height: '140px', position: 'relative' }}>
                  <Doughnut data={chartData} options={chartOptions} ref={chartRef} />
                  <div style={{ 
                    position: 'absolute', 
                    top: '50%', 
                    left: '50%', 
                    transform: 'translate(-50%, -50%)',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '20px', fontWeight: 700 }}>{formatCurrency(carteraTotal)}</div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Total</div>
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#10B981' }} />
                    <span style={{ fontSize: '13px' }}>Disponible: {formatCurrency(montoDisponible)}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#F59E0B' }} />
                    <span style={{ fontSize: '13px' }}>En uso: {formatCurrency(montoUsado - montoVencido)}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#EF4444' }} />
                    <span style={{ fontSize: '13px' }}>Vencido: {formatCurrency(montoVencido)}</span>
                  </div>
                </div>
              </div>

              <div style={{ 
                padding: '12px', 
                background: `${saludConfig.color}15`, 
                borderRadius: '8px',
                borderLeft: `3px solid ${saludConfig.color}`
              }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: saludConfig.color, marginBottom: '8px' }}>
                  Estado: {saludConfig.label}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  {activos.length} activo{activos.length !== 1 ? 's' : ''} · {vencidos.length} vencido{vencidos.length !== 1 ? 's' : ''} · {porVencer.length} por vencer
                </div>
              </div>
            </div>
          )}

          {activeTab === 'creditos' && (
            <div>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                {['todos', 'activo', 'porVencer', 'vencido'].map(filtro => {
                  let filtered = creditos;
                  if (filtro === 'activo') filtered = creditos.filter(c => c.estado === 'activo');
                  else if (filtro === 'vencido') filtered = creditos.filter(c => c.estado === 'vencido');
                  else if (filtro === 'porVencer') {
                    filtered = creditos.filter(c => {
                      if (c.estado !== 'activo' || !c.fechaVencimiento) return false;
                      const v = c.fechaVencimiento.toDate ? c.fechaVencimiento.toDate() : new Date(c.fechaVencimiento);
                      const dias = Math.ceil((v - new Date()) / (1000 * 60 * 60 * 24));
                      return dias >= 0 && dias <= 7;
                    });
                  }
                  return (
                    <button
                      key={filtro}
                      style={{
                        padding: '6px 12px',
                        border: '1px solid var(--border)',
                        borderRadius: '16px',
                        background: 'white',
                        fontSize: '12px',
                        cursor: 'pointer'
                      }}
                    >
                      {filtro === 'todos' ? 'Todos' : filtro === 'porVencer' ? 'Por vencer' : filtro.charAt(0).toUpperCase() + filtro.slice(1)} ({filtered.length})
                    </button>
                  );
                })}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {creditos.map(credito => {
                  const diasRestantes = getDiasRestantes(credito.fechaVencimiento);
                  const estadoColor = ESTADO_COLORS[credito.estado] || '#64748B';
                  
                  return (
                    <div 
                      key={credito.id}
                      style={{ 
                        border: '1px solid var(--border)', 
                        borderRadius: '8px', 
                        padding: '12px',
                        background: 'white'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '14px' }}>{credito.clienteId}</div>
                          {credito.nivel && (
                            <span style={{ 
                              background: getNivelColor(credito.nivel), 
                              color: 'white', 
                              padding: '2px 6px', 
                              borderRadius: '4px', 
                              fontSize: '10px' 
                            }}>
                              {credito.nivel}
                            </span>
                          )}
                        </div>
                        <span style={{ 
                          background: `${estadoColor}20`, 
                          color: estadoColor, 
                          padding: '4px 8px', 
                          borderRadius: '12px', 
                          fontSize: '11px',
                          fontWeight: 600
                        }}>
                          {credito.estado}
                        </span>
                      </div>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12px' }}>
                        <div>
                          <span style={{ color: 'var(--text-muted)' }}>Usado:</span>{' '}
                          <span style={{ fontWeight: 600 }}>{formatCurrency(credito.montoUsado)}</span>
                        </div>
                        <div>
                          <span style={{ color: 'var(--text-muted)' }}>Aprobado:</span>{' '}
                          <span style={{ fontWeight: 600 }}>{formatCurrency(credito.montoAprobado)}</span>
                        </div>
                        <div>
                          <span style={{ color: 'var(--text-muted)' }}>Días:</span>{' '}
                          <span style={{ 
                            color: diasRestantes <= 7 ? '#F59E0B' : diasRestantes <= 0 ? '#EF4444' : 'inherit',
                            fontWeight: 600
                          }}>
                            {diasRestantes !== null ? (diasRestantes > 0 ? `${diasRestantes}` : 'Vencido') : '-'}
                          </span>
                        </div>
                        <div>
                          <span style={{ color: 'var(--text-muted)' }}>Tasa:</span>{' '}
                          <span>{credito.tasaMensual}%</span>
                        </div>
                      </div>
                      
                      {credito.estado === 'activo' && (
                        <button
                          style={{
                            marginTop: '8px',
                            padding: '6px 12px',
                            background: 'var(--role-primary)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '12px',
                            cursor: 'pointer'
                          }}
                        >
                          Registrar Pago
                        </button>
                      )}
                    </div>
                  );
                })}
                
                {creditos.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    No hay créditos en esta tienda
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'historial' && (
            <div>
              {historial.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                  {historial.slice(0, 30).map((evento, idx) => {
                    const color = evento.tipo === 'aprobado' ? '#10B981' : 
                                  evento.tipo === 'pago' ? '#2563EB' : 
                                  evento.tipo === 'vencido' ? '#EF4444' : '#F59E0B';
                    const icon = evento.tipo === 'aprobado' ? '✅' : 
                                 evento.tipo === 'pago' ? '💵' : 
                                 evento.tipo === 'vencido' ? '⚠️' : '⏸️';
                    
                    return (
                      <div 
                        key={idx}
                        style={{ 
                          display: 'flex', 
                          gap: '12px', 
                          padding: '10px 0',
                          borderBottom: idx < historial.length - 1 ? '1px solid var(--border)' : 'none'
                        }}
                      >
                        <div style={{ fontSize: '16px' }}>{icon}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '13px', fontWeight: 500 }}>
                            {evento.tipo === 'aprobado' ? 'Crédito aprobado' : 
                             evento.tipo === 'pago' ? 'Pago registrado' : 
                             evento.tipo === 'vencido' ? 'Crédito vencido' : 'Cambio de estado'}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                            {evento.clienteId} · {formatCurrency(evento.monto)}
                          </div>
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          {formatFecha(evento.fecha)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  No hay historial de crédito
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TiendaCreditDetailModal;
