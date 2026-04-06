import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import tareaService from '../services/tareaService';
import empleadoService from '../services/empleadoService';
import FilterChips from '../components/FilterChips';
import ConfirmModal from '../components/ConfirmModal';

const PRIORIDADES = {
  alta: { label: 'Alta', color: '#EF4444' },
  media: { label: 'Media', color: '#F59E0B' },
  baja: { label: 'Baja', color: '#1A7A48' }
};

const Tareas = () => {
  const { empleado } = useAuth();
  const [tareas, setTareas] = useState([]);
  const [plantillas, setPlantillas] = useState([]);
  const [empleados, setEmpleados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('todas');
  const [viewMode, setViewMode] = useState('kanban');
  const [showModal, setShowModal] = useState(false);
  const [editingTarea, setEditingTarea] = useState(null);
  const [showPlantillas, setShowPlantillas] = useState(false);

  const [formData, setFormData] = useState({
    titulo: '',
    notas: '',
    prioridad: 'media',
    vencimiento: '',
    asignadoA: '',
    categoria: '',
    recurrente: false,
    frecuencia: 'diaria',
    diasSemana: []
  });

  useEffect(() => {
    fetchData();
  }, [filtro]);

  const fetchData = async () => {
    setLoading(true);
    const [tareasResult, plantillasResult, empleadosResult] = await Promise.all([
      filtro === 'mis_tareas' ? tareaService.fetchPorEmpleado(empleado?.uid) : tareaService.fetchTodas(),
      tareaService.fetchPlantillas(),
      empleadoService.fetchAll()
    ]);
    if (tareasResult.success) setTareas(tareasResult.data);
    if (plantillasResult.success) setPlantillas(plantillasResult.data);
    if (empleadosResult.success) setEmpleados(empleadosResult.data);
    setLoading(false);
  };

  const getInitials = (nombre) => {
    if (!nombre) return '?';
    return nombre.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const handleSave = async () => {
    if (!formData.titulo) {
      alert('El título es requerido');
      return;
    }

    let result;
    if (editingTarea) {
      result = await tareaService.update(editingTarea.id, formData);
    } else {
      result = await tareaService.crear(formData);
    }

    if (result.success) {
      setShowModal(false);
      setEditingTarea(null);
      setFormData({ titulo: '', notas: '', prioridad: 'media', vencimiento: '', asignadoA: '', categoria: '', recurrente: false, frecuencia: 'diaria', diasSemana: [] });
      fetchData();
    } else {
      alert('Error: ' + result.error);
    }
  };

  const handleCompletar = async (tareaId) => {
    await tareaService.completar(tareaId);
    fetchData();
  };

  const handleEliminar = async (tareaId) => {
    await tareaService.remove(tareaId);
    fetchData();
  };

  const ejecutarPlantilla = async (plantilla) => {
    await tareaService.crear({
      titulo: plantilla.nombre,
      notas: plantilla.notas,
      prioridad: plantilla.prioridad,
      asignadoA: plantilla.asignadoA,
      categoria: plantilla.categoria,
      recurrente: true,
      frecuencia: plantilla.frecuencia,
      diasSemana: plantilla.diasSemana
    });
    fetchData();
  };

  const filterOptions = [
    { value: 'todas', label: 'Todas' },
    { value: 'mis_tareas', label: 'Mis Tareas' },
    { value: 'atrasadas', label: 'Atrasadas' }
  ];

  const tareasPendientes = tareas.filter(t => t.estado === 'pendiente');
  const tareasEnProgreso = tareas.filter(t => t.estado === 'en_progreso');
  const tareasCompletadas = tareas.filter(t => t.estado === 'completada');

  return (
    <div className="tareas-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <h1 style={{ margin: 0, fontSize: '24px' }}>Tareas</h1>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={() => setShowPlantillas(!showPlantillas)} style={{ padding: '10px 16px', border: '1px solid var(--border)', borderRadius: '8px', background: 'white', cursor: 'pointer' }}>
            <i className="bi bi-collection me-2"></i>Plantillas
          </button>
          <button onClick={() => { setEditingTarea(null); setFormData({ titulo: '', notas: '', prioridad: 'media', vencimiento: '', asignadoA: '', categoria: '', recurrente: false, frecuencia: 'diaria', diasSemana: [] }); setShowModal(true); }} style={{ padding: '10px 20px', background: 'var(--role-primary)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
            <i className="bi bi-plus-lg me-2"></i>Nueva Tarea
          </button>
        </div>
      </div>

      <FilterChips opciones={filterOptions} seleccionado={filtro} onChange={setFiltro} />

      {showPlantillas && (
        <div style={{ background: 'white', borderRadius: '12px', padding: '20px', marginTop: '16px', marginBottom: '16px' }}>
          <h3 style={{ marginBottom: '16px' }}>Plantillas</h3>
          {plantillas.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>No hay plantillas</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '12px' }}>
              {plantillas.map(p => (
                <div key={p.id} style={{ padding: '16px', border: '1px solid var(--border)', borderRadius: '8px' }}>
                  <div style={{ fontWeight: 600 }}>{p.nombre}</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>{p.categoria}</div>
                  <button onClick={() => ejecutarPlantilla(p)} style={{ marginTop: '12px', padding: '6px 12px', background: 'var(--role-primary)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>
                    Ejecutar
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px' }}><span className="spinner-border spinner-border-lg"></span></div>
      ) : viewMode === 'kanban' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginTop: '20px' }}>
          {[
            { estado: 'pendiente', label: 'Pendientes', tareas: tareasPendientes },
            { estado: 'en_progreso', label: 'En Progreso', tareas: tareasEnProgreso },
            { estado: 'completada', label: 'Completadas', tareas: tareasCompletadas }
          ].map(col => (
            <div key={col.estado}>
              <h3 style={{ marginBottom: '12px', fontSize: '16px' }}>{col.label} ({col.tareas.length})</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {col.tareas.map(tarea => (
                  <div key={tarea.id} style={{ background: 'white', borderRadius: '10px', padding: '16px', boxShadow: 'var(--shadow-sm)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                      <span style={{ background: PRIORIDADES[tarea.prioridad]?.color || '#64748B', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '11px' }}>
                        {PRIORIDADES[tarea.prioridad]?.label || 'Media'}
                      </span>
                      {tarea.recurrente && <i className="bi bi-arrow-repeat" style={{ color: 'var(--text-muted)' }}></i>}
                    </div>
                    <div style={{ fontWeight: 500, marginBottom: '8px' }}>{tarea.titulo}</div>
                    {tarea.notas && <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{tarea.notas}</div>}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: 'var(--text-muted)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--role-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px' }}>
                          {getInitials(tarea.asignadoA)}
                        </div>
                        <span>{tarea.asignadoA || 'Sin asignar'}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        {tarea.estado !== 'completada' && (
                          <button onClick={() => handleCompletar(tarea.id)} style={{ padding: '4px 8px', border: '1px solid #1A7A48', borderRadius: '4px', background: 'white', color: '#1A7A48', cursor: 'pointer' }}>
                            <i className="bi bi-check"></i>
                          </button>
                        )}
                        <button onClick={() => handleEliminar(tarea.id)} style={{ padding: '4px 8px', border: '1px solid #EF4444', borderRadius: '4px', background: 'white', color: '#EF4444', cursor: 'pointer' }}>
                          <i className="bi bi-x"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ background: 'white', borderRadius: '12px', marginTop: '20px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F4F5F7' }}>
                <th style={{ padding: '12px', textAlign: 'left' }}>Título</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Prioridad</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Estado</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Asignado</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {tareas.map(tarea => (
                <tr key={tarea.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '12px' }}>{tarea.titulo}</td>
                  <td style={{ padding: '12px' }}>
                    <span style={{ background: PRIORIDADES[tarea.prioridad]?.color, color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '12px' }}>
                      {PRIORIDADES[tarea.prioridad]?.label}
                    </span>
                  </td>
                  <td style={{ padding: '12px' }}>{tarea.estado}</td>
                  <td style={{ padding: '12px' }}>{tarea.asignadoA || '-'}</td>
                  <td style={{ padding: '12px' }}>
                    <button onClick={() => handleCompletar(tarea.id)} disabled={tarea.estado === 'completada'} style={{ marginRight: '8px', padding: '6px', border: '1px solid var(--border)', borderRadius: '4px', cursor: 'pointer' }}>✓</button>
                    <button onClick={() => handleEliminar(tarea.id)} style={{ padding: '6px', border: '1px solid #EF4444', borderRadius: '4px', color: '#EF4444', cursor: 'pointer' }}>×</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="confirm-modal" style={{ maxWidth: '450px', textAlign: 'left' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: '20px' }}>{editingTarea ? 'Editar Tarea' : 'Nueva Tarea'}</h3>
            <div style={{ display: 'grid', gap: '12px' }}>
              <input type="text" placeholder="Título *" value={formData.titulo} onChange={e => setFormData({...formData, titulo: e.target.value})} style={{ padding: '12px', border: '1px solid var(--border)', borderRadius: '8px' }} />
              <textarea placeholder="Notas" value={formData.notas} onChange={e => setFormData({...formData, notas: e.target.value})} style={{ padding: '12px', border: '1px solid var(--border)', borderRadius: '8px', minHeight: '80px' }} />
              <select value={formData.prioridad} onChange={e => setFormData({...formData, prioridad: e.target.value})} style={{ padding: '12px', border: '1px solid var(--border)', borderRadius: '8px' }}>
                <option value="alta">Alta</option>
                <option value="media">Media</option>
                <option value="baja">Baja</option>
              </select>
              <input type="date" value={formData.vencimiento} onChange={e => setFormData({...formData, vencimiento: e.target.value})} style={{ padding: '12px', border: '1px solid var(--border)', borderRadius: '8px' }} />
              <select value={formData.asignadoA} onChange={e => setFormData({...formData, asignadoA: e.target.value})} style={{ padding: '12px', border: '1px solid var(--border)', borderRadius: '8px' }}>
                <option value="">Sin asignar</option>
                {empleados.map(emp => <option key={emp.id} value={emp.nombre}>{emp.nombre}</option>)}
              </select>
              <input type="text" placeholder="Categoría" value={formData.categoria} onChange={e => setFormData({...formData, categoria: e.target.value})} style={{ padding: '12px', border: '1px solid var(--border)', borderRadius: '8px' }} />
            </div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
              <button onClick={() => setShowModal(false)} className="btn btn-outline-secondary" style={{ flex: 1 }}>Cancelar</button>
              <button onClick={handleSave} className="btn btn-primary" style={{ flex: 1, background: 'var(--role-primary)' }}>Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tareas;