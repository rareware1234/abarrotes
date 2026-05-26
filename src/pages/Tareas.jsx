import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import tareaService from '../services/tareaService';
import empleadoService from '../services/empleadoService';
import '../styles/tareas-reminders.css';

const PRIORIDADES = {
  alta:  { label: 'Alta',  color: '#EF4444' },
  media: { label: 'Media', color: '#F59E0B' },
  baja:  { label: 'Baja',  color: '#22C55E' },
};

const DIAS_LABEL = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

const emptyForm = {
  titulo: '', notas: '', prioridad: 'media',
  vencimiento: '', hora: '',
  asignadoA: '', categoria: '',
  recurrente: false, frecuencia: 'diaria', diasSemana: [],
};

/* ── helpers de fecha ── */
const todayDate = () => { const d = new Date(); d.setHours(0,0,0,0); return d; };
const parseDate = (s) => s ? new Date(s + 'T00:00:00') : null;

/* ─────────────────────────────────────────────────
   TareaRow
───────────────────────────────────────────────── */
const TareaRow = ({ tarea, expanded, onToggle, onComplete, onEdit, onDelete }) => {
  const today = todayDate();
  const d     = parseDate(tarea.vencimiento);
  const overdue = d && d < today && tarea.estado !== 'completada';
  const done    = tarea.estado === 'completada';

  const formatDate = () => {
    if (!d) return null;
    const diff = Math.round((d - today) / 86400000);
    const hora = tarea.hora ? ` · ${tarea.hora}` : '';
    if (diff < -1) return `Hace ${Math.abs(diff)} días${hora}`;
    if (diff === -1) return `Ayer${hora}`;
    if (diff === 0)  return `Hoy${hora}`;
    if (diff === 1)  return `Mañana${hora}`;
    return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' }) + hora;
  };

  const prioColor = PRIORIDADES[tarea.prioridad]?.color || '#CBD5E1';
  const dateStr   = formatDate();

  return (
    <div className={`reminders-row${done ? ' completed' : ''}`}>
      <div className="reminders-row-main" onClick={onToggle}>
        <button
          className={`reminders-circle${done ? ' done' : ''}`}
          style={{ '--prio-color': prioColor }}
          onClick={e => { e.stopPropagation(); onComplete(); }}
        >
          {done && (
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
        </button>

        <div className="reminders-row-content">
          <div className={`reminders-row-title${done ? ' done' : ''}`}>{tarea.titulo}</div>
          {(dateStr || tarea.asignadoA || tarea.recurrente) && (
            <div className="reminders-row-meta">
              {dateStr && <span className={`reminders-date${overdue ? ' overdue' : ''}`}>{dateStr}</span>}
              {tarea.asignadoA && <span className="reminders-assignee">· {tarea.asignadoA}</span>}
              {tarea.recurrente && <span className="reminders-recurrence">↻</span>}
            </div>
          )}
        </div>

        <svg className="reminders-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points={expanded ? '18 15 12 9 6 15' : '6 9 12 15 18 9'} />
        </svg>
      </div>

      {expanded && (
        <div className="reminders-row-actions">
          {tarea.notas && <div className="reminders-notes">{tarea.notas}</div>}
          <button className="reminders-action-btn edit" onClick={onEdit}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
            Editar
          </button>
          <button className="reminders-action-btn delete" onClick={onDelete}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15">
              <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
            </svg>
            Eliminar
          </button>
        </div>
      )}
    </div>
  );
};

/* ─────────────────────────────────────────────────
   TareaModal
───────────────────────────────────────────────── */
const TareaModal = ({ formData, setFormData, editingTarea, empleados, onSave, onClose }) => {
  const toggleDia = (i) => {
    const dias = formData.diasSemana.includes(i)
      ? formData.diasSemana.filter(d => d !== i)
      : [...formData.diasSemana, i];
    setFormData({ ...formData, diasSemana: dias });
  };

  return (
    <div className="reminders-modal-overlay" onClick={onClose}>
      <div className="reminders-modal" onClick={e => e.stopPropagation()}>
        <div className="reminders-modal-handle" />

        <div className="reminders-modal-header">
          <button className="reminders-modal-cancel" onClick={onClose}>Cancelar</button>
          <h3>{editingTarea ? 'Editar tarea' : 'Nueva tarea'}</h3>
          <button
            className="reminders-modal-save"
            onClick={onSave}
            disabled={!formData.titulo.trim()}
          >
            {editingTarea ? 'Guardar' : 'Añadir'}
          </button>
        </div>

        <div className="reminders-modal-body">

          {/* Título + Notas */}
          <div className="reminders-modal-section">
            <input
              autoFocus
              type="text"
              placeholder="Título"
              value={formData.titulo}
              onChange={e => setFormData({ ...formData, titulo: e.target.value })}
              className="reminders-modal-title-input"
              onKeyDown={e => e.key === 'Enter' && formData.titulo.trim() && onSave()}
            />
            <textarea
              placeholder="Notas"
              value={formData.notas}
              onChange={e => setFormData({ ...formData, notas: e.target.value })}
              className="reminders-modal-notes-input"
              rows={2}
            />
          </div>

          {/* Fecha y hora */}
          <div className="reminders-modal-section reminders-modal-row">
            <div className="reminders-modal-field">
              <label>Fecha</label>
              <input
                type="date"
                value={formData.vencimiento}
                onChange={e => setFormData({ ...formData, vencimiento: e.target.value })}
              />
            </div>
            <div className="reminders-modal-field">
              <label>Hora</label>
              <input
                type="time"
                value={formData.hora}
                onChange={e => setFormData({ ...formData, hora: e.target.value })}
                disabled={!formData.vencimiento}
              />
            </div>
          </div>

          {/* Prioridad */}
          <div className="reminders-modal-section">
            <div className="reminders-modal-label">Prioridad</div>
            <div className="reminders-prio-seg">
              {Object.entries(PRIORIDADES).map(([key, val]) => (
                <button
                  key={key}
                  className={`reminders-prio-opt${formData.prioridad === key ? ' active' : ''}`}
                  style={{ '--c': val.color }}
                  onClick={() => setFormData({ ...formData, prioridad: key })}
                >
                  <span className="reminders-prio-dot" />
                  {val.label}
                </button>
              ))}
            </div>
          </div>

          {/* Asignado + Categoría */}
          <div className="reminders-modal-section reminders-modal-row">
            <div className="reminders-modal-field">
              <label>Asignar a</label>
              <select
                value={formData.asignadoA}
                onChange={e => setFormData({ ...formData, asignadoA: e.target.value })}
              >
                <option value="">Sin asignar</option>
                {empleados.map(emp => (
                  <option key={emp.id} value={emp.nombre}>{emp.nombre}</option>
                ))}
              </select>
            </div>
            <div className="reminders-modal-field">
              <label>Categoría</label>
              <select
                value={formData.categoria}
                onChange={e => setFormData({ ...formData, categoria: e.target.value })}
              >
                <option value="">General</option>
                {['Inventario','Limpieza','Caja','Mantenimiento'].map(c => (
                  <option key={c} value={c.toLowerCase()}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Repetir */}
          <div className="reminders-modal-section">
            <div className="reminders-modal-toggle-row">
              <div>
                <div className="reminders-modal-label">Repetir</div>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Tarea recurrente
                </div>
              </div>
              <button
                className={`reminders-toggle${formData.recurrente ? ' on' : ''}`}
                onClick={() => setFormData({ ...formData, recurrente: !formData.recurrente })}
              />
            </div>

            {formData.recurrente && (
              <>
                <select
                  value={formData.frecuencia}
                  onChange={e => setFormData({ ...formData, frecuencia: e.target.value })}
                  style={{ marginTop: '12px', width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1.5px solid var(--border)', fontSize: '14px', background: '#F8F9FA', fontFamily: 'var(--font-family)' }}
                >
                  <option value="diaria">Diaria</option>
                  <option value="semanal">Semanal</option>
                  <option value="quincenal">Quincenal</option>
                  <option value="mensual">Mensual</option>
                </select>
                {formData.frecuencia === 'semanal' && (
                  <div className="reminders-dias-semana">
                    {DIAS_LABEL.map((d, i) => (
                      <button
                        key={i}
                        className={`reminders-dia-btn${formData.diasSemana.includes(i) ? ' active' : ''}`}
                        onClick={() => toggleDia(i)}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────
   Tareas (página principal)
───────────────────────────────────────────────── */
const Tareas = () => {
  const { empleado } = useAuth();
  const [tareas,     setTareas]     = useState([]);
  const [empleados,  setEmpleados]  = useState([]);
  const [plantillas, setPlantillas] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [filtro,     setFiltro]     = useState('todas');
  const [showModal,  setShowModal]  = useState(false);
  const [editingTarea, setEditingTarea] = useState(null);
  const [formData,   setFormData]   = useState(emptyForm);
  const [showPlantillas,  setShowPlantillas]  = useState(false);
  const [showCompletadas, setShowCompletadas] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [quickAdd,   setQuickAdd]   = useState('');

  /* Navbar + button event */
  useEffect(() => {
    const handler = () => openNuevaTarea();
    window.addEventListener('open-nueva-tarea', handler);
    return () => window.removeEventListener('open-nueva-tarea', handler);
  }, []);

  useEffect(() => { fetchData(); }, [filtro]);

  const fetchData = async () => {
    setLoading(true);
    const [tRes, pRes, eRes] = await Promise.all([
      filtro === 'mis_tareas'
        ? tareaService.fetchPorEmpleado(empleado?.uid)
        : tareaService.fetchTodas(),
      tareaService.fetchPlantillas(),
      empleadoService.fetchAll(),
    ]);
    if (tRes.success) setTareas(tRes.data);
    if (pRes.success) setPlantillas(pRes.data);
    if (eRes.success) setEmpleados(eRes.data);
    setLoading(false);
  };

  const openNuevaTarea = () => {
    setEditingTarea(null);
    setFormData(emptyForm);
    setShowModal(true);
  };

  const openEditTarea = (t) => {
    setEditingTarea(t);
    setFormData({
      titulo:     t.titulo     || '',
      notas:      t.notas      || '',
      prioridad:  t.prioridad  || 'media',
      vencimiento: t.vencimiento || '',
      hora:       t.hora       || '',
      asignadoA:  t.asignadoA  || '',
      categoria:  t.categoria  || '',
      recurrente: t.recurrente || false,
      frecuencia: t.frecuencia || 'diaria',
      diasSemana: t.diasSemana || [],
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.titulo.trim()) return;
    const result = editingTarea
      ? await tareaService.update(editingTarea.id, formData)
      : await tareaService.crear(formData);
    if (result.success) { setShowModal(false); fetchData(); }
  };

  const handleToggleComplete = async (t) => {
    if (t.estado === 'completada') {
      await tareaService.update(t.id, { estado: 'pendiente' });
    } else {
      await tareaService.completar(t.id);
    }
    fetchData();
  };

  const handleEliminar = async (id) => {
    await tareaService.remove(id);
    setExpandedId(null);
    fetchData();
  };

  const handleQuickAdd = async (e) => {
    if (e.key === 'Enter' && quickAdd.trim()) {
      await tareaService.crear({ ...emptyForm, titulo: quickAdd.trim() });
      setQuickAdd('');
      fetchData();
    }
  };

  const usarPlantilla = async (p) => {
    await tareaService.crear({
      titulo: p.nombre, notas: p.notas || '',
      prioridad: p.prioridad || 'media',
      asignadoA: p.asignadoA || '', categoria: p.categoria || '',
      recurrente: true, frecuencia: p.frecuencia || 'diaria',
      diasSemana: p.diasSemana || [],
      vencimiento: '', hora: '',
    });
    fetchData();
  };

  /* ── grouping ── */
  const today    = todayDate();
  const nextWeek = new Date(today); nextWeek.setDate(today.getDate() + 7);

  const pendientes  = tareas.filter(t => t.estado !== 'completada');
  const completadas = tareas.filter(t => t.estado === 'completada');

  let filtradas = pendientes;
  if (filtro === 'hoy') {
    filtradas = pendientes.filter(t => {
      const d = parseDate(t.vencimiento);
      return d && d <= today;
    });
  } else if (filtro === 'programadas') {
    filtradas = pendientes.filter(t => t.vencimiento);
  }
  // 'mis_tareas' ya viene filtrado por el servicio

  const shouldGroup = filtro === 'todas' || filtro === 'mis_tareas';
  const groups = shouldGroup ? [
    { key: 'hoy',       label: 'Hoy / Atrasadas', items: filtradas.filter(t => { const d = parseDate(t.vencimiento); return d && d <= today; }) },
    { key: 'semana',    label: 'Esta semana',      items: filtradas.filter(t => { const d = parseDate(t.vencimiento); return d && d > today && d <= nextWeek; }) },
    { key: 'despues',   label: 'Más adelante',     items: filtradas.filter(t => { const d = parseDate(t.vencimiento); return d && d > nextWeek; }) },
    { key: 'sin_fecha', label: 'Sin fecha',        items: filtradas.filter(t => !t.vencimiento) },
  ].filter(g => g.items.length > 0) : [
    { key: 'main', label: null, items: filtradas }
  ];

  const countHoy       = pendientes.filter(t => { const d = parseDate(t.vencimiento); return d && d <= today; }).length;
  const countProgramadas = pendientes.filter(t => t.vencimiento).length;

  return (
    <div className="tareas-reminders">

      {/* Header — mismo diseño que Productos */}
      <div className="tiendas-header">
        <div>
          <h1>Tareas</h1>
          <div className="tiendas-subtitle">
            {pendientes.length} pendiente{pendientes.length !== 1 ? 's' : ''}
          </div>
        </div>
        <div className="tiendas-header-actions">
          <button className="tiendas-add-btn" onClick={openNuevaTarea}>+</button>
        </div>
      </div>

      {/* Filter chips */}
      <div className="reminders-filters">
        {[
          { key: 'todas',      label: 'Todas',       count: pendientes.length },
          { key: 'hoy',        label: 'Hoy',          count: countHoy },
          { key: 'programadas',label: 'Programadas',  count: countProgramadas },
          { key: 'mis_tareas', label: 'Mis tareas',   count: null },
        ].map(f => (
          <button
            key={f.key}
            className={`reminders-filter-btn${filtro === f.key ? ' active' : ''}`}
            onClick={() => setFiltro(f.key)}
          >
            {f.label}
            {f.count != null && f.count > 0 && (
              <span className="reminders-filter-count">{f.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="tareas-scroll-area">
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px' }}>
          <span className="spinner-border" />
        </div>
      ) : (
        <div className="reminders-list">

          {groups.length === 0 && (
            <div style={{ padding: '40px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>
              No hay tareas
            </div>
          )}

          {groups.map(group => (
            <div key={group.key}>
              {group.label && (
                <div className="reminders-section-header">{group.label}</div>
              )}
              {group.items.map(tarea => (
                <TareaRow
                  key={tarea.id}
                  tarea={tarea}
                  expanded={expandedId === tarea.id}
                  onToggle={() => setExpandedId(expandedId === tarea.id ? null : tarea.id)}
                  onComplete={() => handleToggleComplete(tarea)}
                  onEdit={() => { setExpandedId(null); openEditTarea(tarea); }}
                  onDelete={() => handleEliminar(tarea.id)}
                />
              ))}
            </div>
          ))}

          {/* Quick add */}
          <div className="reminders-quick-add">
            <div className="reminders-circle-empty" />
            <input
              type="text"
              placeholder="Nueva tarea..."
              value={quickAdd}
              onChange={e => setQuickAdd(e.target.value)}
              onKeyDown={handleQuickAdd}
            />
          </div>

          {/* Completadas (colapsable) */}
          {completadas.length > 0 && (
            <div>
              <button
                className="reminders-section-header reminders-section-toggle"
                onClick={() => setShowCompletadas(!showCompletadas)}
              >
                {showCompletadas ? '▼' : '▶'} Completadas ({completadas.length})
              </button>
              {showCompletadas && completadas.map(tarea => (
                <TareaRow
                  key={tarea.id}
                  tarea={tarea}
                  expanded={expandedId === tarea.id}
                  onToggle={() => setExpandedId(expandedId === tarea.id ? null : tarea.id)}
                  onComplete={() => handleToggleComplete(tarea)}
                  onEdit={() => { setExpandedId(null); openEditTarea(tarea); }}
                  onDelete={() => handleEliminar(tarea.id)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      </div>{/* /tareas-scroll-area */}

      {/* Modal */}
      {showModal && (
        <TareaModal
          formData={formData}
          setFormData={setFormData}
          editingTarea={editingTarea}
          empleados={empleados}
          onSave={handleSave}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
};

export default Tareas;
