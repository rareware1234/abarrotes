import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import turnoService from '../services/turnoService';
import empleadoService from '../services/empleadoService';
import ConfirmModal from '../components/ConfirmModal';

const TIPOS_TURNO = {
  matutino: { label: 'Matutino', color: '#2563EB', inicio: '07:00', fin: '15:00' },
  vespertino: { label: 'Vespertino', color: '#F97316', inicio: '15:00', fin: '23:00' },
  completo: { label: 'Completo', color: '#1A7A48', inicio: '07:00', fin: '23:00' },
  medio: { label: 'Medio', color: '#EAB308', inicio: '09:00', fin: '13:00' },
  descanso: { label: 'Descanso', color: '#64748B', inicio: null, fin: null }
};

const Turnos = () => {
  const { hasPermission } = useAuth();
  const [turnos, setTurnos] = useState([]);
  const [empleados, setEmpleados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(now.setDate(diff));
  });
  const [showModal, setShowModal] = useState(false);
  const [editingTurno, setEditingTurno] = useState(null);

  const canEdit = hasPermission('turnos_crear') || hasPermission('turnos_editar');

  const [formData, setFormData] = useState({
    empleadoId: '',
    fecha: new Date().toISOString().split('T')[0],
    tipo: 'matutino',
    tienda: '',
    notas: ''
  });

  useEffect(() => {
    fetchData();
  }, [currentWeekStart]);

  const fetchData = async () => {
    setLoading(true);
    const [turnosResult, empleadosResult] = await Promise.all([
      turnoService.fetchSemana(currentWeekStart),
      empleadoService.fetchAll()
    ]);
    if (turnosResult.success) setTurnos(turnosResult.data);
    if (empleadosResult.success) setEmpleados(empleadosResult.data);
    setLoading(false);
  };

  const getWeekDays = () => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(currentWeekStart);
      day.setDate(day.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const navigateWeek = (direction) => {
    const newStart = new Date(currentWeekStart);
    newStart.setDate(newStart.getDate() + direction * 7);
    setCurrentWeekStart(newStart);
  };

  const getTurnosForCell = (empleadoId, fecha) => {
    const fechaStr = fecha.toISOString().split('T')[0];
    return turnos.filter(t => t.empleadoId === empleadoId && t.fecha === fechaStr);
  };

  const handleSave = async () => {
    if (!formData.empleadoId || !formData.fecha) {
      alert('Empleado y fecha son requeridos');
      return;
    }

    const tipoInfo = TIPOS_TURNO[formData.tipo];
    const turnoData = {
      ...formData,
      inicio: tipoInfo.inicio,
      fin: tipoInfo.fin
    };

    let result;
    if (editingTurno) {
      result = await turnoService.update(editingTurno.id, turnoData);
    } else {
      result = await turnoService.crear(turnoData);
    }

    if (result.success) {
      setShowModal(false);
      setEditingTurno(null);
      setFormData({ empleadoId: '', fecha: new Date().toISOString().split('T')[0], tipo: 'matutino', tienda: '', notas: '' });
      fetchData();
    } else {
      alert('Error: ' + result.error);
    }
  };

  const handleEdit = (turno) => {
    setEditingTurno(turno);
    setFormData({
      empleadoId: turno.empleadoId || '',
      fecha: turno.fecha || '',
      tipo: turno.tipo || 'matutino',
      tienda: turno.tienda || '',
      notas: turno.notas || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (turnoId) => {
    await turnoService.remove(turnoId);
    fetchData();
  };

  const weekDays = getWeekDays();
  const formatWeekRange = () => {
    const end = new Date(currentWeekStart);
    end.setDate(end.getDate() + 6);
    return `${currentWeekStart.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })} - ${end.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}`;
  };

  return (
    <div className="turnos-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ margin: 0, fontSize: '24px' }}>Turnos</h1>
        {canEdit && (
          <button onClick={() => { setEditingTurno(null); setFormData({ empleadoId: '', fecha: new Date().toISOString().split('T')[0], tipo: 'matutino', tienda: '', notas: '' }); setShowModal(true); }} style={{ padding: '10px 20px', background: 'var(--role-primary)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
            <i className="bi bi-plus-lg me-2"></i>Nuevo Turno
          </button>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', marginBottom: '20px' }}>
        <button onClick={() => navigateWeek(-1)} style={{ padding: '8px 12px', border: '1px solid var(--border)', borderRadius: '6px', background: 'white', cursor: 'pointer' }}>←</button>
        <span style={{ fontWeight: 600 }}>{formatWeekRange()}</span>
        <button onClick={() => navigateWeek(1)} style={{ padding: '8px 12px', border: '1px solid var(--border)', borderRadius: '6px', background: 'white', cursor: 'pointer' }}>→</button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px' }}><span className="spinner-border spinner-border-lg"></span></div>
      ) : (
        <div style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', overflowX: 'auto' }}>
          <table style={{ minWidth: '800px', width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F4F5F7' }}>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', width: '150px' }}>Empleado</th>
                {weekDays.map(day => (
                  <th key={day.toISOString()} style={{ padding: '12px', textAlign: 'center', fontSize: '13px' }}>
                    {day.toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric' })}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {empleados.map(emp => (
                <tr key={emp.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '12px', fontWeight: 500 }}>{emp.nombre}</td>
                  {weekDays.map(day => {
                    const diasTurnos = getTurnosForCell(emp.numEmpleado || emp.uid, day);
                    return (
                      <td key={day.toISOString()} style={{ padding: '8px', textAlign: 'center', minWidth: '100px' }}>
                        {diasTurnos.map(turno => {
                          const tipoInfo = TIPOS_TURNO[turno.tipo] || TIPOS_TURNO.matutino;
                          return (
                            <div key={turno.id} style={{ background: `${tipoInfo.color}22`, border: `1px solid ${tipoInfo.color}`, borderRadius: '6px', padding: '4px 8px', margin: '2px 0', fontSize: '12px', cursor: 'pointer' }} onClick={() => canEdit && handleEdit(turno)}>
                              <div style={{ fontWeight: 600, color: tipoInfo.color }}>{tipoInfo.label}</div>
                              <div style={{ color: 'var(--text-muted)' }}>{turno.inicio} - {turno.fin}</div>
                            </div>
                          );
                        })}
                        {canEdit && (
                          <button onClick={() => { setFormData({ ...formData, empleadoId: emp.numEmpleado || emp.uid, fecha: day.toISOString().split('T')[0] }); setShowModal(true); }} style={{ width: '24px', height: '24px', border: '1px dashed var(--border)', borderRadius: '4px', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '12px' }}>+</button>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="confirm-modal" style={{ maxWidth: '400px', textAlign: 'left' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: '20px' }}>{editingTurno ? 'Editar Turno' : 'Nuevo Turno'}</h3>
            <div style={{ display: 'grid', gap: '12px' }}>
              <select value={formData.empleadoId} onChange={e => setFormData({...formData, empleadoId: e.target.value})} style={{ padding: '12px', border: '1px solid var(--border)', borderRadius: '8px' }}>
                <option value="">Seleccionar empleado...</option>
                {empleados.map(emp => <option key={emp.id} value={emp.numEmpleado || emp.uid}>{emp.nombre}</option>)}
              </select>
              <input type="date" value={formData.fecha} onChange={e => setFormData({...formData, fecha: e.target.value})} style={{ padding: '12px', border: '1px solid var(--border)', borderRadius: '8px' }} />
              <select value={formData.tipo} onChange={e => setFormData({...formData, tipo: e.target.value})} style={{ padding: '12px', border: '1px solid var(--border)', borderRadius: '8px' }}>
                {Object.entries(TIPOS_TURNO).map(([key, val]) => <option key={key} value={key}>{val.label}</option>)}
              </select>
              <input type="text" placeholder="Tienda (opcional)" value={formData.tienda} onChange={e => setFormData({...formData, tienda: e.target.value})} style={{ padding: '12px', border: '1px solid var(--border)', borderRadius: '8px' }} />
              <textarea placeholder="Notas" value={formData.notas} onChange={e => setFormData({...formData, notas: e.target.value})} style={{ padding: '12px', border: '1px solid var(--border)', borderRadius: '8px', minHeight: '60px' }} />
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

export default Turnos;