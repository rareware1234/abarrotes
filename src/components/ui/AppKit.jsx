// ============================================================
// AppKit — componentes de VENTANA reutilizables (el "método" que engloba todo
// el diseño, como en macOS). Úsalos en toda la app para que las pantallas se
// vean idénticas: mismo frame, título, padding, colores y cards.
//
//   <AppScreen title="X" subtitle="…" actions={…}>
//     <Section title="Grupo" count={3}>
//       <Card pad> … </Card>
//       <Card>
//         <Row label="A" detail="B" />
//         <Divider />
//         <ToggleRow label="C" checked={on} onChange={fn} />
//       </Card>
//     </Section>
//   </AppScreen>
// ============================================================
import React from 'react';
import './appkit.css';

/** Frame de ventana: fondo continuo de marca + header (título 34) + contenido. */
export function AppScreen({ title, subtitle, actions, children, className = '' }) {
  return (
    <div className={`app-screen ${className}`}>
      <div className="app-screen-inner">
        {(title || actions) && (
          <header className="app-screen-header">
            {title && <h1>{title}</h1>}
            {actions && <div className="app-screen-actions">{actions}</div>}
          </header>
        )}
        {subtitle && <div className="app-screen-subtitle">{subtitle}</div>}
        {children}
      </div>
    </div>
  );
}

/** Sección con encabezado (título 20) y cuerpo con padding de contenido. */
export function Section({ title, icon, count, actions, children }) {
  return (
    <section className="app-section">
      {(title || actions) && (
        <div className="app-section-head">
          {icon && <i className={`bi ${icon}`} />}
          {title && <h2>{title}</h2>}
          {count != null && <span className="app-section-count">{count}</span>}
          {actions && <div className="app-section-actions">{actions}</div>}
        </div>
      )}
      <div className="app-section-body">{children}</div>
    </section>
  );
}

/** Card glass. `pad` añade padding 20; `title` pone un group-title arriba. */
export function Card({ children, pad = false, title, style }) {
  const card = <div className={`app-card ${pad ? 'app-card--pad' : ''}`} style={style}>{children}</div>;
  if (!title) return card;
  return (<div><p className="app-group-title">{title}</p>{card}</div>);
}

/** Fila etiqueta/detalle (con chevron/click opcional). */
export function Row({ label, detail, chevron, onClick, children }) {
  return (
    <div className="app-row" onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
      {children || <span className="app-row-label">{label}</span>}
      {(detail || chevron) && (
        <span className="app-row-detail">
          {detail}
          {chevron && <i className="bi bi-chevron-right app-chevron" />}
        </span>
      )}
    </div>
  );
}

export function Divider() { return <div className="app-divider" />; }

/** Fila con toggle switch. */
export function ToggleRow({ label, subtitle, checked, onChange }) {
  return (
    <div className="app-row">
      <div className="app-row-text">
        <span className="app-row-label">{label}</span>
        {subtitle && <span className="app-row-subtitle">{subtitle}</span>}
      </div>
      <Toggle checked={checked} onChange={onChange} />
    </div>
  );
}

export function Toggle({ checked, onChange }) {
  return (
    <div className={`app-toggle ${checked ? 'on' : ''}`} onClick={() => onChange?.(!checked)}>
      <div className="app-toggle-thumb" />
    </div>
  );
}

export function Button({ variant = 'primary', children, ...props }) {
  return <button className={`app-btn app-btn--${variant}`} {...props}>{children}</button>;
}

export default { AppScreen, Section, Card, Row, Divider, ToggleRow, Toggle, Button };
