import React, { useEffect, useState } from 'react';
import promocionService from '../../services/promocionService';

const TIPO_CONFIG = {
  descuento_porcentaje: { label: 'Descuento', color: '#2563EB', bg: '#EFF6FF' },
  precio_especial:      { label: 'Precio esp.', color: '#7C3AED', bg: '#F5F3FF' },
  nxm:                  { label: 'NxM', color: '#059669', bg: '#ECFDF5' },
  '2x1':               { label: '2x1', color: '#059669', bg: '#ECFDF5' },
  DESCUENTO:            { label: 'Descuento', color: '#2563EB', bg: '#EFF6FF' },
  LIQUIDACION:          { label: 'Liquidación', color: '#DC2626', bg: '#FEF2F2' },
};

const PromotionsPanel = () => {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    promocionService.fetchAll().then((res) => {
      if (res.success) {
        const now = new Date();
        const activas = res.data.filter((p) => {
          if (p.activa === false) return false;
          const inicio = p.fechaInicio?.toDate ? p.fechaInicio.toDate() : new Date(p.fechaInicio || 0);
          const fin    = p.fechaFin?.toDate    ? p.fechaFin.toDate()    : new Date(p.fechaFin    || 0);
          return inicio <= now && now <= fin;
        });
        setPromotions(activas);
      }
      setLoading(false);
    });
  }, []);

  const label = (promo) => {
    if (promo.tipo === 'descuento_porcentaje') return `${promo.valor}% dto.`;
    if (promo.tipo === 'precio_especial') return `$${promo.precioEspecial || promo.valor}`;
    if (promo.tipo === 'nxm') return `${promo.lleva || promo.valor}×${promo.paga || promo.valorSecundario}`;
    if (promo.valor) return `${promo.valor}${promo.tipo === 'DESCUENTO' || promo.tipo === 'LIQUIDACION' ? '%' : ''}`;
    return promo.tipo;
  };

  return (
    <div className="card border-0 shadow-sm mb-4">
      <div className="card-header bg-white border-0 pt-3 d-flex justify-content-between align-items-center">
        <h6 className="fw-bold mb-0">
          <i className="bi bi-tag-fill text-warning me-2" />Promociones Activas
        </h6>
        <span className="badge bg-light text-dark border">{promotions.length}</span>
      </div>
      <div className="card-body py-2">
        {loading ? (
          <div className="text-center py-3">
            <div className="spinner-border spinner-border-sm text-primary" role="status" />
          </div>
        ) : promotions.length === 0 ? (
          <p className="text-muted small text-center mb-0 py-2">Sin promociones activas</p>
        ) : (
          <div className="list-group list-group-flush">
            {promotions.map((promo) => {
              const cfg = TIPO_CONFIG[promo.tipo] || { label: promo.tipo, color: '#6B7280', bg: '#F9FAFB' };
              return (
                <div key={promo.id} className="list-group-item px-0 py-2 d-flex justify-content-between align-items-center">
                  <div>
                    <span className="fw-medium small">{promo.nombre}</span>
                    {promo.descripcion && <><br /><small className="text-muted">{promo.descripcion}</small></>}
                  </div>
                  <span style={{
                    fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 12,
                    background: cfg.bg, color: cfg.color, whiteSpace: 'nowrap', marginLeft: 8,
                  }}>
                    {cfg.label} {label(promo)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default PromotionsPanel;
