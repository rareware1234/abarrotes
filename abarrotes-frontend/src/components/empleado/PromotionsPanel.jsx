import React, { useEffect, useState } from 'react';

const PromotionsPanel = () => {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPromotions = async () => {
      try {
        // Ajusta la URL según tu configuración de entorno
        const response = await fetch('http://localhost:8080/api/promotions');
        if (!response.ok) {
          throw new Error('Error al cargar promociones');
        }
        const data = await response.json();
        setPromotions(data);
      } catch (error) {
        console.error('Error fetching promotions:', error);
        // Opcional: mostrar un mensaje de error al usuario
      } finally {
        setLoading(false);
      }
    };

    fetchPromotions();
  }, []);

  const getBadgeColor = (tipo) => {
    switch (tipo) {
      case '2x1': return 'bg-success';
      case 'DESCUENTO': return 'bg-primary';
      case 'LIQUIDACION': return 'bg-danger';
      default: return 'bg-secondary';
    }
  };

  return (
    <div className="card border-0 shadow-sm mb-4">
      <div className="card-header bg-white border-0 pt-3 d-flex justify-content-between align-items-center">
        <h6 className="fw-bold mb-0">
          <i className="bi bi-tag-fill text-warning me-2"></i>Promociones Activas
        </h6>
        <span className="badge bg-light text-dark border">{promotions.length}</span>
      </div>
      <div className="card-body">
        {loading ? (
          <div className="text-center py-3">
            <div className="spinner-border spinner-border-sm text-primary" role="status">
              <span className="visually-hidden">Cargando...</span>
            </div>
          </div>
        ) : (
          <div className="list-group list-group-flush">
            {promotions.map((promo) => (
              <div key={promo.id} className="list-group-item px-0 py-2 d-flex justify-content-between align-items-center">
                <div>
                  <span className="fw-medium small">{promo.nombre}</span>
                  <br />
                  <small className="text-muted">{promo.razon}</small>
                </div>
                <span className={`badge ${getBadgeColor(promo.tipo)} text-white`}>
                  {promo.tipo} {promo.valor}{promo.tipo === 'DESCUENTO' || promo.tipo === 'LIQUIDACION' ? '%' : ''}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PromotionsPanel;