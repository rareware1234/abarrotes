import React, { useState, useEffect } from 'react';
import { FaCheckSquare, FaPlus, FaFilter, FaUser, FaUserTie, FaUserShield } from 'react-icons/fa';
import { getProfileColor, getProfileById } from '../data/employeeProfiles';

const Tasks = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, pending, completed
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    priority: 'media',
    dueDate: '',
    assignedTo: ''
  });
  const [employees, setEmployees] = useState([]);
  const [currentProfile, setCurrentProfile] = useState(null);
  
  // Colores dinámicos basados en el perfil
  const [colors, setColors] = useState({
    primary: '#1e7f5c',
    primaryDark: '#165f45',
    primaryLight: '#2fbf8c',
    secondary: '#2c3e50',
    success: '#28a745',
    danger: '#dc3545',
    warning: '#ffc107',
    info: '#17a2b8',
    light: '#f8f9fa',
    dark: '#343a40',
    border: '#dee2e6'
  });

  useEffect(() => {
    const profileColor = getProfileColor(localStorage.getItem('employeeProfile') || 'staff');
    const adjustColor = (color, amount) => {
      const hex = color.replace('#', '');
      const num = parseInt(hex, 16);
      const r = Math.min(255, Math.max(0, (num >> 16) + amount));
      const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amount));
      const b = Math.min(255, Math.max(0, (num & 0x0000FF) + amount));
      return `#${(1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1)}`;
    };

    setColors({
      primary: profileColor,
      primaryDark: adjustColor(profileColor, -20),
      primaryLight: adjustColor(profileColor, 20),
      secondary: '#2c3e50',
      success: '#28a745',
      danger: '#dc3545',
      warning: '#ffc107',
      info: '#17a2b8',
      light: '#f8f9fa',
      dark: '#343a40',
      border: '#dee2e6'
    });
    
    // Cargar perfil actual
    const employeeProfile = localStorage.getItem('employeeProfile') || 'staff';
    setCurrentProfile(getProfileById(employeeProfile));
    
    // Cargar lista de empleados para asignar tareas
    const demoEmployees = [
      { id: 'EMP001', name: 'Juan García', profile: 'staff' },
      { id: 'EMP002', name: 'María López', profile: 'staff' },
      { id: 'EMP003', name: 'Carlos Rodríguez', profile: 'supervisor' },
      { id: 'EMP004', name: 'Ana Martínez', profile: 'supervisor' },
      { id: 'EMP005', name: 'Pedro Sánchez', profile: 'director' },
      { id: 'EMP006', name: 'Laura Fernández', profile: 'director' }
    ];
    setEmployees(demoEmployees);
  }, []);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      setLoading(true);
      
      // Tareas de demo
      const demoTasks = [
        {
          id: 1,
          title: 'Vender 5 membresías hoy',
          completed: false,
          priority: 'alta',
          dueDate: 'Hoy',
          type: 'automatic',
          assignedBy: 'Sistema'
        },
        {
          id: 2,
          title: 'Limpiar área de cajas registradoras',
          completed: true,
          priority: 'media',
          dueDate: 'Ayer',
          type: 'manual',
          assignedBy: 'Gerente'
        },
        {
          id: 3,
          title: 'Actualizar exhibición de productos nuevos',
          completed: false,
          priority: 'baja',
          dueDate: 'Mañana',
          type: 'manual',
          assignedBy: 'Supervisor'
        },
        {
          id: 4,
          title: 'Verificar inventario de membresías',
          completed: false,
          priority: 'alta',
          dueDate: 'Hoy',
          type: 'automatic',
          assignedBy: 'Sistema'
        },
        {
          id: 5,
          title: 'Capacitar a nuevo empleado',
          completed: false,
          priority: 'media',
          dueDate: 'En 2 días',
          type: 'manual',
          assignedBy: 'Gerente'
        },
        {
          id: 6,
          title: 'Revisar reporte de ventas',
          completed: true,
          priority: 'alta',
          dueDate: 'Ayer',
          type: 'automatic',
          assignedBy: 'Sistema'
        }
      ];
      
      setTasks(demoTasks);
    } catch (error) {
      console.error('Error cargando tareas:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleTask = (taskId) => {
    setTasks(prevTasks => 
      prevTasks.map(task => 
        task.id === taskId ? { ...task, completed: !task.completed } : task
      )
    );
  };

  const handleAddTask = (e) => {
    e.preventDefault();
    if (!newTask.title.trim()) return;

    const employeeName = localStorage.getItem('employeeName') || 'Empleado';
    const assignedToEmployee = employees.find(emp => emp.id === newTask.assignedTo);
    
    const task = {
      id: Date.now(),
      title: newTask.title.trim(),
      completed: false,
      priority: newTask.priority,
      dueDate: newTask.dueDate || 'Sin fecha',
      type: 'manual',
      assignedBy: employeeName,
      assignedTo: newTask.assignedTo || null,
      assignedToName: assignedToEmployee ? assignedToEmployee.name : null,
      profileColor: currentProfile?.colorHex || '#1e7f5c'
    };

    setTasks(prevTasks => [task, ...prevTasks]);
    setNewTask({ title: '', priority: 'media', dueDate: '', assignedTo: '' });
    setShowAddTaskModal(false);
  };

  const filteredTasks = tasks.filter(task => {
    if (filter === 'pending') return !task.completed;
    if (filter === 'completed') return task.completed;
    return true;
  });

  const pendingCount = tasks.filter(t => !t.completed).length;

  return (
    <div className="fade-in px-3 pb-5">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="h5 fw-bold mb-1">Tareas Pendientes</h2>
          <p className="text-muted small mb-0">
            {pendingCount} tarea{pendingCount !== 1 ? 's' : ''} pendiente{pendingCount !== 1 ? 's' : ''}
          </p>
        </div>
        <button 
          className="btn btn-primary btn-sm"
          style={{ backgroundColor: colors.primary, borderColor: colors.primary }}
          onClick={() => setShowAddTaskModal(true)}
        >
          <FaPlus className="me-1" /> Nueva
        </button>
      </div>

      {/* Filtros */}
      <div className="d-flex gap-2 mb-4">
        <button 
          className={`btn btn-sm ${filter === 'all' ? 'btn-primary' : 'btn-outline-secondary'}`}
          style={filter === 'all' ? { backgroundColor: colors.primary, borderColor: colors.primary } : {}}
          onClick={() => setFilter('all')}
        >
          Todas
        </button>
        <button 
          className={`btn btn-sm ${filter === 'pending' ? 'btn-primary' : 'btn-outline-secondary'}`}
          style={filter === 'pending' ? { backgroundColor: colors.primary, borderColor: colors.primary } : {}}
          onClick={() => setFilter('pending')}
        >
          Pendientes
        </button>
        <button 
          className={`btn btn-sm ${filter === 'completed' ? 'btn-primary' : 'btn-outline-secondary'}`}
          style={filter === 'completed' ? { backgroundColor: colors.primary, borderColor: colors.primary } : {}}
          onClick={() => setFilter('completed')}
        >
          Completadas
        </button>
      </div>

      {/* Lista de tareas */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
        </div>
      ) : filteredTasks.length > 0 ? (
        <div className="d-flex flex-column gap-3">
          {filteredTasks.map((task) => (
            <div 
              key={task.id}
              className="card p-3"
              style={{ 
                opacity: task.completed ? 0.7 : 1,
                borderLeft: task.priority === 'alta' ? '4px solid #dc3545' : 
                           task.priority === 'media' ? '4px solid #ffc107' : 
                           '4px solid #6c757d',
                borderRight: task.assignedTo ? `3px solid ${task.profileColor || colors.primary}` : 'none'
              }}
            >
              <div className="d-flex align-items-start">
                <input 
                  type="checkbox" 
                  className="form-check-input me-3 mt-1"
                  checked={task.completed}
                  onChange={() => toggleTask(task.id)}
                  style={{ cursor: 'pointer', width: '18px', height: '18px' }}
                />
                <div className="flex-grow-1">
                  <div className={`fw-medium ${task.completed ? 'text-muted text-decoration-line-through' : ''}`}>
                    {task.title}
                  </div>
                  <div className="d-flex align-items-center gap-3 mt-2">
                    <small className={`text-muted ${task.completed ? '' : 'text-success'}`}>
                      {task.completed ? '✓ Completada' : task.dueDate}
                    </small>
                    <small className="text-muted">
                      {task.type === 'automatic' ? '🤖 Sistema' : '👤 ' + task.assignedBy}
                    </small>
                    {task.assignedToName && (
                      <small className="badge bg-light text-dark">
                        <FaUser className="me-1" />
                        {task.assignedToName}
                      </small>
                    )}
                  </div>
                </div>
                <span className={`badge ${
                  task.priority === 'alta' ? 'bg-danger' :
                  task.priority === 'media' ? 'bg-warning' :
                  'bg-secondary'
                }`}>
                  {task.priority === 'alta' ? 'Alta' : task.priority === 'media' ? 'Media' : 'Baja'}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-5 text-muted">
          <FaCheckSquare size={48} className="mb-3 opacity-50" />
          <p>No hay tareas {filter === 'pending' ? 'pendientes' : filter === 'completed' ? 'completadas' : ''}</p>
        </div>
      )}

      {/* Modal para agregar tarea */}
      {showAddTaskModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Nueva Tarea</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowAddTaskModal(false)}
                ></button>
              </div>
              <form onSubmit={handleAddTask}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Descripción</label>
                    <input
                      type="text"
                      className="form-control"
                      value={newTask.title}
                      onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                      placeholder="¿Qué tarea necesitas hacer?"
                      required
                      autoFocus
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Prioridad</label>
                    <select
                      className="form-select"
                      value={newTask.priority}
                      onChange={(e) => setNewTask({...newTask, priority: e.target.value})}
                    >
                      <option value="baja">Baja</option>
                      <option value="media">Media</option>
                      <option value="alta">Alta</option>
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Fecha límite (opcional)</label>
                    <input
                      type="text"
                      className="form-control"
                      value={newTask.dueDate}
                      onChange={(e) => setNewTask({...newTask, dueDate: e.target.value})}
                      placeholder="Ej: Hoy, Mañana, Este viernes"
                    />
                  </div>
                  
                  {/* Selector de empleado (solo para perfiles con permisos) */}
                  {currentProfile?.canAssignTasks && (
                    <div className="mb-3">
                      <label className="form-label">Asignar a</label>
                      <select
                        className="form-select"
                        value={newTask.assignedTo}
                        onChange={(e) => setNewTask({...newTask, assignedTo: e.target.value})}
                      >
                        <option value="">Seleccionar empleado...</option>
                        {employees
                          .filter(emp => emp.id !== localStorage.getItem('employeeId')) // No mostrarse a sí mismo
                          .map(emp => (
                            <option key={emp.id} value={emp.id}>
                              {emp.name} ({emp.profile})
                            </option>
                          ))}
                      </select>
                    </div>
                  )}
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={() => setShowAddTaskModal(false)}
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    style={{ backgroundColor: colors.primary, borderColor: colors.primary }}
                  >
                    Crear Tarea
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tasks;