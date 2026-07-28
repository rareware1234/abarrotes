/**
 * Encabezado estándar de página — mismo layout exacto que Inicio.
 * Úsalo en cualquier página que necesite un título grande blanco
 * alineado con el gradiente de fondo.
 *
 * Props:
 *   title    — string, texto del h1
 *   actions  — node opcional (botones, chips, etc. a la derecha del título)
 */
export default function PageHeader({ title, actions }) {
  return (
    <header className="inicio-header">
      <h1>{title}</h1>
      {actions && <div className="inicio-header-actions">{actions}</div>}
    </header>
  );
}
