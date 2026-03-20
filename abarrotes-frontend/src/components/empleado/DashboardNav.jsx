import React from 'react';

const DashboardNav = ({ activeTab, setActiveTab }) => {
  const menuItems = [
    { id: 'perfil', icon: 'bi-person', label: 'Mi Perfil' },
    { id: 'ventas', icon: 'bi-graph-up', label: 'Mis Ventas' },
    { id: 'caja', icon: 'bi-cash-stack', label: 'Caja' },
    { id: 'metas', icon: 'bi-bullseye', label: 'Metas' },
    { id: 'productos', icon: 'bi-box', label: 'Productos' },
    { id: 'historial', icon: 'bi-clock-history', label: 'Historial' },
  ];

  return (
    <div className="d-flex flex-column gap-1">
      {menuItems.map((item) => (
        <button
          key={item.id}
          className={`btn d-flex align-items-center px-3 py-2 text-start rounded ${
            activeTab === item.id ? 'btn-success text-white' : 'btn-light text-dark'
          }`}
          onClick={() => setActiveTab(item.id)}
        >
          <i className={`bi ${item.icon} me-3 ${activeTab === item.id ? '' : 'text-muted'}`}></i>
          <span className="small fw-medium">{item.label}</span>
        </button>
      ))}
    </div>
  );
};

export default DashboardNav;