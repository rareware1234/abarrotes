export const EMPLOYEE_PROFILES = {
  STAFF: {
    id: 'STAFF',
    name: 'Staff',
    color: '#00843D',
    colorHex: '#00843D',
    allowedRoutes: ['pos', 'scanner', 'perfil', 'asistencia', 'tasks', 'caja'],
    canAssignTasks: false,
    canViewReports: false,
    canManageCash: true,
    description: 'Personal de operaciones'
  },
  SUPERVISOR: {
    id: 'SUPERVISOR',
    name: 'Supervisor',
    color: '#007bff',
    colorHex: '#007bff',
    allowedRoutes: ['pos', 'scanner', 'perfil', 'asistencia', 'tasks', 'caja'],
    canAssignTasks: true,
    canViewReports: true,
    canManageCash: true,
    description: 'Supervisión de operaciones'
  },
  DIRECTOR: {
    id: 'DIRECTOR',
    name: 'Director',
    color: '#fd7e14',
    colorHex: '#fd7e14',
    allowedRoutes: ['pos', 'scanner', 'perfil', 'asistencia', 'tasks', 'caja', 'dashboard'],
    canAssignTasks: true,
    canViewReports: true,
    canManageCash: true,
    description: 'Dirección general'
  }
};

export const getProfileById = (profileId) => {
  return EMPLOYEE_PROFILES[profileId?.toUpperCase()] || EMPLOYEE_PROFILES.STAFF;
};

export const getProfileColor = (profileId) => {
  const profile = getProfileById(profileId);
  return profile.colorHex;
};

export const canAccessRoute = (employeeProfile, route) => {
  const profile = getProfileById(employeeProfile);
  return profile.allowedRoutes.includes(route);
};

export const getPermisosByRol = (rol) => {
  const profile = getProfileById(rol);
  return profile.allowedRoutes;
};
