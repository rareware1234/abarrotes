import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import empleadoService from '../services/empleadoService';
import tiendaService from '../services/tiendaService';
import '../styles/empleados.css';
import empLogoDark  from '../assets/logo-dark.png';
import empLogoLight from '../assets/logo-light.png';

// Mismo esquema que Tiendas.jsx: logo claro u oscuro según el fondo del gradiente
const EMP_FORMATO_LOGO = {
  'Punto Verde':    empLogoDark,
  'Punto Verde GO': empLogoLight,
  'Punto Verde XL': empLogoDark,
  'PuntoVerde':     empLogoDark,
  'PuntoVerde GO':  empLogoLight,
  'PuntoVerde XL':  empLogoDark,
};
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase.js';

const COLORS = {
  primary: '#1A7A48',
  primaryDark: '#0F4D2E',
  success: '#4ADE80',
  warning: '#F0A500',
  danger: '#E63946',
  purple: '#8B5CF6',
  blue: '#2563EB',
  textDark: '#1C1E21',
  textMuted: '#6B7C93',
  border: '#E4E6EA',
  background: '#F4F5F7',
  surface: '#FFFFFF',
};

const ROL_COLORS = {
  STAFF: '#1A7A48',
  MANAGER: '#2563EB',
  ADMIN: '#64748B',
};

const FORMATO_COLORS = {
  'Punto Verde':    ['#1A7A48', '#0F4D2E'],
  'PuntoVerde':     ['#1A7A48', '#0F4D2E'],
  'Punto Verde GO': ['#F0A500', '#C67F00'],
  'PuntoVerde GO':  ['#F0A500', '#C67F00'],
  'Punto Verde XL': ['#1A1A1A', '#000000'],
  'PuntoVerde XL':  ['#1A1A1A', '#000000'],
  'Punto Verde XL': ['#1C1E21', '#0F0F10'],
};

const formatDateShort = (date) => {
  if (!date) return '';
  const d = date.toDate ? date.toDate() : new Date(date);
  return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });
};

const formatNumEmpleado = (num) => num?.startsWith('EMP') ? num : `EMP-${num}`;

const getRolShortName = (rol) => ({ STAFF: 'Staff', MANAGER: 'Manager', ADMIN: 'Admin' }[rol] || rol);

const calcularVacacionesLFT = (fechaIngreso) => {
  if (!fechaIngreso) return { años: 0, dias: 0 };
  const años = Math.floor((new Date() - new Date(fechaIngreso)) / (365.25 * 24 * 60 * 60 * 1000));
  let dias = 0;
  if (años >= 1 && años <= 4) dias = 12 + (años - 1) * 2;
  else if (años >= 5 && años <= 9) dias = 20;
  else if (años >= 10) dias = 20 + Math.floor((años - 5) / 5) * 2;
  return { años, dias };
};

const getInicioSemanaActual = () => {
  const hoy = new Date();
  const dia = hoy.getDay();
  const diff = dia === 0 ? -6 : 1 - dia;
  const lunes = new Date(hoy);
  lunes.setDate(hoy.getDate() + diff);
  lunes.setHours(0, 0, 0, 0);
  return lunes;
};

const getInicioSemanaPasada = () => {
  const inicioActual = getInicioSemanaActual();
  const inicio = new Date(inicioActual);
  inicio.setDate(inicio.getDate() - 7);
  return inicio;
};

const EmpleadoAvatar = ({ empleado, size = 32 }) => {
  const initials = empleado.nombre
    ? empleado.nombre.split(' ').slice(0, 2).map(n => n?.[0]?.toUpperCase() || '').join('')
    : '?';

  const rolColor = ROL_COLORS[empleado.rol] || ROL_COLORS.STAFF;

  if (empleado.fotoUrl) {
    return (
      <img
        src={empleado.fotoUrl}
        alt={empleado.nombre}
        style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
      />
    );
  }

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: `linear-gradient(135deg, ${rolColor}, ${rolColor}CC)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontSize: size * 0.38,
        fontWeight: 'bold',
        flexShrink: 0,
      }}
    >
      {initials}
    </div>
  );
};

const getHeaderGradient = (empleado, tienda) => {
  // Si hay tienda con formato, el color lo define la sucursal (todos los roles)
  if (tienda?.formato) {
    const fmt = tienda.formato.trim();
    const key = Object.keys(FORMATO_COLORS).find(k => k.toLowerCase() === fmt.toLowerCase());
    if (key) return FORMATO_COLORS[key];
  }
  const map = {
    STAFF: ['#1A7A48', '#0F4D2E'],
    MANAGER: ['#2563EB', '#1E3A5F'],
    ADMIN: ['#64748B', '#1E293B'],
  };
  return map[empleado.rol?.toUpperCase()] || map.STAFF;
};

const EmptyState = () => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#6B7C93' }}>
    <i className="bi bi-person-circle" style={{ fontSize: 64, marginBottom: 16 }}></i>
    <p>Selecciona un empleado</p>
  </div>
);

const EmpleadoDetalle = ({ empleado, tiendas = [], onEdit, onNuevaTarea, onBack }) => {
  const [metricas, setMetricas] = useState(null);
  const [loading, setLoading] = useState(false);
  const [tienda, setTienda] = useState(null);

  // Resolver tienda: primero busca en el array, si no la encuentra la busca directo
  useEffect(() => {
    if (!empleado) { setTienda(null); return; }
    const tid = empleado.tiendaAsignada || empleado.tiendaId || empleado.tiendasAsignadas?.[0];
    console.log('[EmpDetalle] empleado:', empleado.nombre, '| tid:', tid, '| tiendaAsignada:', empleado.tiendaAsignada, '| tiendaId:', empleado.tiendaId);
    console.log('[EmpDetalle] tiendas cargadas:', tiendas.map(t => ({ id: t.id, nombre: t.nombre, formato: t.formato })));
    if (!tid) { setTienda(null); return; }
    const found = tiendas.find(t => t.id === tid);
    console.log('[EmpDetalle] found:', found);
    if (found) { setTienda(found); return; }
    // Fallback: fetch directo por ID
    tiendaService.getById(tid).then(r => {
      console.log('[EmpDetalle] getById result:', r);
      setTienda(r.success ? r.data : null);
    });
  }, [empleado?.uid, empleado?.tiendaAsignada, empleado?.tiendaId, tiendas]);

  useEffect(() => {
    if (!empleado) return;
    setLoading(true);
    
    const fetchMetricas = async () => {
      try {
        const uid = empleado.uid;

        const ordenesRef = collection(db, 'ordenes');
        const ordenesQ = query(ordenesRef, where('idEmpleado', '==', uid));
        const ordenesSnap = await getDocs(ordenesQ);
        const ordenes = [];
        ordenesSnap.forEach(doc => ordenes.push({ id: doc.id, ...doc.data() }));

        const now = new Date();
        const inicioMes = new Date(now.getFullYear(), now.getMonth(), 1);

        const ordenesDelMes = ordenes.filter(o => {
          const fecha = o.createdAt?.toDate ? o.createdAt.toDate() : new Date(o.createdAt);
          return fecha >= inicioMes;
        });
        const ventasMesCount = ordenesDelMes.length;
        const ventasMesMonto = ordenesDelMes.reduce((sum, o) => sum + (o.total || 0), 0);

        const creditosRef = collection(db, 'creditos');
        const creditosQ = query(creditosRef, where('aprobadoPorUid', '==', uid));
        const creditosSnap = await getDocs(creditosQ);
        let creditosAprobados = 0;
        let creditosMonto = 0;
        creditosSnap.forEach(doc => {
          const data = doc.data();
          creditosAprobados++;
          creditosMonto += data.montoAprobado || 0;
        });

        const faltasRef = collection(db, 'faltas');
        const faltasQ = query(faltasRef, where('empleadoUid', '==', uid));
        const faltasSnap = await getDocs(faltasQ);
        const faltas = [];
        faltasSnap.forEach(doc => faltas.push({ id: doc.id, ...doc.data() }));

        const inicioSemanaActual = getInicioSemanaActual();
        const inicioSemanaPasada = getInicioSemanaPasada();
        const finSemanaPasada = new Date(inicioSemanaActual);
        finSemanaPasada.setDate(finSemanaPasada.getDate() - 1);

        let montoActual = 0;
        let montoPasado = 0;

        ordenes.forEach(o => {
          const fecha = o.createdAt?.toDate ? o.createdAt.toDate() : new Date(o.createdAt);
          if (fecha >= inicioSemanaActual) {
            montoActual += o.total || 0;
          } else if (fecha >= inicioSemanaPasada && fecha <= finSemanaPasada) {
            montoPasado += o.total || 0;
          }
        });

        const dia = now.getDay();
        const diasHabilesTranscurridos = dia === 0 ? 0 : dia;
        const puntualidad = diasHabilesTranscurridos > 0
          ? Math.max(0, ((diasHabilesTranscurridos - faltas.filter(f => f.tipo === 'injustificada').length) / diasHabilesTranscurridos) * 100)
          : 100;

        const mesActual = new Date(now.getFullYear(), now.getMonth(), 1);
        const faltasMes = faltas.filter(f => {
          const fecha = f.fecha?.toDate ? f.fecha.toDate() : new Date(f.fecha);
          return fecha >= mesActual;
        }).length;

        const asistencia = diasHabilesTranscurridos > 0
          ? Math.max(0, ((diasHabilesTranscurridos - faltasMes) / diasHabilesTranscurridos) * 100)
          : 100;

        const vacacionInfo = calcularVacacionesLFT(empleado.fechaIngreso);

        setMetricas({
          ordenes: ordenes.length,
          ventasMesCount,
          ventasMesMonto,
          creditosAprobados,
          creditosMonto,
          montoActual,
          montoPasado,
          puntualidad,
          asistencia,
          faltasMes,
          vacacionInfo,
        });
      } catch (error) {
        console.error('Error fetching metricas:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchMetricas();
  }, [empleado]);

  if (!empleado) return (
    <div className="empleados-detalle empleados-detalle-empty" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <EmptyState />
    </div>
  );

  const gradient = getHeaderGradient(empleado, tienda);
  const themePrimary = ROL_COLORS[empleado.rol] || COLORS.primary;

  const m = metricas || {
    ordenes: 0, ventasMesCount: 0, ventasMesMonto: 0,
    creditosAprobados: 0, creditosMonto: 0,
    montoActual: 0, montoPasado: 0,
    puntualidad: 100, asistencia: 100, faltasMes: 0,
    vacacionInfo: { años: 0, dias: 0 },
  };

  const ticketPromedio = m.ventasMesCount > 0
    ? Math.round(m.ventasMesMonto / m.ventasMesCount)
    : m.ordenes > 0 ? Math.round(m.ventasMesMonto / m.ordenes) : 0;

  const deltaVentas = m.montoPasado > 0
    ? ((m.montoActual - m.montoPasado) / m.montoPasado) * 100
    : m.montoActual > 0 ? 100 : 0;

  return (
    <div className="empleados-detalle">
      {/* Header con gradiente de rol */}
      <div style={{
        background: `linear-gradient(135deg, ${gradient[0]}, ${gradient[1]})`,
        padding: '20px 20px 24px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        position: 'relative',
        gap: 8,
      }}>
        {/* Botón volver — solo mobile */}
        <button
          className="empleados-detalle-back"
          onClick={onBack}
          style={{
            position: 'absolute', top: 14, left: 14,
            background: 'rgba(255,255,255,0.18)', border: 'none',
            borderRadius: '50%', width: 36, height: 36,
            cursor: 'pointer', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
          }}
        >
          <i className="bi bi-chevron-left" style={{ color: 'white', fontSize: 16 }}></i>
        </button>

        <button onClick={() => onEdit(empleado)} style={{
          position: 'absolute', top: 14, right: 14,
          background: 'rgba(255,255,255,0.18)', border: 'none',
          borderRadius: '50%', width: 36, height: 36,
          cursor: 'pointer', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <i className="bi bi-gear-fill" style={{ color: 'white', fontSize: 15 }}></i>
        </button>

        {/* Logo + nombre de sucursal */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <img
            src={EMP_FORMATO_LOGO[tienda?.formato] || empLogoDark}
            alt="PuntoVerde"
            style={{ height: 28, objectFit: 'contain' }}
          />
          <span style={{ fontSize: 15, fontWeight: 700, color: 'white', letterSpacing: 0.1, textAlign: 'center' }}>
            {tienda?.nombre || empleado.tiendaNombre || 'Sin sucursal asignada'}
          </span>
        </div>

        <EmpleadoAvatar empleado={empleado} size={72} />

        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: 'white', margin: 0 }}>
            {empleado.nombre}
          </h2>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 2 }}>
            {formatNumEmpleado(empleado.numEmpleado)}
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 1 }}>
            Ingreso: {formatDateShort(empleado.fechaIngreso)}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <span style={{
            padding: '3px 12px', fontSize: 11, fontWeight: 700,
            background: 'rgba(255,255,255,0.2)', borderRadius: 20, color: 'white',
          }}>
            {getRolShortName(empleado.rol)}
          </span>
          {empleado.activo === false && (
            <span style={{
              padding: '3px 12px', fontSize: 11, fontWeight: 700,
              background: 'rgba(220,38,38,0.5)', borderRadius: 20, color: 'white',
            }}>
              Inactivo
            </span>
          )}
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 28,
          padding: '20px 0',
          background: 'white',
          borderBottom: '1px solid #E4E6EA',
        }}
      >
        {empleado.telefono && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                background: 'white',
                boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <i className="bi bi-telephone-fill" style={{ color: themePrimary, fontSize: 20 }}></i>
            </div>
            <span style={{ fontSize: 11, color: '#6B7C93' }}>Llamar</span>
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              background: 'white',
              boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <i className="bi bi-envelope-fill" style={{ color: themePrimary, fontSize: 20 }}></i>
          </div>
          <span style={{ fontSize: 11, color: '#6B7C93' }}>Email</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              background: 'white',
              boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <i className="bi bi-file-text-fill" style={{ color: themePrimary, fontSize: 20 }}></i>
          </div>
          <span style={{ fontSize: 11, color: '#6B7C93' }}>Documentos</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, cursor: 'pointer' }} onClick={() => onNuevaTarea(empleado)}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              background: 'white',
              boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <i className="bi bi-check2-square" style={{ color: themePrimary, fontSize: 20 }}></i>
          </div>
          <span style={{ fontSize: 11, color: '#6B7C93' }}>Tarea</span>
        </div>
      </div>

      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12, paddingBottom: 'max(16px, env(safe-area-inset-bottom, 16px))' }}>
          <div
            style={{
              background: 'white',
              borderRadius: 14,
              padding: 12,
              boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 'bold', color: '#1C1E21', marginBottom: 10 }}>Desempeño en ventas</div>
            <div className="emp-stats-grid">
              <div style={{ backgroundColor: '#F4F5F7', borderRadius: 10, padding: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, backgroundColor: themePrimary + '20', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className="bi bi-cart-fill" style={{ color: themePrimary, fontSize: 14 }}></i>
                </div>
                <div style={{ fontSize: 15, fontWeight: 'bold', color: '#1C1E21' }}>{loading ? '…' : m.ordenes}</div>
                <div style={{ fontSize: 10, color: '#6B7C93' }}>Total ventas</div>
              </div>
              <div style={{ backgroundColor: '#F4F5F7', borderRadius: 10, padding: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, backgroundColor: '#3B82F620', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className="bi bi-calendar2-event" style={{ color: '#3B82F6', fontSize: 14 }}></i>
                </div>
                <div style={{ fontSize: 15, fontWeight: 'bold', color: '#1C1E21' }}>{m.ventasMesCount}</div>
                <div style={{ fontSize: 10, color: '#6B7C93' }}>Ventas mes</div>
              </div>
              <div style={{ backgroundColor: '#F4F5F7', borderRadius: 10, padding: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, backgroundColor: '#8B5CF620', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className="bi bi-credit-card" style={{ color: '#8B5CF6', fontSize: 14 }}></i>
                </div>
                <div style={{ fontSize: 15, fontWeight: 'bold', color: '#1C1E21' }}>{m.creditosAprobados}</div>
                <div style={{ fontSize: 10, color: '#6B7C93' }}>Créditos · ${m.creditosMonto.toLocaleString()}</div>
              </div>
              <div style={{ backgroundColor: '#F4F5F7', borderRadius: 10, padding: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, backgroundColor: '#F0A50020', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className="bi bi-tag-fill" style={{ color: '#F0A500', fontSize: 14 }}></i>
                </div>
                <div style={{ fontSize: 15, fontWeight: 'bold', color: '#1C1E21' }}>${ticketPromedio.toLocaleString()}</div>
                <div style={{ fontSize: 10, color: '#6B7C93' }}>Ticket prom.</div>
              </div>
            </div>
          </div>

          <div
            style={{
              background: 'white',
              borderRadius: 14,
              padding: 12,
              boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 12, fontWeight: 'bold', color: '#1C1E21' }}>Ventas esta semana</span>
              <span
                style={{
                  padding: '3px 8px',
                  borderRadius: 20,
                  fontSize: 11,
                  fontWeight: 'bold',
                  backgroundColor: deltaVentas >= 0 ? '#4ADE8020' : '#E6394620',
                  color: deltaVentas >= 0 ? '#4ADE80' : '#E63946',
                }}
              >
                {deltaVentas >= 0 ? <i className="bi bi-arrow-up-right" style={{ marginRight: 4 }}></i> : <i className="bi bi-arrow-down-right" style={{ marginRight: 4 }}></i>}
                {Math.abs(deltaVentas).toFixed(0)}%
              </span>
            </div>
            <div style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 10, color: '#6B7C93' }}>Sem. pasada</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: '#6B7C93' }}>${m.montoPasado.toLocaleString()}</span>
              </div>
              <div style={{ height: 14, borderRadius: 4, backgroundColor: 'rgba(107,124,147,0.12)', overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${Math.min(100, (m.montoPasado / Math.max(m.montoActual, m.montoPasado, 1)) * 100)}%`,
                    backgroundColor: 'rgba(107,124,147,0.4)',
                  }}
                ></div>
              </div>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 10, color: '#6B7C93' }}>Esta semana</span>
                <span style={{ fontSize: 11, fontWeight: 'bold', color: themePrimary }}>${m.montoActual.toLocaleString()}</span>
              </div>
              <div style={{ height: 14, borderRadius: 4, backgroundColor: themePrimary + '20', overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${Math.min(100, (m.montoActual / Math.max(m.montoActual, m.montoPasado, 1)) * 100)}%`,
                    backgroundColor: themePrimary,
                  }}
                ></div>
              </div>
            </div>
            <div style={{ marginTop: 10, fontSize: 11, display: 'flex', alignItems: 'center', gap: 6 }}>
              {m.montoPasado > m.montoActual ? (
                <>
                  <i className="bi bi-arrow-right" style={{ color: '#F0A500' }}></i>
                  <span style={{ color: '#6B7C93' }}>Faltan ${(m.montoPasado - m.montoActual).toLocaleString()} para igualar la semana pasada</span>
                </>
              ) : m.montoActual > 0 ? (
                <>
                  <i className="bi bi-check-circle-fill" style={{ color: '#4ADE80' }}></i>
                  <span style={{ color: '#6B7C93' }}>Superaste la semana pasada</span>
                </>
              ) : null}
            </div>
          </div>

          <div className="emp-mini-stats">
            <div style={{ background: 'white', borderRadius: 12, padding: '12px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, boxShadow: '0 2px 6px rgba(0,0,0,0.04)' }}>
              <i className="bi bi-hourglass-split" style={{ fontSize: 15, color: m.puntualidad >= 90 ? '#4ADE80' : m.puntualidad >= 75 ? '#F0A500' : '#E63946' }}></i>
              <div style={{ fontSize: 18, fontWeight: 'bold', color: '#1C1E21' }}>{m.puntualidad.toFixed(0)}%</div>
              <div style={{ fontSize: 10, color: '#6B7C93', textAlign: 'center' }}>Puntualidad</div>
            </div>
            <div style={{ background: 'white', borderRadius: 12, padding: '12px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, boxShadow: '0 2px 6px rgba(0,0,0,0.04)' }}>
              <i className="bi bi-person-check-fill" style={{ fontSize: 15, color: m.asistencia >= 90 ? '#4ADE80' : m.asistencia >= 75 ? '#F0A500' : '#E63946' }}></i>
              <div style={{ fontSize: 18, fontWeight: 'bold', color: '#1C1E21' }}>{m.asistencia.toFixed(0)}%</div>
              <div style={{ fontSize: 10, color: '#6B7C93', textAlign: 'center' }}>Asistencia</div>
            </div>
            <div style={{ background: 'white', borderRadius: 12, padding: '12px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, boxShadow: '0 2px 6px rgba(0,0,0,0.04)' }}>
              <i className="bi bi-calendar-x" style={{ fontSize: 15, color: m.faltasMes === 0 ? '#4ADE80' : m.faltasMes <= 2 ? '#F0A500' : '#E63946' }}></i>
              <div style={{ fontSize: 18, fontWeight: 'bold', color: '#1C1E21' }}>{m.faltasMes}</div>
              <div style={{ fontSize: 10, color: '#6B7C93', textAlign: 'center' }}>Faltas mes</div>
            </div>
            <div style={{ background: 'white', borderRadius: 12, padding: '12px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, boxShadow: '0 2px 6px rgba(0,0,0,0.04)' }}>
              <i className="bi bi-umbrella-fill" style={{ fontSize: 15, color: themePrimary }}></i>
              <div style={{ fontSize: 18, fontWeight: 'bold', color: '#1C1E21' }}>{m.vacacionInfo.dias > 0 ? `${m.vacacionInfo.dias}d` : '—'}</div>
              <div style={{ fontSize: 10, color: '#6B7C93', textAlign: 'center' }}>Vacaciones</div>
            </div>
          </div>
        </div>
    </div>
  );
};

const Empleados = () => {
  const { empleado: currentUser } = useAuth();
  const [empleados, setEmpleados] = useState([]);
  const [tiendas, setTiendas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmpleado, setSelectedEmpleado] = useState(null);
  const [selectedTienda, setSelectedTienda] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [filtroRol, setFiltroRol] = useState('todos');
  const [filtroSucursal, setFiltroSucursal] = useState('todas');
  const [showNuevoEmpleado, setShowNuevoEmpleado] = useState(false);
  const [showNuevaTarea, setShowNuevaTarea] = useState(false);
  const [contextMenu, setContextMenu] = useState(null);
  const [tempPassword, setTempPassword] = useState(null);

  const isManager = currentUser?.rol === 'manager' || currentUser?.rol === 'admin' || currentUser?.rol === 'MANAGER' || currentUser?.rol === 'ADMIN';
  const canEdit = isManager;

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  useEffect(() => {
    if (!canEdit) return;
    const handler = () => {
      setFormData(FORM_EMPTY);
      setShowNuevoEmpleado(true);
    };
    window.addEventListener('open-nuevo-empleado', handler);
    return () => window.removeEventListener('open-nuevo-empleado', handler);
  }, [canEdit]);

  const fetchData = async () => {
    setLoading(true);
    const [empResult, tiendaResult] = await Promise.all([
      empleadoService.fetchAll(),
      tiendaService.fetchTodas(),
    ]);
    if (empResult.success) {
      let lista = empResult.data;

      // Managers solo ven staff de sus tiendas asignadas o que ellos crearon
      if (currentUser?.rol === 'manager') {
        const misAsignadas = currentUser.tiendasAsignadas || [];
        lista = lista.filter(emp => {
          const rolEmp = emp.rol?.toUpperCase();
          if (['MANAGER', 'DIRECTOR', 'ADMIN', 'LIDER'].includes(rolEmp)) return false;
          const empTid = emp.tiendaAsignada || emp.tiendaId;
          return misAsignadas.includes(empTid) || emp.creadoPorUid === currentUser.uid;
        });
      }

      setEmpleados(lista);
    }
    if (tiendaResult.success) setTiendas(tiendaResult.data);
    setLoading(false);
  };

  const getTiendaById = (id) => tiendas.find(t => t.id === id);

  const filteredEmpleados = useMemo(() => {
    let result = empleados;
    
    if (searchText) {
      const lower = searchText.toLowerCase();
      result = result.filter(e =>
        e.nombre?.toLowerCase().includes(lower) ||
        e.numEmpleado?.toLowerCase().includes(lower)
      );
    }
    
    if (filtroRol !== 'todos') {
      result = result.filter(e => e.rol === filtroRol.toUpperCase());
    }
    
    if (filtroSucursal !== 'todas') {
      result = result.filter(e => (e.tiendaAsignada || e.tiendaId) === filtroSucursal);
    }
    
    return result;
  }, [empleados, searchText, filtroRol, filtroSucursal]);

  const groupedEmpleados = useMemo(() => {
    const grouped = {};
    filteredEmpleados.forEach(emp => {
      const letter = (emp.nombre || '?')[0].toUpperCase();
      if (!grouped[letter]) grouped[letter] = [];
      grouped[letter].push(emp);
    });
    Object.keys(grouped).forEach(key => {
      grouped[key].sort((a, b) => (a.nombre || '').localeCompare(b.nombre || ''));
    });
    return grouped;
  }, [filteredEmpleados]);

  const handleSelect = (emp) => {
    setSelectedEmpleado(emp);
    const tid = emp?.tiendaAsignada || emp?.tiendaId;
    setSelectedTienda(tid ? getTiendaById(tid) : null);
  };

  const handleContextMenu = (e, emp) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      empleado: emp,
    });
  };

  const handleToggleActivo = async (emp) => {
    await empleadoService.toggleActivo(emp.uid);
    fetchData();
    if (selectedEmpleado?.uid === emp.uid) {
      const updated = { ...emp, activo: !emp.activo };
      setSelectedEmpleado(updated);
    }
    setContextMenu(null);
  };

  const handleEdit = () => {
    setShowNuevoEmpleado(true);
    setContextMenu(null);
  };

  const getRolFilter = () => {
    if (!isManager) return null;
    // Admin ve todos los roles; manager solo ve su staff
    if (currentUser?.rol === 'admin') {
      return [
        { value: 'todos',   label: 'Todos'   },
        { value: 'staff',   label: 'Staff'   },
        { value: 'manager', label: 'Manager' },
        { value: 'admin',   label: 'Admin'   },
      ];
    }
    return [
      { value: 'todos', label: 'Todos' },
      { value: 'staff', label: 'Staff' },
    ];
  };

  const getSucursalFilters = () => {
    const opts = [{ value: 'todas', label: 'Todas' }];
    const sucursalesConEmpleados = new Set(empleados.map(e => e.tiendaAsignada || e.tiendaId).filter(Boolean));
    sucursalesConEmpleados.forEach(id => {
      const tienda = getTiendaById(id);
      if (tienda) opts.push({ value: id, label: tienda.nombre });
    });
    return opts;
  };

  const FORM_EMPTY = {
    // Identificación
    nombrePrimero: '', apellidoPaterno: '', apellidoMaterno: '',
    numEmpleado: '', telefono: '',
    // Acceso
    rol: 'STAFF', tiendaAsignada: '',
    // Datos personales
    fechaNacimiento: '', sexo: '', estadoCivil: '', tipoSangre: '',
    nacionalidad: 'Mexicana', lugarNacimiento: '', nivelEstudios: '',
    // Documentos
    curp: '', rfc: '', nss: '',
    // Laboral
    tipoContrato: '', salarioDiario: '',
    // Banco
    banco: '', clabe: '',
    // Emergencia
    contactoEmergenciaNombre: '', contactoEmergenciaTelefono: '', contactoEmergenciaParentesco: '',
  };
  const [formData, setFormData] = useState(FORM_EMPTY);
  const fd = (key, val) => setFormData(f => ({ ...f, [key]: val }));

  const handleSave = async () => {
    if (!formData.nombrePrimero || !formData.apellidoPaterno || !formData.numEmpleado) {
      alert('Nombre(s), apellido paterno y número de empleado son requeridos');
      return;
    }

    const nombre = [formData.nombrePrimero, formData.apellidoPaterno, formData.apellidoMaterno]
      .filter(Boolean).join(' ');
    const tiendaSeleccionada = tiendas.find(t => t.id === formData.tiendaAsignada);
    const result = await empleadoService.create({
      ...formData,
      nombre,
      salarioDiario: formData.salarioDiario ? parseFloat(formData.salarioDiario) : null,
      tiendaNombre: tiendaSeleccionada?.nombre || '',
      creadoPorUid: currentUser?.uid,
      creadoPorNombre: currentUser?.nombre,
    });
    if (result.success && result.tempPassword) {
      setTempPassword(result.tempPassword);
      setShowNuevoEmpleado(false);
      fetchData();
    } else if (result.success) {
      setShowNuevoEmpleado(false);
      fetchData();
    } else {
      alert('Error: ' + result.error);
    }
  };

  const [tareaData, setTareaData] = useState({
    titulo: '',
    notas: '',
    prioridad: 'media',
    fechaLimite: '',
  });

  const handleGuardarTarea = async () => {
    if (!tareaData.titulo) {
      alert('El título es requerido');
      return;
    }

    try {
      const { collection, addDoc, serverTimestamp } = await import('firebase/firestore');
      
      await addDoc(collection(db, 'tareas'), {
        titulo: tareaData.titulo,
        notas: tareaData.notas,
        prioridad: tareaData.prioridad,
        fechaLimite: tareaData.fechaLimite || null,
        asignadoA: selectedEmpleado?.nombre,
        asignadoId: selectedEmpleado?.uid,
        creadoPor: currentUser?.nombre,
        creadoPorRol: currentUser?.rol,
        completada: false,
        createdAt: serverTimestamp(),
      });

      setShowNuevaTarea(false);
      setTareaData({ titulo: '', notas: '', prioridad: 'media', fechaLimite: '' });
      alert('Tarea creada');
    } catch (error) {
      console.error('Error creando tarea:', error);
      alert('Error al crear tarea');
    }
  };

  if (!isManager) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: '#6B7C93' }}>
        <i className="bi bi-lock-fill" style={{ fontSize: 48, marginBottom: 16 }}></i>
        <p>No tienes acceso a esta sección</p>
      </div>
    );
  }

  return (
    <div className="empleados-container">
      <div className={`empleados-sidebar${selectedEmpleado ? ' has-selection' : ''}`}>
        <div className="empleados-list-header">
          <h1 style={{ fontSize: 28, fontWeight: 700, color: '#1C1E21', margin: 0 }}>Empleados</h1>
          {canEdit && (
            <button
              onClick={() => { setFormData(FORM_EMPTY); setShowNuevoEmpleado(true); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
            >
              <i className="bi bi-plus-circle-fill" style={{ fontSize: 20, color: 'var(--role-primary)' }}></i>
            </button>
          )}
        </div>

        <div className="mobile-sticky-header empleados-sticky">
          <div style={{ padding: '8px 12px' }}>
            <div className="search-input-wrapper">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                type="text"
                placeholder="Buscar empleado..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
              {searchText && (
                <button onClick={() => setSearchText('')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: '#6B7C93', display: 'flex', alignItems: 'center' }}>
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              )}
            </div>
          </div>

          <div style={{
            padding: '0 12px 10px',
            display: 'flex',
            gap: 6,
            overflowX: 'auto',
            flexWrap: 'nowrap',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}>
            {/* Chips de rol */}
            {getRolFilter()?.map(opt => (
              <button
                key={`rol-${opt.value}`}
                onClick={() => setFiltroRol(opt.value)}
                style={{
                  flexShrink: 0,
                  display: 'inline-flex',
                  alignItems: 'center',
                  height: 26,
                  padding: '0 10px',
                  fontSize: 12,
                  fontWeight: 600,
                  lineHeight: 1,
                  borderRadius: 13,
                  border: 'none',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  backgroundColor: filtroRol === opt.value ? 'var(--role-primary)' : '#EAECF0',
                  color: filtroRol === opt.value ? 'white' : '#6B7C93',
                }}
              >
                {opt.label}
              </button>
            ))}

            {/* Chips de sucursal — solo para admin */}
            {currentUser?.rol === 'admin' && getSucursalFilters().length > 1 && (
              <div style={{ flexShrink: 0, width: 1, height: 26, background: '#D1D5DB', alignSelf: 'center', margin: '0 2px' }} />
            )}
            {currentUser?.rol === 'admin' && getSucursalFilters().map(opt => (
              <button
                key={`suc-${opt.value}`}
                onClick={() => setFiltroSucursal(opt.value)}
                style={{
                  flexShrink: 0,
                  display: 'inline-flex',
                  alignItems: 'center',
                  height: 26,
                  padding: '0 10px',
                  fontSize: 12,
                  fontWeight: 600,
                  lineHeight: 1,
                  borderRadius: 13,
                  border: 'none',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  backgroundColor: filtroSucursal === opt.value ? 'var(--role-primary)' : '#EAECF0',
                  color: filtroSucursal === opt.value ? 'white' : '#6B7C93',
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>{/* /chips */}
        </div>{/* /mobile-sticky-header */}

        <div className="empleados-list-scroll">
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center' }}><span className="spinner-border spinner-border-lg"></span></div>
          ) : Object.keys(groupedEmpleados).length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#6B7C93' }}>No hay empleados</div>
          ) : (
            Object.keys(groupedEmpleados).sort().map(letter => (
              <div key={letter}>
                <div
                  style={{
                    position: 'sticky',
                    top: 0,
                    padding: '3px 16px',
                    fontSize: 11,
                    fontWeight: 'bold',
                    color: '#6B7C93',
                    backgroundColor: 'white',
                    borderBottom: '1px solid #E4E6EA',
                  }}
                >
                  {letter}
                </div>
                {groupedEmpleados[letter].map(emp => {
                  const isSelected = selectedEmpleado?.uid === emp.uid;
                  const theme = ROL_COLORS[emp.rol] || COLORS.primary;
                  return (
                    <div
                      key={emp.id}
                      onClick={() => handleSelect(emp)}
                      onContextMenu={(e) => handleContextMenu(e, emp)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '6px 16px',
                        cursor: 'pointer',
                        backgroundColor: isSelected ? '#F4F5F7' : 'white',
                        transition: 'background-color 0.15s',
                      }}
                    >
                      <EmpleadoAvatar empleado={emp} size={32} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: isSelected ? 600 : 'normal', color: '#1C1E21', display: 'flex', alignItems: 'center', gap: 6 }}>
                          {emp.nombre}
                          {emp.activo === false && (
                            <span style={{ fontSize: 10, color: '#EF4444' }}>Inactivo</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>
      </div>

      <EmpleadoDetalle
        empleado={selectedEmpleado}
        tiendas={tiendas}
        onEdit={() => handleEdit(selectedEmpleado)}
        onNuevaTarea={() => setShowNuevaTarea(true)}
        onBack={() => setSelectedEmpleado(null)}
      />

      {contextMenu && (
        <div
          style={{
            position: 'fixed',
            top: contextMenu.y,
            left: contextMenu.x,
            background: 'white',
            borderRadius: 8,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            padding: '4px 0',
            minWidth: 160,
            zIndex: 1000,
          }}
        >
          <div
            onClick={() => handleEdit(contextMenu.empleado)}
            style={{ padding: '8px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <i className="bi bi-pencil" style={{ fontSize: 14 }}></i> Editar
          </div>
          <div
            onClick={() => handleToggleActivo(contextMenu.empleado)}
            style={{ padding: '8px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <i className="bi bi-toggle-on" style={{ fontSize: 14 }}></i>
            {contextMenu.empleado.activo !== false ? 'Desactivar' : 'Reactivar'}
          </div>
        </div>
      )}

      {showNuevoEmpleado && (() => {
        /* ── helpers de diseño ── */
        const IS = { /* input style */
          width: '100%', boxSizing: 'border-box', padding: '10px 12px',
          border: '1.5px solid #E5E7EB', borderRadius: 10, fontSize: 13.5,
          color: '#111827', background: '#FAFAFA', outline: 'none',
          transition: 'border-color .15s',
        };
        const F = ({ label, required, children, half }) => (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5, gridColumn: half ? 'span 1' : undefined }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#6B7C93', textTransform: 'uppercase', letterSpacing: 0.6 }}>
              {label}{required && <span style={{ color: 'var(--role-primary)', marginLeft: 3 }}>*</span>}
            </label>
            {children}
          </div>
        );
        const Inp = ({ label, type = 'text', fkey, required, style: sx }) => (
          <F label={label} required={required}>
            <input type={type} value={formData[fkey]} onChange={e => fd(fkey, e.target.value)}
              style={{ ...IS, ...sx }} />
          </F>
        );
        const Sel = ({ label, fkey, opts, required }) => (
          <F label={label} required={required}>
            <select value={formData[fkey]} onChange={e => fd(fkey, e.target.value)}
              style={{ ...IS, color: formData[fkey] ? '#111827' : '#9CA3AF' }}>
              <option value="">—</option>
              {opts.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </F>
        );
        const Sec = ({ icon, title }) => (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 28, marginBottom: 14,
            paddingBottom: 10, borderBottom: '1.5px solid #F3F4F6' }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--role-primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <i className={`bi bi-${icon}`} style={{ fontSize: 13, color: 'white' }} />
            </div>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#374151' }}>{title}</span>
          </div>
        );
        const G2 = ({ children }) => (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>{children}</div>
        );
        const G3 = ({ children }) => (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>{children}</div>
        );

        /* avatar preview */
        const initials = [formData.nombrePrimero?.[0], formData.apellidoPaterno?.[0]]
          .filter(Boolean).join('').toUpperCase() || '?';
        const canSave = formData.nombrePrimero && formData.apellidoPaterno && formData.numEmpleado;

        return (
          <div className="modal-overlay" onClick={() => setShowNuevoEmpleado(false)}>
            <div onClick={e => e.stopPropagation()} style={{
              background: 'white', borderRadius: 20,
              width: '92%', maxWidth: 560, maxHeight: '92vh',
              display: 'flex', flexDirection: 'column',
              boxShadow: '0 24px 60px rgba(0,0,0,0.18)',
              overflow: 'hidden',
            }}>

              {/* ── HEADER ── */}
              <div style={{
                background: 'linear-gradient(135deg, var(--role-dark) 0%, var(--role-primary) 100%)',
                padding: '20px 24px 24px', flexShrink: 0,
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>
                      Nuevo registro
                    </div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: 'white', lineHeight: 1.2 }}>
                      {formData.nombrePrimero || formData.apellidoPaterno
                        ? [formData.nombrePrimero, formData.apellidoPaterno].filter(Boolean).join(' ')
                        : 'Nuevo Empleado'}
                    </div>
                  </div>
                  <button onClick={() => setShowNuevoEmpleado(false)} style={{
                    background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 10,
                    width: 32, height: 32, cursor: 'pointer', color: 'white', fontSize: 16,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>✕</button>
                </div>
                {/* Avatar */}
                <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{
                    width: 56, height: 56, borderRadius: '50%',
                    background: 'rgba(255,255,255,0.2)', border: '2.5px solid rgba(255,255,255,0.5)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 20, fontWeight: 800, color: 'white', letterSpacing: -1, flexShrink: 0,
                  }}>
                    {initials}
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginBottom: 2 }}>
                      {formData.numEmpleado ? `EMP-${formData.numEmpleado}` : 'Núm. empleado'}
                    </div>
                    <div style={{
                      display: 'inline-block', padding: '2px 10px', borderRadius: 20,
                      background: 'rgba(255,255,255,0.2)', fontSize: 11, fontWeight: 700,
                      color: 'white', textTransform: 'capitalize',
                    }}>
                      {(formData.rol || 'STAFF').toLowerCase()}
                    </div>
                  </div>
                </div>
              </div>

              {/* ── BODY ── */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '4px 24px 24px' }}>

                <Sec icon="person-badge" title="Identificación" />
                <G2>
                  <Inp label="Nombre(s)" fkey="nombrePrimero" required />
                  <Inp label="Apellido Paterno" fkey="apellidoPaterno" required />
                </G2>
                <div style={{ marginTop: 12 }} />
                <G2>
                  <Inp label="Apellido Materno" fkey="apellidoMaterno" />
                  <Inp label="Núm. Empleado" fkey="numEmpleado" required />
                </G2>
                <div style={{ marginTop: 12 }} />
                <Inp label="Teléfono" type="tel" fkey="telefono" />

                <Sec icon="shield-lock" title="Acceso al sistema" />
                <G2>
                  <F label="Rol" required>
                    <select value={formData.rol} onChange={e => fd('rol', e.target.value)} style={IS}>
                      <option value="STAFF">Staff</option>
                      <option value="MANAGER">Manager</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  </F>
                  <F label="Sucursal asignada">
                    <select value={formData.tiendaAsignada} onChange={e => fd('tiendaAsignada', e.target.value)}
                      style={{ ...IS, color: formData.tiendaAsignada ? '#111827' : '#9CA3AF' }}>
                      <option value="">Sin asignar</option>
                      {tiendas.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                    </select>
                  </F>
                </G2>

                <Sec icon="person-lines-fill" title="Datos personales" />
                <G2>
                  <Inp label="Fecha de nacimiento" type="date" fkey="fechaNacimiento" />
                  <Sel label="Sexo" fkey="sexo" opts={['Masculino','Femenino','Otro']} />
                </G2>
                <div style={{ marginTop: 12 }} />
                <G3>
                  <Sel label="Estado civil" fkey="estadoCivil" opts={['Soltero(a)','Casado(a)','Divorciado(a)','Viudo(a)','Unión libre']} />
                  <Sel label="Tipo de sangre" fkey="tipoSangre" opts={['A+','A-','B+','B-','AB+','AB-','O+','O-']} />
                  <Sel label="Nivel de estudios" fkey="nivelEstudios" opts={['Primaria','Secundaria','Preparatoria','Técnico','Licenciatura','Maestría','Doctorado']} />
                </G3>
                <div style={{ marginTop: 12 }} />
                <G2>
                  <Inp label="Nacionalidad" fkey="nacionalidad" />
                  <Inp label="Lugar de nacimiento" fkey="lugarNacimiento" />
                </G2>

                <Sec icon="card-text" title="Documentos oficiales" />
                <Inp label="CURP" fkey="curp" style={{ textTransform: 'uppercase' }} />
                <div style={{ marginTop: 12 }} />
                <G2>
                  <Inp label="RFC" fkey="rfc" style={{ textTransform: 'uppercase' }} />
                  <Inp label="NSS" fkey="nss" />
                </G2>

                <Sec icon="briefcase" title="Datos laborales" />
                <G2>
                  <Sel label="Tipo de contrato" fkey="tipoContrato" opts={['Indefinido','Temporal','Por obra','Por honorarios','Pasante']} />
                  <Inp label="Salario diario (MXN)" type="number" fkey="salarioDiario" />
                </G2>

                <Sec icon="bank" title="Datos bancarios" />
                <G2>
                  <Sel label="Banco" fkey="banco" opts={['BBVA','Banamex','Santander','Banorte','HSBC','Scotiabank','Inbursa','Afirme','BanBajío','Otro']} />
                  <Inp label="CLABE (18 dígitos)" fkey="clabe" />
                </G2>

                <Sec icon="telephone-plus" title="Contacto de emergencia" />
                <Inp label="Nombre completo" fkey="contactoEmergenciaNombre" />
                <div style={{ marginTop: 12 }} />
                <G2>
                  <Inp label="Teléfono" type="tel" fkey="contactoEmergenciaTelefono" />
                  <Inp label="Parentesco" fkey="contactoEmergenciaParentesco" />
                </G2>
              </div>

              {/* ── FOOTER ── */}
              <div style={{
                flexShrink: 0, padding: '14px 24px',
                borderTop: '1.5px solid #F3F4F6',
                background: 'white',
                display: 'flex', gap: 10,
              }}>
                <button onClick={() => setShowNuevoEmpleado(false)} style={{
                  flex: 1, padding: '11px 0', border: '1.5px solid #E5E7EB', borderRadius: 12,
                  background: 'white', fontSize: 14, fontWeight: 600, cursor: 'pointer', color: '#374151',
                }}>
                  Cancelar
                </button>
                <button onClick={handleSave} disabled={!canSave} style={{
                  flex: 2, padding: '11px 0', border: 'none', borderRadius: 12,
                  background: canSave
                    ? 'linear-gradient(135deg, var(--role-dark) 0%, var(--role-primary) 100%)'
                    : '#E5E7EB',
                  color: canSave ? 'white' : '#9CA3AF',
                  fontSize: 14, fontWeight: 700, cursor: canSave ? 'pointer' : 'not-allowed',
                  transition: 'opacity .15s',
                }}>
                  <i className="bi bi-check2-circle" style={{ marginRight: 7 }} />
                  Guardar empleado
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {showNuevaTarea && (
        <div className="modal-overlay" onClick={() => setShowNuevaTarea(false)}>
          <div className="confirm-modal" style={{ maxWidth: 400, textAlign: 'left' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: 20 }}>Nueva Tarea</h3>
            <div style={{ display: 'grid', gap: 12 }}>
              <input type="text" placeholder="Título *" value={tareaData.titulo} onChange={e => setTareaData({...tareaData, titulo: e.target.value})} style={{ padding: 12, border: '1px solid var(--border)', borderRadius: 8 }} />
              <textarea placeholder="Notas" value={tareaData.notas} onChange={e => setTareaData({...tareaData, notas: e.target.value})} style={{ padding: 12, border: '1px solid var(--border)', borderRadius: 8, minHeight: 80 }} />
              <div>
                <label style={{ fontSize: 12, color: '#6B7C93', marginBottom: 4, display: 'block' }}>Prioridad</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {['baja', 'media', 'alta'].map(p => (
                    <button
                      key={p}
                      onClick={() => setTareaData({...tareaData, prioridad: p})}
                      style={{
                        flex: 1,
                        padding: 8,
                        border: '1px solid var(--border)',
                        borderRadius: 6,
                        background: tareaData.prioridad === p ? (p === 'alta' ? '#E63946' : p === 'media' ? '#F0A500' : '#6B7C93') : 'white',
                        color: tareaData.prioridad === p ? 'white' : '#6B7C93',
                        cursor: 'pointer',
                        textTransform: 'capitalize',
                      }}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
              <input type="date" value={tareaData.fechaLimite} onChange={e => setTareaData({...tareaData, fechaLimite: e.target.value})} style={{ padding: 12, border: '1px solid var(--border)', borderRadius: 8 }} />
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
              <button onClick={() => setShowNuevaTarea(false)} className="btn btn-outline-secondary" style={{ flex: 1 }}>Cancelar</button>
              <button onClick={handleGuardarTarea} className="btn btn-primary" style={{ flex: 1, background: 'var(--role-primary)' }}>Crear tarea</button>
            </div>
          </div>
        </div>
      )}

      {tempPassword && (
        <div className="modal-overlay" onClick={() => setTempPassword(null)}>
          <div className="confirm-modal" onClick={e => e.stopPropagation()}>
            <div style={{ textAlign: 'center' }}>
              <i className="bi bi-key" style={{ fontSize: 48, color: '#F59E0B', marginBottom: 16 }}></i>
              <h3>Contraseña Temporal</h3>
              <p style={{ color: 'var(--text-muted)', marginBottom: 16 }}>Esta contraseña solo se mostrará una vez:</p>
              <div style={{ background: '#FEF3C7', padding: 16, borderRadius: 8, fontSize: 24, fontWeight: 700, fontFamily: 'monospace', letterSpacing: 2 }}>
                {tempPassword}
              </div>
              <button onClick={() => setTempPassword(null)} className="btn btn-primary" style={{ marginTop: 20, background: 'var(--role-primary)' }}>Entendido</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Empleados;
