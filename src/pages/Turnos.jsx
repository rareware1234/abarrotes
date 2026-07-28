import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import * as turnoService from '../services/turnoService';
import * as empleadoService from '../services/empleadoService';
import '../styles/horarios.css';

/* ============================================================
   UTILIDADES
   ============================================================ */
const DAYS_ES   = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
const MONTHS_ES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

function getWeekStart(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day; // lunes como inicio
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function toYMD(date) {
  return date.toISOString().split('T')[0];
}

function calcHoras(inicio, fin) {
  if (!inicio || !fin) return 0;
  const [sh, sm] = inicio.split(':').map(Number);
  const [eh, em] = fin.split(':').map(Number);
  let mins = (eh * 60 + em) - (sh * 60 + sm);
  if (mins <= 0) mins += 24 * 60; // turno nocturno
  return Math.round(mins / 60 * 10) / 10;
}

function getTipoFromTime(inicio, descanso) {
  if (descanso) return 'descanso';
  if (!inicio) return 'matutino';
  const h = parseInt(inicio);
  if (h < 12) return 'matutino';
  // Swift TipoTurno has no 'nocturno' — use vespertino for late shifts
  if (h < 14) return 'vespertino';
  if (h < 19) return 'vespertino';
  return 'vespertino';
}

function shiftColor(inicio, descanso) {
  if (descanso) return { bg:'#F3F4F6', text:'var(--text-muted)', border:'#E4E6EA' };
  if (!inicio)  return { bg:'#EFF6FF', text:'#1D4ED8', border:'#BFDBFE' };
  const h = parseInt(inicio);
  if (h < 12)  return { bg:'#EFF6FF', text:'#1D4ED8', border:'#BFDBFE' };
  return             { bg:'#FFFBEB', text:'#92400E', border:'#FDE68A' };
}

/* ============================================================
   AVATAR
   ============================================================ */
const PALETTE = ['#1A7A48','#2563EB','#7C3AED','#DC2626','#D97706','#0891B2'];

function Avatar({ emp, size = 30 }) {
  const initials = (emp.nombre || '?')
    .split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
  const bg = PALETTE[(emp.nombre || '').charCodeAt(0) % PALETTE.length];
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: emp.fotoUrl ? 'transparent' : bg,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.36, fontWeight: 700, color: 'white', overflow: 'hidden'
    }}>
      {emp.fotoUrl
        ? <img src={emp.fotoUrl} alt={emp.nombre}
            style={{ width:'100%', height:'100%', objectFit:'cover' }} />
        : initials}
    </div>
  );
}

/* ============================================================
   SHIFT BLOCK
   ============================================================ */
function ShiftBlock({ turno, onClick }) {
  const isRest = turno.tipo === 'descanso';
  const c = shiftColor(turno.inicio, isRest);
  return (
    <div
      className="shift-block"
      onClick={e => { e.stopPropagation(); onClick(); }}
      style={{ background: c.bg, border: `1px solid ${c.border}` }}
    >
      {isRest ? (
        <div className="shift-block-rest" style={{ color: c.text }}>Descanso</div>
      ) : (
        <>
          <div className="shift-block-time" style={{ color: c.text }}>
            {turno.inicio} – {turno.fin}
          </div>
          <div className="shift-block-hours" style={{ color: c.text }}>
            {turno.horas}h
          </div>
        </>
      )}
    </div>
  );
}

/* ============================================================
   MODAL
   ============================================================ */
const QUICK = [
  { label:'Matutino',   inicio:'08:00', fin:'14:00' },
  { label:'Vespertino', inicio:'14:00', fin:'21:00' },
  { label:'Completo',   inicio:'08:00', fin:'21:00' },
  { label:'Medio',      inicio:'08:00', fin:'12:00' },
];

function ShiftModal({ turno, empleado, fecha, onClose, onSave, onDelete, canEdit }) {
  const isNew = !turno;
  const [descanso, setDescanso] = useState(turno?.tipo === 'descanso');
  const [inicio,   setInicio]   = useState(turno?.inicio || '08:00');
  const [fin,      setFin]      = useState(turno?.fin    || '16:00');
  const [notas,    setNotas]    = useState(turno?.notas  || '');
  const [saving,   setSaving]   = useState(false);
  const [deleting, setDeleting] = useState(false);

  const horas = useMemo(
    () => descanso ? 0 : calcHoras(inicio, fin),
    [descanso, inicio, fin]
  );

  const isQuickActive = q => !descanso && inicio === q.inicio && fin === q.fin;

  const handleSave = async () => {
    setSaving(true);
    try {
      const data = {
        empleadoId: empleado.uid || empleado.id,
        fecha,
        tipo:   getTipoFromTime(descanso ? null : inicio, descanso),
        inicio: descanso ? null : inicio,
        fin:    descanso ? null : fin,
        horas:  descanso ? 0    : horas,
        notas:  notas.trim(),
      };
      await onSave(data, turno?.id);
      onClose();
    } catch(e) { console.error(e); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try { await onDelete(turno.id); onClose(); }
    catch(e) { console.error(e); }
    finally { setDeleting(false); }
  };

  return (
    <div className="horarios-modal-overlay" onClick={onClose}>
      <div className="horarios-modal" onClick={e => e.stopPropagation()}>

        <div className="horarios-modal-header">
          <div>
            <div style={{ fontSize:15, fontWeight:700, color:'var(--text-dark)' }}>
              {isNew ? 'Asignar turno' : 'Editar turno'}
            </div>
            <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:3 }}>
              {empleado.nombre} · {fecha}
            </div>
          </div>
          <button className="horarios-close-btn" onClick={onClose}>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none"
                 stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6"  x2="6"  y2="18"/>
              <line x1="6"  y1="6"  x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="horarios-modal-body">

          {/* Descanso */}
          <label className="horarios-checkbox-row">
            <input type="checkbox" checked={descanso}
              onChange={e => setDescanso(e.target.checked)} disabled={!canEdit} />
            <span style={{ fontSize:14, fontWeight:500, color:'var(--text-dark)' }}>
              Día de descanso
            </span>
          </label>

          {!descanso && (
            <>
              <div>
                <span className="horarios-label">Turno rápido</span>
                <div className="horarios-quick-chips">
                  {QUICK.map(q => (
                    <button
                      key={q.label}
                      className={`horarios-quick-chip${isQuickActive(q) ? ' active' : ''}`}
                      onClick={() => { setInicio(q.inicio); setFin(q.fin); }}
                      disabled={!canEdit}
                    >
                      {q.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="horarios-time-grid">
                <div>
                  <span className="horarios-label">Entrada</span>
                  <input type="time" className="horarios-time-input"
                    value={inicio} onChange={e => setInicio(e.target.value)}
                    disabled={!canEdit} />
                </div>
                <div>
                  <span className="horarios-label">Salida</span>
                  <input type="time" className="horarios-time-input"
                    value={fin} onChange={e => setFin(e.target.value)}
                    disabled={!canEdit} />
                </div>
              </div>

              <div className="horarios-duration-pill">
                <span style={{ fontSize:13, color:'var(--text-muted)' }}>Duración total</span>
                <span style={{ fontSize:16, fontWeight:800, color:'var(--role-primary)' }}>
                  {horas}h
                </span>
              </div>
            </>
          )}

          <div>
            <span className="horarios-label">Notas</span>
            <input type="text" className="horarios-text-input"
              value={notas} onChange={e => setNotas(e.target.value)}
              placeholder="Opcional..." disabled={!canEdit} />
          </div>
        </div>

        {canEdit && (
          <div className="horarios-modal-footer">
            {!isNew && (
              <button className="horarios-btn-delete"
                onClick={handleDelete} disabled={deleting}>
                {deleting ? '…' : 'Eliminar'}
              </button>
            )}
            <button className="horarios-btn-save"
              onClick={handleSave} disabled={saving}>
              {saving ? 'Guardando…' : isNew ? 'Guardar' : 'Actualizar'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   COMPONENTE PRINCIPAL — Horarios
   ============================================================ */
export default function Turnos() {
  const { hasPermission, empleado: currentUser } = useAuth();
  const canEdit = hasPermission('turnos_editar') || hasPermission('turnos_crear');
  const isManager = currentUser?.rol === 'manager';

  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()));
  const [empleados, setEmpleados] = useState([]);
  const [turnos,    setTurnos]    = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [modal,     setModal]     = useState(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [confirmLimpiar, setConfirmLimpiar] = useState(false);
  const [confirmPlantilla, setConfirmPlantilla] = useState(false);
  const [showNomina, setShowNomina] = useState(false);

  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  );

  // Empleados activos — managers solo ven los de sus sucursales
  useEffect(() => {
    empleadoService.fetchAll().then(res => {
      if (!res.success) return;
      let lista = res.data.filter(e => e.activo !== false);

      if (isManager) {
        const misAsignadas = currentUser?.tiendasAsignadas || [];
        lista = lista.filter(emp => {
          const rolEmp = emp.rol?.toUpperCase();
          // excluir otros managers/admins
          if (['MANAGER', 'DIRECTOR', 'ADMIN', 'LIDER'].includes(rolEmp)) return false;
          const empTid = emp.tiendaAsignada || emp.tiendaId;
          return misAsignadas.includes(empTid) || emp.creadoPorUid === currentUser?.uid;
        });
      }

      setEmpleados(
        lista.sort((a, b) => (a.nombre || '').localeCompare(b.nombre || ''))
      );
    });
  }, [isManager, currentUser]);

  // Turnos de la semana
  const loadTurnos = useCallback(async () => {
    setLoading(true);
    try {
      const res = await turnoService.fetchSemana(weekStart);
      setTurnos(res.success ? res.data : []);
    } finally {
      setLoading(false);
    }
  }, [weekStart]);

  useEffect(() => { loadTurnos(); }, [loadTurnos]);

  // Mapa rápido: empleadoId → fecha → turno
  const turnoMap = useMemo(() => {
    const map = {};
    turnos.forEach(t => {
      if (!map[t.empleadoId]) map[t.empleadoId] = {};
      map[t.empleadoId][t.fecha] = t;
    });
    return map;
  }, [turnos]);

  // Horas semanales por empleado
  const weekHours = useMemo(() => {
    const map = {};
    empleados.forEach(emp => {
      const id = emp.uid || emp.id;
      map[id] = weekDays.reduce(
        (sum, day) => sum + (turnoMap[id]?.[toYMD(day)]?.horas || 0), 0
      );
    });
    return map;
  }, [empleados, weekDays, turnoMap]);

  const today = toYMD(new Date());

  const weekLabel = (() => {
    const s = weekStart, e = addDays(weekStart, 6);
    return `${s.getDate()} ${MONTHS_ES[s.getMonth()]} – ${e.getDate()} ${MONTHS_ES[e.getMonth()]} ${e.getFullYear()}`;
  })();

  // Stats — matching Swift HorariosView computed properties
  const SALARIO_POR_ROL = { staff: 62.50, manager: 93.75, admin: 125.00 };

  const stats = useMemo(() => {
    const weekYMDs = weekDays.map(toYMD);
    const semana = turnos.filter(t => weekYMDs.includes(t.fecha));
    const totalHoras = semana.reduce((s, t) => s + (t.horas || 0), 0);
    const turnosAsignados = semana.filter(t => t.tipo !== 'descanso').length;
    const descansos = semana.filter(t => t.tipo === 'descanso').length;
    const empIds = new Set(semana.map(t => t.empleadoId));
    const sinTurno = empleados.filter(e => !empIds.has(e.uid || e.id)).length;

    // Nómina: compute per-employee hours and estimated cost
    const nomina = empleados.map(emp => {
      const eid = emp.uid || emp.id || '';
      const turnosEmp = semana.filter(t => t.empleadoId === eid && t.tipo !== 'descanso');
      const horas = turnosEmp.reduce((s, t) => s + (t.horas || 0), 0);
      const salario = SALARIO_POR_ROL[emp.rol] || SALARIO_POR_ROL.staff;
      // LFT: first 40h regular, 40-48h double (2x), >48h triple (3x)
      const regulares = Math.min(horas, 40);
      const extras = Math.max(0, Math.min(horas - 40, 8));
      const triple = Math.max(0, horas - 48);
      // Prima dominical: +25% sobre las horas trabajadas en domingo (LFT, biblia §3.7).
      const horasDomingo = turnosEmp.reduce((s, t) => {
        const d = new Date(`${t.fecha}T00:00:00`).getDay(); // 0 = domingo
        return d === 0 ? s + (t.horas || 0) : s;
      }, 0);
      const primaDominical = horasDomingo * salario * 0.25;
      const costo = (regulares * salario) + (extras * salario * 2) + (triple * salario * 3) + primaDominical;
      return { emp, horas, extras: extras + triple, costo };
    });
    const costoSemana = nomina.reduce((s, n) => s + n.costo, 0);

    // LFT shift alerts
    const alertas = [];
    nomina.forEach(({ emp, horas, extras }) => {
      if (horas > 48) alertas.push({ nombre: emp.nombre, msg: `Excede 48h (${horas}h) — ilegal LFT` });
      else if (extras > 9) alertas.push({ nombre: emp.nombre, msg: `+9h extras — se pagan triple` });
      const eid = emp.uid || emp.id || '';
      const turnosEmp = semana.filter(t => t.empleadoId === eid);
      const descansosEmp = weekYMDs.filter(d => !turnosEmp.some(t => t.fecha === d && t.tipo !== 'descanso'));
      if (descansosEmp.length < 2) alertas.push({ nombre: emp.nombre, msg: 'Menos de 2 días de descanso' });
      else {
        const idxs = descansosEmp.map(d => weekYMDs.indexOf(d)).sort((a,b) => a-b);
        if (idxs.length >= 2 && idxs[1] - idxs[0] > 1) alertas.push({ nombre: emp.nombre, msg: 'Descansos no consecutivos' });
      }
    });

    return { totalHoras, turnosAsignados, descansos, sinTurno, costoSemana, alertas, nomina };
  }, [turnos, empleados, weekDays]);

  const handleCopiarSemana = async () => {
    setBulkLoading(true);
    const res = await turnoService.copiarSemanaAnterior(weekStart);
    if (res.success) await loadTurnos();
    setBulkLoading(false);
  };

  const handleLimpiarSemana = async () => {
    setBulkLoading(true);
    setConfirmLimpiar(false);
    const res = await turnoService.limpiarSemana(weekStart);
    if (res.success) await loadTurnos();
    setBulkLoading(false);
  };

  const handleAplicarPlantilla = async () => {
    setBulkLoading(true);
    setConfirmPlantilla(false);
    const res = await turnoService.aplicarPlantillaSemanal(toYMD(weekStart), empleados);
    if (res.success) await loadTurnos();
    setBulkLoading(false);
  };

  const handleAutoDescansos = async () => {
    setBulkLoading(true);
    const res = await turnoService.autoAsignarDescansos(toYMD(weekStart), empleados);
    if (res.success) await loadTurnos();
    setBulkLoading(false);
  };

  const openModal = (emp, day) => {
    if (!canEdit) return;
    const fecha = toYMD(day);
    const id    = emp.uid || emp.id;
    setModal({ empleado: emp, fecha, turno: turnoMap[id]?.[fecha] });
  };

  const handleSave = async (data, id) => {
    if (id) await turnoService.update(id, data);
    else    await turnoService.crear(data);
    await loadTurnos();
  };

  const handleDelete = async (id) => {
    await turnoService.remove(id);
    await loadTurnos();
  };

  return (
    <div className="horarios-container inicio-page">
      <div className="inicio-inner" style={{ gap: 20 }}>
        <header className="inicio-header">
          <h1>Horarios</h1>
          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
            <button className="horarios-nav-btn"
              onClick={() => setWeekStart(d => addDays(d, -7))}>
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none"
                   stroke="currentColor" strokeWidth="2.5">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
            </button>
            <button className="horarios-today-btn"
              onClick={() => setWeekStart(getWeekStart(new Date()))}>
              Hoy
            </button>
            <button className="horarios-nav-btn"
              onClick={() => setWeekStart(d => addDays(d, 7))}>
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none"
                   stroke="currentColor" strokeWidth="2.5">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </button>
          </div>
        </header>
      <div style={{ padding: '0 20px', paddingBottom: 32 }}>

      {/* Stats bar */}
      <div style={{ display:'flex', gap:10, padding:'0 0 4px', flexWrap:'wrap' }}>
        {[
          { label:'Horas sem.',    value: `${stats.totalHoras}h`,     icon:'bi-clock-fill',       color:'var(--role-primary)' },
          { label:'Turnos',        value: stats.turnosAsignados,      icon:'bi-calendar-check-fill', color:'#2563EB' },
          { label:'Descansos',     value: stats.descansos,            icon:'bi-moon-stars-fill',  color:'#7C3AED' },
          { label:'Sin turno',     value: stats.sinTurno,             icon:'bi-person-x-fill',    color: stats.sinTurno > 0 ? '#EF4444' : '#9CA3AF' },
          { label:'Costo est.',    value: stats.costoSemana > 0 ? `$${(stats.costoSemana/1000).toFixed(1)}K` : '$0', icon:'bi-cash-coin', color:'#10B981' },
        ].map(s => (
          <div key={s.label} style={{ background:'white', border:'1px solid var(--border, #e5e7eb)', borderRadius:10, padding:'8px 14px', display:'flex', alignItems:'center', gap:8, minWidth:90 }}>
            <i className={`bi ${s.icon}`} style={{ color: s.color, fontSize:14 }} />
            <div>
              <div style={{ fontSize:16, fontWeight:800, color:'var(--text-dark)', lineHeight:1 }}>{s.value}</div>
              <div style={{ fontSize:9, color:'#9CA3AF', fontWeight:600, textTransform:'uppercase', letterSpacing:0.5, marginTop:2 }}>{s.label}</div>
            </div>
          </div>
        ))}
        {canEdit && stats.nomina?.length > 0 && (
          <button
            onClick={() => setShowNomina(v => !v)}
            style={{ background: showNomina ? 'var(--role-primary)' : 'white', border:`1px solid ${showNomina ? 'var(--role-primary)' : 'var(--border, #e5e7eb)'}`, borderRadius:10, padding:'8px 14px', display:'flex', alignItems:'center', gap:6, cursor:'pointer', color: showNomina ? 'white' : 'var(--text-dark)', fontWeight:600, fontSize:12, whiteSpace:'nowrap' }}
          >
            <i className="bi bi-currency-dollar" style={{ fontSize:14 }} />
            Nómina
          </button>
        )}
        {canEdit && (
          <div style={{ marginLeft:'auto', display:'flex', gap:6, alignItems:'center' }}>
            <button
              onClick={handleCopiarSemana}
              disabled={bulkLoading}
              style={{ background:'white', border:'1px solid var(--border, #e5e7eb)', borderRadius:8, padding:'6px 12px', fontSize:12, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', gap:6 }}
            >
              <i className="bi bi-calendar2-week" /> Copiar sem. anterior
            </button>
            <button
              onClick={() => setConfirmPlantilla(true)}
              disabled={bulkLoading}
              style={{ background:'white', border:'1px solid var(--border, #e5e7eb)', borderRadius:8, padding:'6px 12px', fontSize:12, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', gap:6 }}
            >
              <i className="bi bi-layout-wtf" /> Plantilla estándar
            </button>
            <button
              onClick={handleAutoDescansos}
              disabled={bulkLoading}
              style={{ background:'rgba(124,58,237,0.06)', border:'1px solid rgba(124,58,237,0.2)', color:'#7C3AED', borderRadius:8, padding:'6px 12px', fontSize:12, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', gap:6 }}
            >
              <i className="bi bi-moon-stars" /> Auto descansos
            </button>
            <button
              onClick={() => setConfirmLimpiar(true)}
              disabled={bulkLoading}
              style={{ background:'rgba(239,68,68,0.06)', border:'1px solid rgba(239,68,68,0.2)', color:'#EF4444', borderRadius:8, padding:'6px 12px', fontSize:12, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', gap:6 }}
            >
              <i className="bi bi-trash3" /> Limpiar semana
            </button>
          </div>
        )}
      </div>

      {/* Scheduling progress bar */}
      {empleados.length > 0 && (() => {
        const totalPosible = empleados.length * 7;
        const frac = totalPosible > 0 ? stats.turnosAsignados / totalPosible : 0;
        const pct = Math.round(frac * 100);
        const complete = pct >= 100;
        return (
          <div style={{ marginBottom:8, background:'white', border:'1px solid var(--border, #e5e7eb)', borderRadius:10, padding:'10px 14px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6, fontSize:12 }}>
              <span style={{ fontWeight:600, color:'var(--text-dark)' }}>Planificación {pct}%</span>
              <span style={{ color: complete ? 'var(--role-primary)' : '#F0A500', fontWeight:600 }}>
                {complete ? 'Semana completa ✓' : `${stats.turnosAsignados} de ${totalPosible} turnos`}
              </span>
            </div>
            <div style={{ height:5, borderRadius:999, background:'#F3F4F6', overflow:'hidden' }}>
              <div style={{ height:'100%', width:`${Math.min(100, pct)}%`, borderRadius:999, background: complete ? 'var(--role-primary)' : '#F0A500', transition:'width 0.4s ease' }} />
            </div>
          </div>
        );
      })()}

      {/* Leyenda */}
      <div className="horarios-legend">
        {[
          { label:'Matutino',   color:'#3B82F6' },
          { label:'Vespertino', color:'#F59E0B' },
          { label:'Descanso',   color:'#9CA3AF' },
        ].map(l => (
          <div key={l.label} className="horarios-legend-item">
            <div className="horarios-legend-dot" style={{ background: l.color }} />
            {l.label}
          </div>
        ))}
      </div>

      {/* Alertas LFT */}
      {stats.alertas.length > 0 && (
        <div style={{ display:'flex', flexDirection:'column', gap:6, marginBottom:8 }}>
          {stats.alertas.map((a, i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:10, background:'rgba(239,68,68,0.06)', border:'1px solid rgba(239,68,68,0.18)', borderRadius:10, padding:'8px 14px' }}>
              <i className="bi bi-exclamation-triangle-fill" style={{ color:'#EF4444', fontSize:13, flexShrink:0 }} />
              <span style={{ fontSize:12, fontWeight:600, color:'#EF4444' }}>{a.nombre}</span>
              <span style={{ fontSize:12, color:'#7F1D1D' }}>·</span>
              <span style={{ fontSize:12, color:'#7F1D1D' }}>{a.msg}</span>
            </div>
          ))}
        </div>
      )}

      {/* Tabla / loader */}
      {loading ? (
        <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <span className="spinner-border" />
        </div>
      ) : (
        <div className="horarios-scroll">
          <table className="horarios-table">
            <thead>
              <tr>
                <th className="horarios-th-emp">Empleado</th>
                {weekDays.map(day => {
                  const ymd     = toYMD(day);
                  const isToday = ymd === today;
                  return (
                    <th key={ymd}
                        className={`horarios-th-day${isToday ? ' today' : ''}`}>
                      <div style={{
                        fontSize:11, fontWeight:600, textTransform:'uppercase',
                        letterSpacing:0.5,
                        color: isToday ? 'var(--role-primary)' : 'var(--text-muted)'
                      }}>
                        {DAYS_ES[day.getDay()]}
                      </div>
                      <div style={{
                        fontSize:20, fontWeight:700, lineHeight:1.2,
                        color: isToday ? 'var(--role-primary)' : 'var(--text-dark)'
                      }}>
                        {day.getDate()}
                      </div>
                    </th>
                  );
                })}
                <th className="horarios-th-total">Horas</th>
              </tr>
            </thead>

            <tbody>
              {empleados.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{
                    textAlign:'center', padding:48, color:'var(--text-muted)', fontSize:14
                  }}>
                    No hay empleados activos
                  </td>
                </tr>
              ) : empleados.map(emp => {
                const id  = emp.uid || emp.id;
                const hrs = weekHours[id] || 0;
                return (
                  <tr key={id} className="horarios-row">
                    <td className="horarios-td-emp">
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <Avatar emp={emp} size={30} />
                        <div style={{ minWidth:0 }}>
                          <div style={{
                            fontSize:13, fontWeight:600, color:'var(--text-dark)',
                            whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'
                          }}>
                            {emp.nombre}
                          </div>
                          <div style={{ fontSize:10, color:'#9CA3AF', textTransform:'capitalize' }}>
                            {(emp.rol || '').toLowerCase()}
                          </div>
                        </div>
                      </div>
                    </td>

                    {weekDays.map(day => {
                      const fecha   = toYMD(day);
                      const turno   = turnoMap[id]?.[fecha];
                      const isToday = fecha === today;
                      return (
                        <td
                          key={fecha}
                          className={[
                            'horarios-td-day',
                            isToday  ? 'today'    : '',
                            canEdit  ? 'editable' : '',
                          ].filter(Boolean).join(' ')}
                          onClick={() => openModal(emp, day)}
                        >
                          {turno ? (
                            <ShiftBlock turno={turno} onClick={() => openModal(emp, day)} />
                          ) : canEdit ? (
                            <div className="horarios-add-hint">
                              <svg viewBox="0 0 24 24" width="13" height="13" fill="none"
                                   stroke="currentColor" strokeWidth="2.5">
                                <line x1="12" y1="5" x2="12" y2="19"/>
                                <line x1="5"  y1="12" x2="19" y2="12"/>
                              </svg>
                            </div>
                          ) : null}
                        </td>
                      );
                    })}

                    <td className="horarios-td-total">
                      {hrs > 0 ? (
                        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:1 }}>
                          <span style={{
                            fontSize:13, fontWeight:700,
                            color: hrs >= 48 ? '#EF4444' : hrs > 40 ? '#F97316' : 'var(--role-primary)'
                          }}>
                            {hrs}h
                          </span>
                          <span style={{ fontSize:10, color:'#9CA3AF', fontWeight:500 }}>
                            ${Math.round((stats.nomina.find(n => (n.emp.uid || n.emp.id) === id)?.costo) || 0).toLocaleString('es-MX')}
                          </span>
                        </div>
                      ) : (
                        <span style={{ fontSize:13, fontWeight:700, color:'#C4CAD4' }}>—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <ShiftModal
          turno={modal.turno}
          empleado={modal.empleado}
          fecha={modal.fecha}
          onClose={() => setModal(null)}
          onSave={handleSave}
          onDelete={handleDelete}
          canEdit={canEdit}
        />
      )}

      {confirmLimpiar && (
        <div className="horarios-modal-overlay" onClick={() => setConfirmLimpiar(false)}>
          <div className="horarios-modal" style={{ maxWidth:340 }} onClick={e => e.stopPropagation()}>
            <div style={{ padding:'20px 20px 0' }}>
              <div style={{ fontSize:15, fontWeight:700, marginBottom:8 }}>Limpiar semana</div>
              <p style={{ fontSize:13, color:'var(--text-muted)', margin:0 }}>
                Esto eliminará todos los turnos de la semana del {weekLabel}. ¿Continuar?
              </p>
            </div>
            <div className="horarios-modal-footer" style={{ padding:16, display:'flex', gap:8 }}>
              <button onClick={() => setConfirmLimpiar(false)} style={{ flex:1, padding:'10px 0', borderRadius:8, border:'1px solid var(--border, #e5e7eb)', background:'white', cursor:'pointer', fontSize:13, fontWeight:600 }}>
                Cancelar
              </button>
              <button onClick={handleLimpiarSemana} style={{ flex:1, padding:'10px 0', borderRadius:8, border:'none', background:'#EF4444', color:'white', cursor:'pointer', fontSize:13, fontWeight:700 }}>
                Limpiar
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmPlantilla && (
        <div className="horarios-modal-overlay" onClick={() => setConfirmPlantilla(false)}>
          <div className="horarios-modal" style={{ maxWidth:360 }} onClick={e => e.stopPropagation()}>
            <div style={{ padding:'20px 20px 0' }}>
              <div style={{ fontSize:15, fontWeight:700, marginBottom:8 }}>Aplicar plantilla estándar</div>
              <p style={{ fontSize:13, color:'var(--text-muted)', margin:0 }}>
                Se asignarán turnos donde no haya ninguno: Lun–Vie completo, Sáb medio, Dom descanso. Los turnos existentes no se modificarán.
              </p>
            </div>
            <div className="horarios-modal-footer" style={{ padding:16, display:'flex', gap:8 }}>
              <button onClick={() => setConfirmPlantilla(false)} style={{ flex:1, padding:'10px 0', borderRadius:8, border:'1px solid var(--border, #e5e7eb)', background:'white', cursor:'pointer', fontSize:13, fontWeight:600 }}>
                Cancelar
              </button>
              <button onClick={handleAplicarPlantilla} style={{ flex:1, padding:'10px 0', borderRadius:8, border:'none', background:'var(--role-primary)', color:'white', cursor:'pointer', fontSize:13, fontWeight:700 }}>
                Aplicar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Nómina Semanal Panel (matching Swift HorariosView nominaSemanal) ── */}
      {showNomina && stats.nomina?.length > 0 && (
        <div style={{ marginTop:16, background:'white', border:'1px solid var(--border, #e5e7eb)', borderRadius:14, overflow:'hidden' }}>
          <div style={{ padding:'14px 16px', borderBottom:'1px solid var(--border, #e5e7eb)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div>
              <span style={{ fontSize:14, fontWeight:700, color:'var(--text-dark)' }}>Nómina Semanal</span>
              <span style={{ fontSize:12, color:'#9CA3AF', marginLeft:8 }}>{weekLabel}</span>
            </div>
            <div style={{ fontSize:15, fontWeight:800, color:'var(--role-primary)' }}>
              ${stats.costoSemana.toLocaleString('es-MX', { maximumFractionDigits:0 })} est.
            </div>
          </div>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ background:'#F9FAFB' }}>
                <th style={{ padding:'9px 14px', textAlign:'left', fontSize:11, fontWeight:700, color:'#6B7280', textTransform:'uppercase', letterSpacing:0.5 }}>Empleado</th>
                <th style={{ padding:'9px 8px', textAlign:'center', fontSize:11, fontWeight:700, color:'#6B7280', textTransform:'uppercase', letterSpacing:0.5 }}>Horas</th>
                <th style={{ padding:'9px 8px', textAlign:'center', fontSize:11, fontWeight:700, color:'#6B7280', textTransform:'uppercase', letterSpacing:0.5 }}>Regulares</th>
                <th style={{ padding:'9px 8px', textAlign:'center', fontSize:11, fontWeight:700, color:'#EF4444', textTransform:'uppercase', letterSpacing:0.5 }}>Extras</th>
                <th style={{ padding:'9px 14px', textAlign:'right', fontSize:11, fontWeight:700, color:'#6B7280', textTransform:'uppercase', letterSpacing:0.5 }}>Costo est.</th>
              </tr>
            </thead>
            <tbody>
              {stats.nomina.filter(n => n.horas > 0).map((n, i, arr) => (
                <tr key={n.emp.uid || n.emp.id} style={{ borderTop:'1px solid var(--border, #e5e7eb)' }}>
                  <td style={{ padding:'10px 14px' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <Avatar emp={n.emp} size={26} />
                      <div>
                        <div style={{ fontSize:13, fontWeight:600, color:'var(--text-dark)' }}>{n.emp.nombre}</div>
                        <div style={{ fontSize:10, color:'#9CA3AF', textTransform:'capitalize' }}>{(n.emp.rol||'').toLowerCase()}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding:'10px 8px', textAlign:'center' }}>
                    <span style={{ fontSize:14, fontWeight:700, color: n.horas > 48 ? '#EF4444' : n.horas > 40 ? '#F97316' : 'var(--text-dark)' }}>{n.horas}h</span>
                  </td>
                  <td style={{ padding:'10px 8px', textAlign:'center' }}>
                    <span style={{ fontSize:13, color:'#6B7280' }}>{Math.min(n.horas, 40)}h</span>
                  </td>
                  <td style={{ padding:'10px 8px', textAlign:'center' }}>
                    {n.extras > 0
                      ? <span style={{ fontSize:12, fontWeight:700, color:'#EF4444', background:'#FEF2F2', padding:'2px 8px', borderRadius:20 }}>+{n.extras}h</span>
                      : <span style={{ fontSize:13, color:'#D1D5DB' }}>—</span>
                    }
                  </td>
                  <td style={{ padding:'10px 14px', textAlign:'right' }}>
                    <span style={{ fontSize:14, fontWeight:700, color:'var(--role-primary)' }}>
                      ${n.costo.toLocaleString('es-MX', { maximumFractionDigits:0 })}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ borderTop:'2px solid var(--border, #e5e7eb)', background:'#F9FAFB' }}>
                <td colSpan={4} style={{ padding:'10px 14px', fontSize:13, fontWeight:700, color:'#6B7280' }}>Total estimado de la semana</td>
                <td style={{ padding:'10px 14px', textAlign:'right', fontSize:15, fontWeight:800, color:'var(--role-primary)' }}>
                  ${stats.costoSemana.toLocaleString('es-MX', { maximumFractionDigits:0 })}
                </td>
              </tr>
            </tfoot>
          </table>
          <div style={{ padding:'10px 14px', fontSize:11, color:'#9CA3AF', borderTop:'1px solid var(--border, #e5e7eb)' }}>
            * Estimado basado en salarios: Staff $62.50/h · Manager $93.75/h · Admin $125/h (horas extras al doble, más de 48h al triple — LFT)
          </div>
        </div>
      )}
      </div>{/* end padding wrapper */}
      </div>{/* end inicio-inner */}
    </div>
  );
}
