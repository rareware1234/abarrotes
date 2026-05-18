import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import creditoService from '../services/creditoService';
import tiendaService from '../services/tiendaService';
import './Creditos.css';

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
};

const Creditos = () => {
  const { roleTheme, hasPermission } = useAuth();
  const [creditos, setCreditos] = useState([]);
  const [tiendas, setTiendas] = useState([]);
  const [loading, setLoading] = useState(true);

  const puedeVer = hasPermission('creditos_ver');

  useEffect(() => {
    if (puedeVer) {
      Promise.all([
        creditoService.listarCreditos(),
        tiendaService.fetchTodas()
      ]).then(([creditosRes, tiendasRes]) => {
        if (creditosRes.success) setCreditos(creditosRes.data);
        if (tiendasRes.success) setTiendas(tiendasRes.data);
        setLoading(false);
      });
    }
  }, []);

  const getKPIs = () => {
    const activos = creditos.filter(c => c.estado === 'activo');
    const vencidos = creditos.filter(c => c.estado === 'vencido');
    const pagados = creditos.filter(c => c.estado === 'pagado');

    const totalPrestado = creditos.reduce((sum, c) => sum + (c.montoOriginal || 0), 0);
    const deudaVigente = activos.reduce((sum, c) => sum + (c.montoUsado || 0), 0);
    const dineroRecuperado = totalPrestado - deudaVigente;
    const tasaRecuperacion = totalPrestado > 0 ? (dineroRecuperado / totalPrestado) * 100 : 0;
    const morosidad = creditos.length > 0 ? (vencidos.length / creditos.length) * 100 : 0;

    const hace30Dias = new Date();
    hace30Dias.setDate(hace30Dias.getDate() - 30);
    const nuevos = creditos.filter(c => {
      const fecha = c.fechaCreacion?.toDate ? c.fechaCreacion.toDate() : new Date(c.fechaCreacion);
      return fecha >= hace30Dias && c.estado !== 'rechazado';
    }).length;

    return { totalPrestado, deudaVigente, dineroRecuperado, tasaRecuperacion, morosidad, nuevos, activos: activos.length, vencidos: vencidos.length, pagados: pagados.length };
  };

  const getStoreRanking = () => {
    const storeSales = {};
    tiendas.forEach(t => { storeSales[t.id] = { nombre: t.nombre, total: 0 }; });
    
    creditos.filter(c => c.estado === 'activo' || c.estado === 'vencido').forEach(c => {
      const tiendaId = c.tiendaId || 'sin-asignar';
      if (storeSales[tiendaId]) {
        storeSales[tiendaId].total += c.montoUsado || 0;
      } else {
        storeSales['sin-asignar'] = { nombre: 'Sin asignar', total: (storeSales['sin-asignar']?.total || 0) + (c.montoUsado || 0) };
      }
    });

    return Object.entries(storeSales)
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  };

  const getTopClientes = () => {
    const clientDebt = {};
    creditos.filter(c => c.estado === 'activo' || c.estado === 'vencido').forEach(c => {
      const key = c.clienteId || c.clienteNombre || 'Unknown';
      if (!clientDebt[key]) {
        clientDebt[key] = { nombre: c.clienteNombre || c.clienteId || 'Cliente', total: 0 };
      }
      clientDebt[key].total += c.montoUsado || 0;
    });

    return Object.values(clientDebt)
      .sort((a, b) => b.total - a.total)
      .slice(0, 8);
  };

  const kpis = loading ? null : getKPIs();
  const ranking = loading ? [] : getStoreRanking();
  const topClientes = loading ? [] : getTopClientes();

  const getInitial = (name) => name ? name.charAt(0).toUpperCase() : '?';
  const maxVenta = ranking.length > 0 ? ranking[0].total : 1;

  if (loading) {
    return (
      <div className="credito-dashboard">
        <div className="credito-loading"><div className="spinner-border"></div></div>
      </div>
    );
  }

  return (
    <div className="credito-dashboard">
      <div className="credito-dashboard-header">
        <div>
          <h1>Crédito</h1>
          <p>Salud crediticia del negocio</p>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="credito-kpi-grid">
        <div className="credito-kpi-card">
          <div className="credito-kpi-label">Dinero Prestado</div>
          <div className="credito-kpi-value">{formatCurrency(kpis.totalPrestado)}</div>
          <div className="credito-kpi-sub">{kpis.activos} créditos activos</div>
        </div>
        <div className="credito-kpi-card">
          <div className="credito-kpi-label">Deuda Vigente</div>
          <div className="credito-kpi-value">{formatCurrency(kpis.deudaVigente)}</div>
          <div className="credito-kpi-sub negative">{kpis.vencidos} vencidos</div>
        </div>
        <div className="credito-kpi-card">
          <div className="credito-kpi-label">Recuperado</div>
          <div className="credito-kpi-value">{formatCurrency(kpis.dineroRecuperado)}</div>
          <div className="credito-kpi-sub positive">{kpis.tasaRecuperacion.toFixed(1)}% del total</div>
        </div>
        <div className="credito-kpi-card">
          <div className="credito-kpi-label">Morosidad</div>
          <div className="credito-kpi-value" style={{ color: kpis.morosidad > 20 ? '#EF4444' : '#1A7A48' }}>
            {kpis.morosidad.toFixed(1)}%
          </div>
          <div className="credito-kpi-sub">{kpis.nuevos} nuevos últimos 30 días</div>
        </div>
      </div>

      {/* Two column section */}
      <div className="credito-grid-2">
        {/* Store Ranking */}
        <div className="credito-section">
          <h3>Ranking por Sucursal</h3>
          <div className="credito-store-ranking">
            {ranking.map((store, idx) => (
              <div key={store.id} className="credito-store-row">
                <div className="credito-store-rank">{idx + 1}</div>
                <div className="credito-store-info">
                  <div className="credito-store-name">{store.nombre}</div>
                  <div className="credito-store-bar">
                    <div className="credito-store-bar-fill" style={{ width: `${(store.total / maxVenta) * 100}%` }}></div>
                  </div>
                </div>
                <div className="credito-store-value">{formatCurrency(store.total)}</div>
              </div>
            ))}
            {ranking.length === 0 && (
              <div className="credito-empty" style={{ padding: '20px' }}><p>Sin datos de ventas</p></div>
            )}
          </div>
        </div>

        {/* Top Clients */}
        <div className="credito-section">
          <h3>Clientes con Mayor Deuda</h3>
          <div className="credito-client-list">
            {topClientes.map((client, idx) => (
              <div key={idx} className="credito-client-row">
                <div className="credito-client-avatar">{getInitial(client.nombre)}</div>
                <div className="credito-client-info">
                  <div className="credito-client-name">{client.nombre}</div>
                </div>
                <div className="credito-client-deuda">{formatCurrency(client.total)}</div>
              </div>
            ))}
            {topClientes.length === 0 && (
              <div className="credito-empty" style={{ padding: '20px' }}><p>Sin clientes con deuda</p></div>
            )}
          </div>
        </div>
      </div>

      {/* Status Breakdown */}
      <div className="credito-section">
        <h3>Estado de Créditos</h3>
        <div className="credito-status-breakdown">
          <div className="credito-status-row">
            <div className="credito-status-icon vencido">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            </div>
            <div className="credito-status-info">
              <div className="credito-status-label">Vencidos</div>
              <div className="credito-status-bar">
                <div className="credito-status-bar-segment vencido" style={{ width: `${(kpis.vencidos / creditos.length) * 100 || 0}%` }}></div>
              </div>
            </div>
            <div className="credito-status-count">{kpis.vencidos}</div>
          </div>
          <div className="credito-status-row">
            <div className="credito-status-icon al-corriente">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            </div>
            <div className="credito-status-info">
              <div className="credito-status-label">Al Corriente</div>
              <div className="credito-status-bar">
                <div className="credito-status-bar-segment al-corriente" style={{ width: `${(kpis.activos / creditos.length) * 100 || 0}%` }}></div>
              </div>
            </div>
            <div className="credito-status-count">{kpis.activos}</div>
          </div>
          <div className="credito-status-row">
            <div className="credito-status-icon pagado">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
            </div>
            <div className="credito-status-info">
              <div className="credito-status-label">Pagados</div>
              <div className="credito-status-bar">
                <div className="credito-status-bar-segment pagado" style={{ width: `${(kpis.pagados / creditos.length) * 100 || 0}%` }}></div>
              </div>
            </div>
            <div className="credito-status-count">{kpis.pagados}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Creditos;