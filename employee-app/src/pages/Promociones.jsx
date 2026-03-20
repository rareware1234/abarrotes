import React, { useState, useEffect } from 'react';
import { FaTag, FaPercent, FaGift, FaInfoCircle } from 'react-icons/fa';
import promotionService from '../services/promotionService';

const Promociones = () => {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPromotions();
  }, []);

  const loadPromotions = async () => {
    try {
      setLoading(true);
      const data = await promotionService.getActivePromotions();
      setPromotions(data);
    } catch (error) {
      console.error('Error cargando promociones:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPromoIcon = (type) => {
    switch (type) {
      case '2x1':
        return FaGift;
      case 'DESCUENTO':
        return FaPercent;
      case 'LIQUIDACION':
        return FaInfoCircle;
      default:
        return FaTag;
    }
  };

  const getPromoColor = (type) => {
    switch (type) {
      case '2x1':
        return '#28a745'; // Success green
      case 'DESCUENTO':
        return '#1e7f5c'; // Primary green
      case 'LIQUIDACION':
        return '#dc3545'; // Danger red
      default:
        return '#6c757d'; // Secondary gray
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '200px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in">
      <div className="card mb-4">
        <div className="card-body text-center py-4">
          <FaTag size={48} style={{ color: '#1e7f5c', marginBottom: '16px' }} />
          <h3 className="h5 fw-bold mb-1">
            Promociones Activas
          </h3>
          <p className="text-muted small mb-0">
            {promotions.length} promociones disponibles
          </p>
        </div>
      </div>

      {promotions.length > 0 ? (
        <div className="d-flex flex-column gap-3">
          {promotions.map((promo, index) => {
            const Icon = getPromoIcon(promo.tipo);
            const color = getPromoColor(promo.tipo);
            
            return (
              <div 
                key={index} 
                className="card fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="card-body">
                  <div className="d-flex align-items-center">
                    <div 
                      className="rounded-circle d-flex align-items-center justify-content-center me-3"
                      style={{ 
                        width: '50px', 
                        height: '50px', 
                        backgroundColor: `${color}20`,
                        color: color
                      }}
                    >
                      <Icon size={24} />
                    </div>
                    <div className="flex-grow-1">
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <h4 className="h6 fw-bold mb-1">{promo.nombre}</h4>
                          <p className="text-muted small mb-0">{promo.razon}</p>
                        </div>
                        <span 
                          className="badge px-3 py-2"
                          style={{ backgroundColor: color }}
                        >
                          {promo.tipo === '2x1' ? '2x1' : 
                           promo.tipo === 'DESCUENTO' ? `-${promo.valor}%` : 
                           promo.tipo}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card">
          <div className="card-body text-center py-5">
            <FaTag size={48} className="text-muted mb-3" />
            <p className="text-muted mb-0">
              No hay promociones activas en este momento
            </p>
          </div>
        </div>
      )}

      {/* Info adicional */}
      <div className="alert alert-info mt-4" style={{ backgroundColor: '#e8f5e9', borderColor: '#1e7f5c' }}>
        <small>
          <strong>💡 Tip:</strong> Las promociones se generan automáticamente 
          basadas en el stock y la fecha de caducidad de los productos.
        </small>
      </div>
    </div>
  );
};

export default Promociones;
