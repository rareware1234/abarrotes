import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import empleadoService from '../services/empleadoService';
import RolBadge from '../components/RolBadge';
import FilterChips from '../components/FilterChips';
import ConfirmModal from '../components/ConfirmModal';

const Empleados = () => {
  const { hasPermission } = useAuth();
  const [empleados, setEmpleados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('todos');
  const [showModal, setShowModal] = useState(false);
  const [editingEmpleado, setEditingEmpleado] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [tempPassword, setTempPassword] = useState(null);

  const canEdit = hasPermission('empleados_crear') || hasPermission('empleados_editar');

  const [formData, setFormData] = useState({
    nombre: '',
    numEmpleado: '',
    email: '',
    telefono: '',
    rol: 'STAFF',
    tiendaId: ''
  });

  useEffect(() => {
    fetchEmpleados();
  }, [filtro]);

  const fetchEmpleados = async () => {
    setLoading(true);
    const result = await empleadoService.fetchAll();
    if (result.success) {
      let filtered = result.data;
      if (filtro === 'activos') filtered = result.data.filter(e => e.activo !== false);
      else if (filtro === 'inactivos') filtered = result.data.filter(e => e.activo === false);
      else if (filtro !== 'todos') filtered = result.data.filter(e => e.rol === filtro);
      setEmpleados(filtered);
    }
    setLoading(false);
  };

  const getInitials = (nombre) => {
    if (!nombre) return '?';
    return nombre.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const getAvatarColor = (rol) => {
    const colors = { staff: '#1A7A48', manager: '#2563EB', admin: '#64748B' };
    return colors[rol] || colors.staff;
  };

  const handleSave = async () => {
    if (!formData.nombre || !formData.numEmpleado) {
      alert('Nombre y número de empleado son requeridos');
      return;
    }

    let result;
    if (editingEmpleado) {
      result = await empleadoService.update(editingEmpleado.uid, formData);
    } else {
      result = await empleadoService.create(formData);
      if (result.success && result.tempPassword) {
        setTempPassword(result.tempPassword);
        return;
      }
    }

    if (result.success) {
      setShowModal(false);
      setEditingEmpleado(null);
      setFormData({ nombre: '', numEmpleado: '', email: '', telefono: '', rol: 'STAFF', tiendaId: '' });
      fetchEmpleados();
    } else {
      alert('Error: ' + result.error);
    }
  };

  const handleEdit = (empleado) => {
    setEditingEmpleado(empleado);
    setFormData({
      nombre: empleado.nombre || '',
      numEmpleado: empleado.numEmpleado || '',
      email: empleado.email || '',
      telefono: empleado.telefono || '',
      rol: empleado.rol || 'STAFF',
      tiendaId: empleado.tiendaId || ''
    });
    setShowModal(true);
  };

  const handleToggleActivo = async (empleado) => {
    await empleadoService.toggleActivo(empleado.uid);
    fetchEmpleados();
  };

  const filterOptions = [
    { value: 'todos', label: 'Todos' },
    { value: 'activos', label: 'Activos' },
    { value: 'inactivos', label: 'Inactivos' },
    { value: 'staff', label: 'Staff' },
    { value: 'manager', label: 'Managers' },
    { value: 'admin', label: 'Admins' }
  ];

  return (
    <div className="empleados-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ margin: 0, fontSize: '24px' }}>Empleados</h1>
        {canEdit && (
          <button onClick={() => { setEditingEmpleado(null); setFormData({ nombre: '', numEmpleado: '', email: '', telefono: '', rol: 'STAFF', tiendaId: '' }); setShowModal(true); }} style={{ padding: '10px 20px', background: 'var(--role-primary)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
            <i className="bi bi-plus-lg me-2"></i>Nuevo Empleado
          </button>
        )}
      </div>

      <FilterChips opciones={filterOptions} seleccionado={filtro} onChange={setFiltro} />

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px' }}><span className="spinner-border spinner-border-lg"></span></div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px', marginTop: '20px' }}>
          {empleados.map(emp => (
            <div key={emp.id} style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: `${getAvatarColor(emp.rol)}22`, color: getAvatarColor(emp.rol), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: 600 }}>
                  {getInitials(emp.nombre)}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '16px' }}>{emp.nombre}</h3>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>#{emp.numEmpleado}</div>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <RolBadge rol={emp.rol} />
                {canEdit && (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => handleToggleActivo(emp)} style={{ padding: '6px 12px', border: '1px solid var(--border)', borderRadius: '6px', background: 'white', cursor: 'pointer', fontSize: '12px' }}>
                      {emp.activo !== false ? 'Desactivar' : 'Activar'}
                    </button>
                    <button onClick={() => handleEdit(emp)} style={{ padding: '6px 12px', border: '1px solid var(--border)', borderRadius: '6px', background: 'white', cursor: 'pointer' }}>
                      <i className="bi bi-pencil"></i>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="confirm-modal" style={{ maxWidth: '450px', textAlign: 'left' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: '20px' }}>{editingEmpleado ? 'Editar Empleado' : 'Nuevo Empleado'}</h3>
            <div style={{ display: 'grid', gap: '12px' }}>
              <input type="text" placeholder="Nombre completo *" value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} style={{ padding: '12px', border: '1px solid var(--border)', borderRadius: '8px' }} />
              <input type="text" placeholder="Número de empleado *" value={formData.numEmpleado} onChange={e => setFormData({...formData, numEmpleado: e.target.value})} style={{ padding: '12px', border: '1px solid var(--border)', borderRadius: '8px' }} disabled={!!editingEmpleado} />
              <input type="email" placeholder="Email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} style={{ padding: '12px', border: '1px solid var(--border)', borderRadius: '8px' }} />
              <input type="tel" placeholder="Teléfono" value={formData.telefono} onChange={e => setFormData({...formData, telefono: e.target.value})} style={{ padding: '12px', border: '1px solid var(--border)', borderRadius: '8px' }} />
              <select value={formData.rol} onChange={e => setFormData({...formData, rol: e.target.value})} style={{ padding: '12px', border: '1px solid var(--border)', borderRadius: '8px' }}>
                <option value="STAFF">Staff</option>
                <option value="MANAGER">Manager</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
              <button onClick={() => setShowModal(false)} className="btn btn-outline-secondary" style={{ flex: 1 }}>Cancelar</button>
              <button onClick={handleSave} className="btn btn-primary" style={{ flex: 1, background: 'var(--role-primary)' }}>Guardar</button>
            </div>
          </div>
        </div>
      )}

      {tempPassword && (
        <div className="modal-overlay" onClick={() => { setTempPassword(null); setShowModal(false); }}>
          <div className="confirm-modal" onClick={e => e.stopPropagation()}>
            <div style={{ textAlign: 'center' }}>
              <i className="bi bi-key" style={{ fontSize: '48px', color: '#F59E0B', marginBottom: '16px' }}></i>
              <h3>Contraseña Temporal</h3>
              <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>Esta contraseña solo se mostrará una vez:</p>
              <div style={{ background: '#FEF3C7', padding: '16px', borderRadius: '8px', fontSize: '24px', fontWeight: 700, fontFamily: 'monospace', letterSpacing: '2px' }}>
                {tempPassword}
              </div>
              <button onClick={() => { setTempPassword(null); setShowModal(false); fetchEmpleados(); }} className="btn btn-primary" style={{ marginTop: '20px', background: 'var(--role-primary)' }}>Entendido</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Empleados;