import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import tiendaService from '../services/tiendaService';
import ConfirmModal from '../components/ConfirmModal';

const FORMATOS = {
  'PuntoVerde': { color: '#1A7A48', label: 'PuntoVerde' },
  'PuntoVerde GO': { color: '#2563EB', label: 'PuntoVerde GO' },
  'PuntoVerde XL': { color: '#7C3AED', label: 'PuntoVerde XL' }
};

const Tiendas = () => {
  const { hasPermission } = useAuth();
  const [tiendas, setTiendas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTienda, setEditingTienda] = useState(null);

  const canEdit = hasPermission('tiendas_crear') || hasPermission('tiendas_editar');

  const [formData, setFormData] = useState({
    nombre: '',
    formato: 'PuntoVerde',
    calle: '',
    numeroExterior: '',
    numeroInterior: '',
    colonia: '',
    cp: '',
    ciudad: '',
    estado: '',
    pais: 'México',
    telefono: '',
    responsable: '',
    responsableId: '',
    horarioApertura: '07:00',
    horarioCierre: '23:00',
    activa: true
  });

  useEffect(() => {
    fetchTiendas();
  }, []);

  const fetchTiendas = async () => {
    setLoading(true);
    const result = await tiendaService.fetchTodas();
    if (result.success) {
      setTiendas(result.data);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!formData.nombre) {
      alert('El nombre de la tienda es requerido');
      return;
    }

    let result;
    if (editingTienda) {
      result = await tiendaService.update(editingTienda.id, formData);
    } else {
      result = await tiendaService.create(formData);
    }

    if (result.success) {
      setShowModal(false);
      setEditingTienda(null);
      resetForm();
      fetchTiendas();
    } else {
      alert('Error: ' + result.error);
    }
  };

  const handleEdit = (tienda) => {
    setEditingTienda(tienda);
    setFormData({
      nombre: tienda.nombre || '',
      formato: tienda.formato || 'PuntoVerde',
      calle: tienda.direccion?.calle || '',
      numeroExterior: tienda.direccion?.numeroExterior || '',
      numeroInterior: tienda.direccion?.numeroInterior || '',
      colonia: tienda.direccion?.colonia || '',
      cp: tienda.direccion?.cp || '',
      ciudad: tienda.direccion?.ciudad || '',
      estado: tienda.direccion?.estado || '',
      pais: tienda.direccion?.pais || 'México',
      telefono: tienda.telefono || '',
      responsable: tienda.responsable || '',
      responsableId: tienda.responsableId || '',
      horarioApertura: tienda.horarioApertura || '07:00',
      horarioCierre: tienda.horarioCierre || '23:00',
      activa: tienda.activa !== false
    });
    setShowModal(true);
  };

  const handleToggleActiva = async (tienda) => {
    await tiendaService.toggleActiva(tienda.id);
    fetchTiendas();
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      formato: 'PuntoVerde',
      calle: '',
      numeroExterior: '',
      numeroInterior: '',
      colonia: '',
      cp: '',
      ciudad: '',
      estado: '',
      pais: 'México',
      telefono: '',
      responsable: '',
      responsableId: '',
      horarioApertura: '07:00',
      horarioCierre: '23:00',
      activa: true
    });
  };

  return (
    <div className="tiendas-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ margin: 0, fontSize: '24px' }}>Tiendas</h1>
        {canEdit && (
          <button onClick={() => { setEditingTienda(null); resetForm(); setShowModal(true); }} style={{ padding: '10px 20px', background: 'var(--role-primary)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
            <i className="bi bi-plus-lg me-2"></i>Nueva Tienda
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px' }}><span className="spinner-border spinner-border-lg"></span></div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '16px' }}>
          {tiendas.map(tienda => {
            const formatoInfo = FORMATOS[tienda.formato] || FORMATOS['PuntoVerde'];
            return (
              <div key={tienda.id} style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '18px' }}>{tienda.nombre}</h3>
                    <span style={{ background: formatoInfo.color, color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600 }}>
                      {formatoInfo.label}
                    </span>
                  </div>
                  <span style={{ background: tienda.activa !== false ? '#dcfce7' : '#fee2e2', color: tienda.activa !== false ? '#1A7A48' : '#EF4444', padding: '4px 12px', borderRadius: '12px', fontSize: '12px' }}>
                    {tienda.activa !== false ? 'Activa' : 'Inactiva'}
                  </span>
                </div>
                <div style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                  <i className="bi bi-geo-alt me-2"></i>
                  {tienda.direccion?.calle} #{tienda.direccion?.numeroExterior}, {tienda.direccion?.colonia}, {tienda.direccion?.ciudad}
                </div>
                {tienda.telefono && (
                  <div style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                    <i className="bi bi-telephone me-2"></i>{tienda.telefono}
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                    <i className="bi bi-clock me-2"></i>{tienda.horarioApertura} - {tienda.horarioCierre}
                  </div>
                  {canEdit && (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => handleToggleActiva(tienda)} style={{ padding: '6px 12px', border: '1px solid var(--border)', borderRadius: '6px', background: 'white', cursor: 'pointer', fontSize: '12px' }}>
                        {tienda.activa !== false ? 'Desactivar' : 'Activar'}
                      </button>
                      <button onClick={() => handleEdit(tienda)} style={{ padding: '6px 12px', border: '1px solid var(--border)', borderRadius: '6px', background: 'white', cursor: 'pointer' }}>
                        <i className="bi bi-pencil"></i>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="confirm-modal" style={{ maxWidth: '500px', textAlign: 'left', maxHeight: '80vh', overflow: 'auto' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: '20px' }}>{editingTienda ? 'Editar Tienda' : 'Nueva Tienda'}</h3>
            <div style={{ display: 'grid', gap: '12px' }}>
              <input type="text" placeholder="Nombre de la tienda *" value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} style={{ padding: '12px', border: '1px solid var(--border)', borderRadius: '8px' }} />
              <select value={formData.formato} onChange={e => setFormData({...formData, formato: e.target.value})} style={{ padding: '12px', border: '1px solid var(--border)', borderRadius: '8px' }}>
                {Object.entries(FORMATOS).map(([key, val]) => <option key={key} value={key}>{val.label}</option>)}
              </select>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '8px' }}>
                <input type="text" placeholder="Calle" value={formData.calle} onChange={e => setFormData({...formData, calle: e.target.value})} style={{ padding: '12px', border: '1px solid var(--border)', borderRadius: '8px' }} />
                <input type="text" placeholder="No. Ext." value={formData.numeroExterior} onChange={e => setFormData({...formData, numeroExterior: e.target.value})} style={{ padding: '12px', border: '1px solid var(--border)', borderRadius: '8px' }} />
                <input type="text" placeholder="No. Int." value={formData.numeroInterior} onChange={e => setFormData({...formData, numeroInterior: e.target.value})} style={{ padding: '12px', border: '1px solid var(--border)', borderRadius: '8px' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <input type="text" placeholder="Colonia" value={formData.colonia} onChange={e => setFormData({...formData, colonia: e.target.value})} style={{ padding: '12px', border: '1px solid var(--border)', borderRadius: '8px' }} />
                <input type="text" placeholder="CP" value={formData.cp} onChange={e => setFormData({...formData, cp: e.target.value})} style={{ padding: '12px', border: '1px solid var(--border)', borderRadius: '8px' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <input type="text" placeholder="Ciudad" value={formData.ciudad} onChange={e => setFormData({...formData, ciudad: e.target.value})} style={{ padding: '12px', border: '1px solid var(--border)', borderRadius: '8px' }} />
                <input type="text" placeholder="Estado" value={formData.estado} onChange={e => setFormData({...formData, estado: e.target.value})} style={{ padding: '12px', border: '1px solid var(--border)', borderRadius: '8px' }} />
              </div>
              <input type="tel" placeholder="Teléfono" value={formData.telefono} onChange={e => setFormData({...formData, telefono: e.target.value})} style={{ padding: '12px', border: '1px solid var(--border)', borderRadius: '8px' }} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <input type="time" value={formData.horarioApertura} onChange={e => setFormData({...formData, horarioApertura: e.target.value})} style={{ padding: '12px', border: '1px solid var(--border)', borderRadius: '8px' }} />
                <input type="time" value={formData.horarioCierre} onChange={e => setFormData({...formData, horarioCierre: e.target.value})} style={{ padding: '12px', border: '1px solid var(--border)', borderRadius: '8px' }} />
              </div>
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

export default Tiendas;