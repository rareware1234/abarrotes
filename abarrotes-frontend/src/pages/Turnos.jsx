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
  if (h < 18) return 'vespertino';
  return 'nocturno';
}

function shiftColor(inicio, descanso) {
  if (descanso) return { bg:'#F3F4F6', text:'#6B7C93', border:'#E4E6EA' };
  if (!inicio)  return { bg:'#EFF6FF', text:'#1D4ED8', border:'#BFDBFE' };
  const h = parseInt(inicio);
  if (h < 12)  return { bg:'#EFF6FF', text:'#1D4ED8', border:'#BFDBFE' };
  if (h < 18)  return { bg:'#FFFBEB', text:'#92400E', border:'#FDE68A' };
  return             { bg:'#EDE9FE', text:'#5B21B6', border:'#C4B5FD' };
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
  { label:'Mañana', inicio:'08:00', fin:'16:00' },
  { label:'Tarde',  inicio:'14:00', fin:'22:00' },
  { label:'Noche',  inicio:'22:00', fin:'06:00' },
  { label:'Medio',  inicio:'09:00', fin:'13:00' },
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
            <div style={{ fontSize:15, fontWeight:700, color:'#1C1E21' }}>
              {isNew ? 'Asignar turno' : 'Editar turno'}
            </div>
            <div style={{ fontSize:12, color:'#6B7C93', marginTop:3 }}>
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
            <span style={{ fontSize:14, fontWeight:500, color:'#1C1E21' }}>
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
                <span style={{ fontSize:13, color:'#6B7C93' }}>Duración total</span>
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
    <div className="horarios-container">

      {/* Header desktop */}
      <div className="horarios-header">
        <div>
          <h1 style={{ fontSize:28, fontWeight:700, margin:0, color:'#1C1E21' }}>
            Horarios
          </h1>
          <div className="horarios-week-label">{weekLabel}</div>
        </div>
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
      </div>

      {/* Leyenda */}
      <div className="horarios-legend">
        {[
          { label:'Mañana',   color:'#3B82F6' },
          { label:'Tarde',    color:'#F59E0B' },
          { label:'Noche',    color:'#7C3AED' },
          { label:'Descanso', color:'#9CA3AF' },
        ].map(l => (
          <div key={l.label} className="horarios-legend-item">
            <div className="horarios-legend-dot" style={{ background: l.color }} />
            {l.label}
          </div>
        ))}
      </div>

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
                        color: isToday ? 'var(--role-primary)' : '#6B7C93'
                      }}>
                        {DAYS_ES[day.getDay()]}
                      </div>
                      <div style={{
                        fontSize:20, fontWeight:700, lineHeight:1.2,
                        color: isToday ? 'var(--role-primary)' : '#1C1E21'
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
                    textAlign:'center', padding:48, color:'#6B7C93', fontSize:14
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
                            fontSize:13, fontWeight:600, color:'#1C1E21',
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
                      <span style={{
                        fontSize:13, fontWeight:700,
                        color: hrs > 0 ? 'var(--role-primary)' : '#C4CAD4'
                      }}>
                        {hrs > 0 ? `${hrs}h` : '—'}
                      </span>
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
    </div>
  );
}
