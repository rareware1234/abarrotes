import React, { useState, useEffect } from 'react';
import { FaCheck, FaPlus, FaCheckSquare, FaCircle, FaClock, FaUser } from 'react-icons/fa';

const MOCK_TASKS = [
  { id: 1, title: 'Reposición de estantes', desc: 'Sector A3 - Refrescos y jugos', priority: 'high', status: 'pending', due: 'Hoy 17:00', assignee: 'Carlos M.' },
  { id: 2, title: 'Revisar caducidades', desc: 'Productos lácteos -nevera 2', priority: 'medium', status: 'pending', due: 'Hoy 19:00', assignee: 'María L.' },
  { id: 3, title: 'Limpieza de cajas', desc: 'Cajas registradoras 1-4', priority: 'low', status: 'done', due: 'Hoy 18:00', assignee: 'Juan P.' },
  { id: 4, title: 'Inventario mensual', desc: 'Sección de abarrotes generales', priority: 'high', status: 'pending', due: 'Mañana 10:00', assignee: 'Laura R.' },
  { id: 5, title: 'Atención al cliente', desc: 'Mostrador principal', priority: 'medium', status: 'pending', due: 'En curso', assignee: 'Todos' },
];

const PRIORITY_CONFIG = {
  high: { color: 'var(--danger)', bg: '#fee2e2', label: 'Alta' },
  medium: { color: 'var(--warning)', bg: '#fef3c7', label: 'Media' },
  low: { color: 'var(--info)', bg: '#dbeafe', label: 'Baja' },
};

const Tasks = () => {
  const [tasks, setTasks] = useState(MOCK_TASKS);
  const [filter, setFilter] = useState('all');
  const [showAdd, setShowAdd] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', desc: '', priority: 'medium' });

  const employeeName = sessionStorage.getItem('mobile_employeeName') || 'Empleado';
  const employeeId = sessionStorage.getItem('mobile_employeeId') || '';

  const filtered = filter === 'all' ? tasks :
    filter === 'done' ? tasks.filter(t => t.status === 'done') :
    tasks.filter(t => t.status === 'pending');

  const stats = {
    total: tasks.length,
    done: tasks.filter(t => t.status === 'done').length,
    pending: tasks.filter(t => t.status === 'pending').length,
    high: tasks.filter(t => t.priority === 'high' && t.status === 'pending').length
  };

  const toggleTask = (id) => {
    setTasks(tasks.map(t =>
      t.id === id ? { ...t, status: t.status === 'done' ? 'pending' : 'done' } : t
    ));
  };

  const addTask = () => {
    if (!newTask.title.trim()) return;
    setTasks([{
      id: Date.now(),
      title: newTask.title,
      desc: newTask.desc,
      priority: newTask.priority,
      status: 'pending',
      due: 'Pendiente',
      assignee: employeeName
    }, ...tasks]);
    setNewTask({ title: '', desc: '', priority: 'medium' });
    setShowAdd(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: 0 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
        <div className="stat-card">
          <div className="stat-icon green"><FaCheckSquare /></div>
          <div>
            <div className="stat-value">{stats.pending}</div>
            <div className="stat-label">Pendientes</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon blue"><FaCheck /></div>
          <div>
            <div className="stat-value">{stats.done}</div>
            <div className="stat-label">Completadas</div>
          </div>
        </div>
      </div>

      {stats.high > 0 && (
        <div style={{
          background: '#fee2e2', color: '#dc2626', padding: '10px 14px',
          borderRadius: 'var(--radius-md)', fontSize: '0.85rem', fontWeight: 600,
          display: 'flex', alignItems: 'center', gap: 8
        }}>
          <i className="bi bi-exclamation-triangle"></i>
          {stats.high} tarea{stats.high !== 1 ? 's' : ''} urgente{stats.high !== 1 ? 's' : ''} pendiente{stats.high !== 1 ? 's' : ''}
        </div>
      )}

      <div className="tabs">
        <button className={`tab-btn ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>
          Todas ({stats.total})
        </button>
        <button className={`tab-btn ${filter === 'pending' ? 'active' : ''}`} onClick={() => setFilter('pending')}>
          Pendientes ({stats.pending})
        </button>
        <button className={`tab-btn ${filter === 'done' ? 'active' : ''}`} onClick={() => setFilter('done')}>
          Hechas ({stats.done})
        </button>
      </div>

      <button className="btn btn-primary btn-block" onClick={() => setShowAdd(true)}>
        <FaPlus /> Nueva Tarea
      </button>

      {showAdd && (
        <div className="card fade-up">
          <div className="card-header-section">
            <h3 className="card-title">Nueva Tarea</h3>
            <button className="btn btn-ghost btn-sm" onClick={() => setShowAdd(false)}>
              <i className="bi bi-x-lg"></i>
            </button>
          </div>
          <div className="card-body">
            <div className="form-group">
              <label className="form-label">Título</label>
              <input type="text" className="form-control" placeholder="¿Qué necesitas hacer?"
                value={newTask.title} onChange={(e) => setNewTask({...newTask, title: e.target.value})} autoFocus />
            </div>
            <div className="form-group">
              <label className="form-label">Descripción</label>
              <input type="text" className="form-control" placeholder="Detalles adicionales..."
                value={newTask.desc} onChange={(e) => setNewTask({...newTask, desc: e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">Prioridad</label>
              <select className="form-select" value={newTask.priority}
                onChange={(e) => setNewTask({...newTask, priority: e.target.value})}>
                <option value="low">Baja</option>
                <option value="medium">Media</option>
                <option value="high">Alta</option>
              </select>
            </div>
            <button className="btn btn-primary btn-block" onClick={addTask}>
              <FaPlus /> Agregar Tarea
            </button>
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="empty-state">
          <FaCheckSquare />
          <h4>Sin tareas</h4>
          <p>{filter === 'all' ? 'No hay tareas registradas' : filter === 'pending' ? '¡Felicidades! No tienes pendientes' : 'Aún no completas tareas'}</p>
        </div>
      ) : (
        <div className="card">
          {filtered.map(task => {
            const priority = PRIORITY_CONFIG[task.priority];
            return (
              <div key={task.id} className="check-item" style={{ opacity: task.status === 'done' ? 0.6 : 1 }}>
                <div
                  className={`check-box ${task.status === 'done' ? 'checked' : ''}`}
                  onClick={() => toggleTask(task.id)}
                >
                  {task.status === 'done' && <FaCheck size={12} />}
                </div>
                <div className="check-content" style={{ flex: 1 }}>
                  <div className="check-title">{task.title}</div>
                  {task.desc && <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>{task.desc}</div>}
                  <div className="check-meta" style={{ display: 'flex', gap: '8px', marginTop: '6px', flexWrap: 'wrap' }}>
                    <span className="badge" style={{ background: priority.bg, color: priority.color }}>
                      {priority.label}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      <FaClock size={10} /> {task.due}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      <FaUser size={10} /> {task.assignee}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Tasks;
