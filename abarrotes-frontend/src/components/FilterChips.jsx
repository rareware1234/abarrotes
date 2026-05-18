import React from 'react';

const FilterChips = ({ opciones, seleccionado, onChange, hasSearchBar = false }) => {
  return (
    <>
      <div className={`filter-chips-bar${hasSearchBar ? ' below-search' : ''}`}>
        <div
          className="filter-chips"
          style={{
            flexWrap: 'nowrap',
            overflowX: 'auto',
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            paddingBottom: '2px',
          }}
        >
          {opciones.map((opcion) => (
            <button
              key={opcion.value}
              className={`filter-chip ${seleccionado === opcion.value ? 'active' : ''}`}
              style={{ whiteSpace: 'nowrap', flexShrink: 0 }}
              onClick={() => onChange(opcion.value)}
            >
              {opcion.label}
            </button>
          ))}
        </div>
      </div>
      <div className="filter-chips-spacer" />
    </>
  );
};

export default FilterChips;