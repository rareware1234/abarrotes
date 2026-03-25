export type Rol = 'STAFF' | 'SUPERVISOR' | 'DIRECTOR';

export const ROLES_COLOR: Record<Rol, string> = {
  STAFF: '#1e7f5c',
  SUPERVISOR: '#007bff',
  DIRECTOR: '#fd7e14',
};

export const RUTAS_POR_ROL: Record<Rol, string[]> = {
  STAFF: ['pos', 'scanner', 'perfil', 'asistencia', 'tasks', 'caja'],
  SUPERVISOR: ['pos', 'scanner', 'perfil', 'asistencia', 'tasks', 'caja'],
  DIRECTOR: ['pos', 'scanner', 'perfil', 'asistencia', 'tasks', 'caja', 'dashboard'],
};

export const PERMISOS: Record<Rol, {
  asignarTareas: boolean;
  verReportes: boolean;
  manejarCaja: boolean;
  verDashboard: boolean;
}> = {
  STAFF: { asignarTareas: false, verReportes: false, manejarCaja: true, verDashboard: false },
  SUPERVISOR: { asignarTareas: true, verReportes: true, manejarCaja: true, verDashboard: false },
  DIRECTOR: { asignarTareas: true, verReportes: true, manejarCaja: true, verDashboard: true },
};
