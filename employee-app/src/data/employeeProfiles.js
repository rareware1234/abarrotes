// Definición de perfiles de empleado
export const EMPLOYEE_PROFILES = {
  STAFF: {
    id: 'staff',
    name: 'Staff',
    color: '#1e7f5c', // Verde
    colorHex: '#1e7f5c',
    allowedRoutes: ['pos', 'scanner', 'perfil', 'asistencia', 'tasks', 'caja'],
    canAssignTasks: false,
    canViewReports: false,
    canManageCash: true,
    description: 'Personal de operaciones'
  },
  SUPERVISOR: {
    id: 'supervisor',
    name: 'Supervisor',
    color: '#007bff', // Azul
    colorHex: '#007bff',
    allowedRoutes: ['pos', 'scanner', 'perfil', 'asistencia', 'tasks', 'caja'],
    canAssignTasks: true,
    canViewReports: true,
    canManageCash: true,
    description: 'Supervisión de operaciones'
  },
  DIRECTOR: {
    id: 'director',
    name: 'Director',
    color: '#fd7e14', // Anaranjado
    colorHex: '#fd7e14',
    allowedRoutes: ['pos', 'scanner', 'perfil', 'asistencia', 'tasks', 'caja', 'dashboard'],
    canAssignTasks: true,
    canViewReports: true,
    canManageCash: true,
    description: 'Dirección general'
  }
};

// Datos de ejemplo de empleados
export const EMPLOYEES = [
  { id: 'EMP001', name: 'Juan García', profile: 'staff', password: '1234' },
  { id: 'EMP002', name: 'María López', profile: 'staff', password: '1234' },
  { id: 'EMP003', name: 'Carlos Rodríguez', profile: 'supervisor', password: '1234' },
  { id: 'EMP004', name: 'Ana Martínez', profile: 'supervisor', password: '1234' },
  { id: 'EMP005', name: 'Pedro Sánchez', profile: 'director', password: '1234' },
  { id: 'EMP006', name: 'Laura Fernández', profile: 'director', password: '1234' }
];

// Función para obtener el perfil por ID
export const getProfileById = (profileId) => {
  return Object.values(EMPLOYEE_PROFILES).find(p => p.id === profileId) || EMPLOYEE_PROFILES.STAFF;
};

// Función para obtener empleado por ID
export const getEmployeeById = (employeeId) => {
  return EMPLOYEES.find(e => e.id === employeeId) || null;
};

// Función para verificar si un empleado tiene acceso a una ruta
export const canAccessRoute = (employeeProfile, route) => {
  const profile = getProfileById(employeeProfile);
  return profile.allowedRoutes.includes(route);
};

// Función para obtener el color del perfil
export const getProfileColor = (profileId) => {
  const profile = getProfileById(profileId);
  return profile.colorHex;
};
