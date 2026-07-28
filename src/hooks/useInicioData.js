import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useEmpresa } from '../context/EmpresaContext';
import tiendaService from '../services/tiendaService';
import orderService from '../services/orderService';
import empleadoService from '../services/empleadoService';
import productService from '../services/productService';
import { normalizeFormato, FORMATOS_ORDEN } from '../data/formatos';
import { on, CAJA_ACTUALIZADA } from '../lib/appEvents';
import { getActivaId, filterByActiveEmpresa, scopeProductos } from '../lib/empresaActiva';

/** Convierte un Timestamp de Firestore / string / Date a Date. */
const toDate = (v) => {
  if (!v) return null;
  if (typeof v.toDate === 'function') return v.toDate();
  if (v instanceof Date) return v;
  return new Date(v);
};

const isSameDay = (a, b) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const startOfMonth = (d) => new Date(d.getFullYear(), d.getMonth(), 1);

/** Nombre completo de un empleado a partir de los campos de Firestore. */
const nombreCompletoEmpleado = (emp) => {
  if (!emp) return null;
  const partes = [emp.nombre, emp.apellidoPaterno, emp.apellidoMaterno, emp.apellidos]
    .filter((p) => p && String(p).trim());
  return partes.length ? partes.join(' ') : (emp.nombre || null);
};

/** Colores del donut de métodos de pago (igual que Swift). */
const METODO_COLORS = {
  efectivo: '#22C55E',
  tarjeta: '#3B82F6',
  mercadopago: '#06B6D4',
  codi: '#A855F7',
  transferencia: '#F97316',
};

/**
 * Carga y agrega todos los datos del dashboard de Inicio, replicando
 * la lógica de `InicioView.swift` (alcance por rol + propiedades
 * computadas: totales, rankings, distribuciones, series de gráficas).
 */
export function useInicioData() {
  const { empleado } = useAuth();
  const { activaId: empresaActivaId } = useEmpresa();

  const [tiendas, setTiendas] = useState([]);
  const [ventas, setVentas] = useState([]);
  const [empleados, setEmpleados] = useState([]);
  const [productosCatalogo, setProductosCatalogo] = useState([]);
  const [tiendaIds, setTiendaIds] = useState(new Set());
  const [staffFormato, setStaffFormato] = useState(null);
  const [loading, setLoading] = useState(true);

  const cargarTodo = useCallback(async () => {
    if (!empleado) return;
    setLoading(true);
    try {
      const [tRes, oRes, eRes, pRes] = await Promise.all([
        tiendaService.fetchTodas(),
        orderService.getOrdenes('todas'),
        empleadoService.fetchAll(),
        productService.fetchAll(),
      ]);

      // Scoping por EMPRESA ACTIVA (igual que fetchAllForActiveEmpresa en Swift):
      // cada empresa (Kaal, Party Kids, …) ve solo SUS tiendas → sus datos.
      const activaId = getActivaId();
      const todas = filterByActiveEmpresa(tRes.success ? tRes.data : [], activaId);

      // Alcance de tiendas según el rol (igual que cargarTodo en Swift).
      let asignadas;
      if (empleado.rol === 'staff') {
        asignadas = new Set(empleado.tiendaId ? [empleado.tiendaId] : []);
      } else if (empleado.rol === 'manager') {
        const direct = new Set(empleado.tiendasAsignadas || []);
        todas.forEach((t) => {
          if (t.responsable === empleado.nombre ||
              (t.responsableId && t.responsableId === empleado.uid)) {
            direct.add(t.id);
          }
        });
        asignadas = direct;
      } else {
        // admin
        asignadas = new Set(todas.map((t) => t.id));
      }

      setTiendaIds(asignadas);
      setTiendas(todas.filter((t) => asignadas.has(t.id)));

      if (empleado.rol === 'staff' && empleado.tiendaId) {
        const t = todas.find((x) => x.id === empleado.tiendaId);
        setStaffFormato(t ? normalizeFormato(t.formato) : null);
      } else {
        setStaffFormato(null);
      }

      // Ventas se filtran luego por `tiendaIds` (ya scopeadas a la empresa).
      const empresaTiendaIds = new Set(todas.map((t) => t.id));
      setVentas(oRes.success ? oRes.data : []);
      setEmpleados(filterByActiveEmpresa(eRes.success ? eRes.data : [], activaId));
      setProductosCatalogo(scopeProductos(pRes.success ? pRes.data : [], empresaTiendaIds, activaId));
    } catch (e) {
      console.error('Error cargando dashboard:', e);
    } finally {
      setLoading(false);
    }
  }, [empleado, empresaActivaId]);

  useEffect(() => { cargarTodo(); }, [cargarTodo]);

  // Refresco automático cada 45s + al emitirse `cajaActualizada` (biblia §7.4).
  useEffect(() => {
    const id = setInterval(() => { cargarTodo(); }, 45000);
    const off = on(CAJA_ACTUALIZADA, () => { cargarTodo(); });
    return () => { clearInterval(id); off(); };
  }, [cargarTodo]);

  // Órdenes dentro del alcance del usuario, con createdAt parseado.
  const ventasAccesibles = useMemo(() => {
    return ventas
      .filter((v) => v.tiendaId && tiendaIds.has(v.tiendaId))
      .map((v) => ({ ...v, _fecha: toDate(v.createdAt) }))
      .filter((v) => v._fecha);
  }, [ventas, tiendaIds]);

  const metrics = useMemo(() => {
    const now = new Date();
    const inicioMes = startOfMonth(now);
    const diaActual = now.getDate();

    const deHoy = ventasAccesibles.filter((v) => isSameDay(v._fecha, now));
    const delMes = ventasAccesibles.filter((v) => v._fecha >= inicioMes);

    const totalHoy = deHoy.reduce((s, v) => s + (v.total || 0), 0);
    const ventasHoyCount = deHoy.length;
    const ticketPromedio = ventasHoyCount ? totalHoy / ventasHoyCount : 0;

    const totalMes = delMes.reduce((s, v) => s + (v.total || 0), 0);
    const ventasMesCount = delMes.length;
    const promedioDiario = totalMes / Math.max(diaActual, 1);

    // Egresos estimados (mismo desglose por tienda que Swift).
    const porTienda = 35000 + 8450 + Math.max(4 * 4500, 9000) + 22180 + 1290;
    const egresosEstimadosMes = porTienda * tiendaIds.size;

    // Ventas por hora de hoy (0..23).
    const horaBucket = new Array(24).fill(0);
    deHoy.forEach((v) => { horaBucket[v._fecha.getHours()] += v.total || 0; });
    const ventasPorHoraHoy = horaBucket.map((total, hora) => ({ hora, total }));

    // Ventas por día del mes (1..hoy).
    const diaBucket = {};
    delMes.forEach((v) => {
      const d = v._fecha.getDate();
      diaBucket[d] = (diaBucket[d] || 0) + (v.total || 0);
    });
    const ventasPorDiaDelMes = [];
    for (let d = 1; d <= Math.max(diaActual, 1); d++) {
      ventasPorDiaDelMes.push({ dia: d, total: diaBucket[d] || 0 });
    }

    // Métodos de pago de hoy.
    const metodoGrupos = {};
    deHoy.forEach((v) => {
      const k = (v.metodoPago || 'otro').toLowerCase();
      metodoGrupos[k] = (metodoGrupos[k] || 0) + 1;
    });
    const metodosPagoBreakdown = Object.entries(metodoGrupos)
      .map(([metodo, cantidad]) => ({
        metodo,
        cantidad,
        color: METODO_COLORS[metodo] || '#9CA3AF',
      }))
      .sort((a, b) => b.cantidad - a.cantidad);

    // Meta del mes: $50,000 por tienda en alcance.
    const metaMes = Math.max(tiendaIds.size, 1) * 50000;

    // Mes anterior
    const inicioMesPasado = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const finMesPasado = new Date(now.getFullYear(), now.getMonth(), 1);
    const delMesPasado = ventasAccesibles.filter(
      (v) => v._fecha >= inicioMesPasado && v._fecha < finMesPasado
    );
    const totalMesPasado = delMesPasado.reduce((s, v) => s + (v.total || 0), 0);
    const ventasMesPasadoCount = delMesPasado.length;
    const diasEnMesPasado = new Date(now.getFullYear(), now.getMonth(), 0).getDate();
    const promedioDiarioMesPasado = totalMesPasado / Math.max(diasEnMesPasado, 1);
    const deltaMes = totalMesPasado > 0
      ? ((totalMes - totalMesPasado) / totalMesPasado) * 100
      : 0;

    // Comparativo de últimos 6 meses (para sparkline)
    const comparativo6Meses = [];
    for (let i = 5; i >= 0; i--) {
      const inicio = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const fin = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      const total = ventasAccesibles
        .filter((v) => v._fecha >= inicio && v._fecha < fin)
        .reduce((s, v) => s + (v.total || 0), 0);
      const label = inicio.toLocaleDateString('es-MX', { month: 'short' });
      comparativo6Meses.push({ label, total, mes: inicio.getMonth(), año: inicio.getFullYear() });
    }

    return {
      totalHoy, ventasHoyCount, ticketPromedio,
      totalMes, ventasMesCount, promedioDiario,
      egresosEstimadosMes, ventasPorHoraHoy, ventasPorDiaDelMes,
      metodosPagoBreakdown, metaMes,
      totalMesPasado, ventasMesPasadoCount, promedioDiarioMesPasado, deltaMes,
      comparativo6Meses,
    };
  }, [ventasAccesibles, tiendaIds]);

  // Distribución por formato (las 3 categorías, en orden canónico).
  const distribucionFormatos = useMemo(() => {
    const grupos = {};
    tiendas.forEach((t) => {
      const k = normalizeFormato(t.formato);
      grupos[k] = (grupos[k] || 0) + 1;
    });
    return FORMATOS_ORDEN.map((f) => ({ formato: f, count: grupos[f] || 0 }));
  }, [tiendas]);

  // Distribución por estado, ordenada descendente.
  const distribucionEstados = useMemo(() => {
    const grupos = {};
    tiendas.forEach((t) => {
      const e = (t.estado || '').trim();
      if (!e) return;
      grupos[e] = (grupos[e] || 0) + 1;
    });
    return Object.entries(grupos)
      .map(([estado, count]) => ({ estado, count }))
      .sort((a, b) => b.count - a.count);
  }, [tiendas]);

  // Ranking de tiendas por ventas del mes.
  const topTiendasRanking = useMemo(() => {
    const inicioMes = startOfMonth(new Date());
    const delMes = ventasAccesibles.filter((v) => v._fecha >= inicioMes);
    const grupos = {};
    delMes.forEach((v) => {
      const tid = v.tiendaId || '';
      (grupos[tid] = grupos[tid] || []).push(v);
    });
    return Object.entries(grupos).map(([tid, ordenes]) => {
      const total = ordenes.reduce((s, o) => s + (o.total || 0), 0);
      const tienda = tiendas.find((t) => t.id === tid) || null;
      const nombre = tienda?.nombre || ordenes[0]?.tiendaNombre || 'Sin sucursal';
      return { nombre, total, ventasCount: ordenes.length, tienda };
    }).sort((a, b) => b.total - a.total);
  }, [ventasAccesibles, tiendas]);

  // Ranking de empleados por ventas del mes.
  const topEmpleadosRanking = useMemo(() => {
    const inicioMes = startOfMonth(new Date());
    const delMes = ventasAccesibles.filter((v) => v._fecha >= inicioMes);
    const grupos = {};
    delMes.forEach((v) => {
      const uid = v.empleadoId || '';
      if (!uid) return;
      (grupos[uid] = grupos[uid] || []).push(v);
    });
    return Object.entries(grupos).map(([uid, ordenes]) => {
      const total = ordenes.reduce((s, o) => s + (o.total || 0), 0);
      const emp = empleados.find((e) => e.uid === uid) || null;
      const nombre = nombreCompletoEmpleado(emp) || ordenes[0]?.nombreEmpleado || 'Empleado';
      return { nombre, total, ventasCount: ordenes.length, empleado: emp };
    }).sort((a, b) => b.total - a.total);
  }, [ventasAccesibles, empleados]);

  // Ranking de productos por unidades vendidas en el mes.
  const topProductos = useMemo(() => {
    const inicioMes = startOfMonth(new Date());
    const delMes = ventasAccesibles.filter((v) => v._fecha >= inicioMes);
    const porNombre = {};
    productosCatalogo.forEach((p) => { if (!porNombre[p.nombre]) porNombre[p.nombre] = p; });

    const agg = {};
    delMes.forEach((o) => {
      (o.productos || []).forEach((p) => {
        const cur = agg[p.nombre] || { cantidad: 0, total: 0, img: null };
        agg[p.nombre] = {
          cantidad: cur.cantidad + (p.cantidad || 0),
          total: cur.total + (p.precioConIVA || p.precio || 0) * (p.cantidad || 0),
          img: cur.img || p.imagenUrl || null,
        };
      });
    });

    return Object.entries(agg).map(([nombre, v]) => {
      const prod = porNombre[nombre];
      const imagenUrl = prod?.imagenUrl || prod?.imagenes?.[0] || v.img || null;
      return {
        nombre,
        cantidad: v.cantidad,
        total: v.total,
        imagenUrl,
        proveedor: prod?.proveedor || null,
      };
    }).sort((a, b) => b.cantidad - a.cantidad);
  }, [ventasAccesibles, productosCatalogo]);

  return {
    loading,
    empleado,
    staffFormato,
    tiendaCount: tiendaIds.size,
    ...metrics,
    distribucionFormatos,
    distribucionEstados,
    topTiendasRanking,
    topEmpleadosRanking,
    topProductos,
    recargar: cargarTodo,
  };
}

export default useInicioData;
