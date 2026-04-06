import React from 'react';

const FilterChips = ({ opciones, seleccionado, onChange }) => {
  return (
    <div className="filter-chips">
      {opciones.map((opcion) => (
        <button
          key={opcion.value}
          className={`filter-chip ${seleccionado === opcion.value ? 'active' : ''}`}
          onClick={() => onChange(opcion.value)}
        >
          {opcion.label}
        </button>
      ))}
    </div>
  );
};

export default FilterChips;