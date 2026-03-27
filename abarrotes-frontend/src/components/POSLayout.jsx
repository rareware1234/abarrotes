import React from 'react';

export const MenuIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="6" x2="21" y2="6"></line>
    <line x1="3" y1="12" x2="21" y2="12"></line>
    <line x1="3" y1="18" x2="21" y2="18"></line>
  </svg>
);

export const BarcodeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 5v14"></path>
    <path d="M8 5v14"></path>
    <path d="M12 5v14"></path>
    <path d="M17 5v14"></path>
    <path d="M21 5v14"></path>
  </svg>
);

export const PlusIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="12" y1="5" x2="12" y2="19"></line>
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
);

export const MinusIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
);

export const TrashIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"></polyline>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
  </svg>
);

export const CartIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9" cy="21" r="1"></circle>
    <circle cx="20" cy="21" r="1"></circle>
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
  </svg>
);

export const CreditCardIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
    <line x1="1" y1="10" x2="23" y2="10"></line>
  </svg>
);

const POSLayout = ({
  children,
  title = 'Punto de Venta',
  onToggleSidebar,
  showSearchBar = true,
  searchValue = '',
  onSearchChange = () => {},
  onSearchSubmit = () => {},
  showSuggestions = false,
  suggestions = [],
  onSelectSuggestion = () => {},
  searchPlaceholder = 'Escanear codigo...'
}) => {
  return (
    <div className="pos-layout">
      {/* 1. NAVBAR */}
      <header className="pos-navbar">
        <button className="hamburger-btn" onClick={onToggleSidebar}>
          <MenuIcon />
        </button>
        <h1 className="pos-title">{title}</h1>
        <div className="nav-spacer" />
      </header>

      {/* 2. BARRA DE BUSQUEDA */}
      {showSearchBar && (
        <div className="pos-search-bar" style={{ position: 'relative' }}>
          <div className="search-input-wrapper">
            <BarcodeIcon />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onSearchSubmit()}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
            />
          </div>
        </div>
      )}

      {/* 3. CONTENIDO SCROLLEABLE */}
      <main className="pos-content">
        {children}
      </main>
    </div>
  );
};

export default POSLayout;
