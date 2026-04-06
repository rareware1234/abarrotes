import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import promocionService from '../services/promocionService';
import productService from '../services/productService';
import FilterChips from '../components/FilterChips';
import ConfirmModal from '../components/ConfirmModal';

const Promociones = () => {
  const { hasPermission } = useAuth();
  const [promociones, setPromociones] = useState([]);
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('todas');
  const [showModal, setShowModal] = useState(false);
  const [editingPromo, setEditingPromo] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const canEdit = hasPermission('promociones_crear') || hasPermission('promociones_editar');

  const [formData, setFormData] = useState({
    nombre: '',
    tipo: 'descuento_porcentaje',
    valor: '',
    productos: [],
    categorias: [],
    fechaInicio: '',
    fechaFin: '',
    activa: true
  });

  useEffect(() => {
    fetchData();
  }, [filtro]);

  const fetchData = async () => {
    setLoading(true);
    const [promosResult, productosResult] = await Promise.all([
      promocionService.fetchAll(),
      productService.fetchAll()
    ]);
    if (promosResult.success) {
      let filtered = promosResult.data;
      const hoy = new Date();
      if (filtro === 'activas') filtered = promosResult.data.filter(p => p.activa);
      else if (filtro === 'inactivas') filtered = promosResult.data.filter(p => !p.activa);
      else if (filtro === 'vigentes') {
        filtered = promosResult.data.filter(p => {
          const inicio = p.fechaInicio?.toDate ? p.fechaInicio.toDate() : new Date(p.fechaInicio);
          const fin = p.fechaFin?.toDate ? p.fechaFin.toDate() : new Date(p.fechaFin);
          return p.activa && inicio <= hoy && hoy <= fin;
        });
      }
      setPromociones(filtered);
    }
    if (productosResult.success) setProductos(productosResult.data);
    setLoading(false);
  };

  const getTipoBadge = (tipo) => {
    const tipos = {
      descuento_porcentaje: { label: 'Descuento %', color: '#1A7A48' },
      precio_especial: { label: 'Precio Especial', color: '#2563EB' },
      nxm: { label: 'NxM', color: '#7C3AED' }
    };
    return tipos[tipo] || tipos.descuento_porcentaje;
  };

  const handleSave = async () => {
    if (!formData.nombre || !formData.fechaInicio || !formData.fechaFin) {
      alert('Nombre y fechas son requeridos');
      return;
    }

    const promoData = {
      ...formData,
      valor: parseFloat(formData.valor) || 0,
      fechaInicio: new Date(formData.fechaInicio),
      fechaFin: new Date(formData.fechaFin)
    };

    let result;
    if (editingPromo) {
      result = await promocionService.update(editingPromo.id, promoData);
    } else {
      result = await promocionService.create(promoData);
    }

    if (result.success) {
      setShowModal(false);
      setEditingPromo(null);
      setFormData({ nombre: '', tipo: 'descuento_porcentaje', valor: '', productos: [], categorias: [], fechaInicio: '', fechaFin: '', activa: true });
      fetchData();
    } else {
      alert('Error: ' + result.error);
    }
  };

  const handleEdit = (promo) => {
    setEditingPromo(promo);
    setFormData({
      nombre: promo.nombre || '',
      tipo: promo.tipo || 'descuento_porcentaje',
      valor: promo.valor?.toString() || '',
      productos: promo.productos || [],
      categorias: promo.categorias || [],
      fechaInicio: promo.fechaInicio?.toDate ? promo.fechaInicio.toDate().toISOString().split('T')[0] : promo.fechaInicio?.split('T')[0] || '',
      fechaFin: promo.fechaFin?.toDate ? promo.fechaFin.toDate().toISOString().split('T')[0] : promo.fechaFin?.split('T')[0] || '',
      activa: promo.activa !== false
    });
    setShowModal(true);
  };

  const handleToggle = async (promo) => {
    await promocionService.toggle(promo.id);
    fetchData();
  };

  const handleDelete = async () => {
    if (deleteConfirm) {
      await promocionService.remove(deleteConfirm.id);
      setDeleteConfirm(null);
      fetchData();
    }
  };

  const filterOptions = [
    { value: 'todas', label: 'Todas' },
    { value: 'activas', label: 'Activas' },
    { value: 'inactivas', label: 'Inactivas' },
    { value: 'vigentes', label: 'Vigentes Hoy' }
  ];

  const getStockStats = () => {
    const bajoStock = productos.filter(p => p.stock > 0 && p.stock <= (p.stockMinimo || 5)).length;
    const agotados = productos.filter(p => p.stock === 0).length;
    return { bajoStock, agotados };
  };

  const stockStats = getStockStats();

  return (
    <div className="promociones-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <h1 style={{ margin: 0, fontSize: '24px' }}>Promociones</h1>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div style={{ background: '#FEF3C7', padding: '8px 16px', borderRadius: '8px', fontSize: '13px' }}>
            <span style={{ color: '#F59E0B' }}>⚠️</span> {stockStats.bajoStock} bajo stock
          </div>
          <div style={{ background: '#FEE2E2', padding: '8px 16px', borderRadius: '8px', fontSize: '13px' }}>
            <span style={{ color: '#EF4444' }}>❌</span> {stockStats.agotados} agotados
          </div>
          {canEdit && (
            <button onClick={() => { setEditingPromo(null); setFormData({ nombre: '', tipo: 'descuento_porcentaje', valor: '', productos: [], categorias: [], fechaInicio: '', fechaFin: '', activa: true }); setShowModal(true); }} style={{ padding: '10px 20px', background: 'var(--role-primary)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
              <i className="bi bi-plus-lg me-2"></i>Nueva Promoción
            </button>
          )}
        </div>
      </div>

      <FilterChips opciones={filterOptions} seleccionado={filtro} onChange={setFiltro} />

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px' }}><span className="spinner-border spinner-border-lg"></span></div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px', marginTop: '20px' }}>
          {promociones.map(promo => {
            const tipoInfo = getTipoBadge(promo.tipo);
            return (
              <div key={promo.id} style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '16px' }}>{promo.nombre}</h3>
                    <span style={{ background: tipoInfo.color, color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '11px' }}>
                      {tipoInfo.label}
                    </span>
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                    <input type="checkbox" checked={promo.activa !== false} onChange={() => handleToggle(promo)} disabled={!canEdit} />
                  </label>
                </div>
                <div style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                  {promo.tipo === 'descuento_porcentaje' && `${promo.valor}% de descuento`}
                  {promo.tipo === 'precio_especial' && `Precio especial: $${promo.precioEspecial}`}
                  {promo.tipo === 'nxm' && `Lleva ${promo.lleva} paga ${promo.paga}`}
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                  <i className="bi bi-calendar me-2"></i>
                  {promo.fechaInicio?.toDate ? promo.fechaInicio.toDate().toLocaleDateString('es-MX') : promo.fechaInicio} - {promo.fechaFin?.toDate ? promo.fechaFin.toDate().toLocaleDateString('es-MX') : promo.fechaFin}
                </div>
                {canEdit && (
                  <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                    <button onClick={() => handleEdit(promo)} style={{ flex: 1, padding: '8px', border: '1px solid var(--border)', borderRadius: '6px', background: 'white', cursor: 'pointer' }}>
                      <i className="bi bi-pencil me-2"></i>Editar
                    </button>
                    <button onClick={() => setDeleteConfirm(promo)} style={{ padding: '8px', border: '1px solid #EF4444', borderRadius: '6px', background: 'white', color: '#EF4444', cursor: 'pointer' }}>
                      <i className="bi bi-trash"></i>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="confirm-modal" style={{ maxWidth: '450px', textAlign: 'left', maxHeight: '80vh', overflow: 'auto' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: '20px' }}>{editingPromo ? 'Editar Promoción' : 'Nueva Promoción'}</h3>
            <div style={{ display: 'grid', gap: '12px' }}>
              <input type="text" placeholder="Nombre *" value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} style={{ padding: '12px', border: '1px solid var(--border)', borderRadius: '8px' }} />
              <select value={formData.tipo} onChange={e => setFormData({...formData, tipo: e.target.value})} style={{ padding: '12px', border: '1px solid var(--border)', borderRadius: '8px' }}>
                <option value="descuento_porcentaje">Descuento Porcentaje</option>
                <option value="precio_especial">Precio Especial</option>
                <option value="nxm">Lleva N paga M</option>
              </select>
              <input type="number" placeholder={formData.tipo === 'nxm' ? 'Valor' : 'Porcentaje %'} value={formData.valor} onChange={e => setFormData({...formData, valor: e.target.value})} style={{ padding: '12px', border: '1px solid var(--border)', borderRadius: '8px' }} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <input type="date" placeholder="Fecha inicio" value={formData.fechaInicio} onChange={e => setFormData({...formData, fechaInicio: e.target.value})} style={{ padding: '12px', border: '1px solid var(--border)', borderRadius: '8px' }} />
                <input type="date" placeholder="Fecha fin" value={formData.fechaFin} onChange={e => setFormData({...formData, fechaFin: e.target.value})} style={{ padding: '12px', border: '1px solid var(--border)', borderRadius: '8px' }} />
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input type="checkbox" checked={formData.activa} onChange={e => setFormData({...formData, activa: e.target.checked})} />
                <span>Activa</span>
              </label>
            </div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
              <button onClick={() => setShowModal(false)} className="btn btn-outline-secondary" style={{ flex: 1 }}>Cancelar</button>
              <button onClick={handleSave} className="btn btn-primary" style={{ flex: 1, background: 'var(--role-primary)' }}>Guardar</button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <ConfirmModal titulo="Eliminar Promoción" mensaje={`¿Eliminar "${deleteConfirm.nombre}"?`} onConfirm={handleDelete} onCancel={() => setDeleteConfirm(null)} tipo="danger" />
      )}
    </div>
  );
};

export default Promociones;