// Definición de perfiles de empleado — sincronizado con macOS
export const EMPLOYEE_PROFILES = {
  staff: {
    id: 'staff',
    name: 'Staff',
    color: '#1A7A48',
    colorDark: '#0F4D2E',
    colorHover: '#166040',
    colorAccent: '#4ADE80',
    colorHex: '#1A7A48',
    icon: '👤',
    allowedRoutes: ['pos', 'scanner', 'perfil', 'asistencia', 'tasks', 'caja'],
    canAssignTasks: false,
    canViewReports: false,
    canManageCash: true,
    description: 'Empleado operativo con acceso a punto de venta'
  },
  manager: {
    id: 'manager',
    name: 'Manager',
    color: '#2563EB',
    colorDark: '#1E3A5F',
    colorHover: '#1D4ED8',
    colorAccent: '#60A5FA',
    colorHex: '#2563EB',
    icon: '💼',
    allowedRoutes: ['pos', 'scanner', 'perfil', 'asistencia', 'tasks', 'caja', 'dashboard', 'promociones', 'creditos'],
    canAssignTasks: true,
    canViewReports: true,
    canManageCash: true,
    description: 'Gerente con acceso a reportes y promociones'
  },
  admin: {
    id: 'admin',
    name: 'Administrador',
    color: '#64748B',
    colorDark: '#1E293B',
    colorHover: '#475569',
    colorAccent: '#F59E0B',
    colorHex: '#64748B',
    icon: '👑',
    allowedRoutes: ['pos', 'scanner', 'perfil', 'asistencia', 'tasks', 'caja', 'dashboard', 'inventory', 'configuracion', 'promociones', 'creditos'],
    canAssignTasks: true,
    canViewReports: true,
    canManageCash: true,
    description: 'Administrador con acceso total al sistema'
  }
};

// Datos de ejemplo de empleados
export const EMPLOYEES = [
  { id: 'EMP001', name: 'Juan García', profile: 'staff', password: '1234' },
  { id: 'EMP002', name: 'María López', profile: 'staff', password: '1234' },
  { id: 'EMP003', name: 'Carlos Rodríguez', profile: 'manager', password: '1234' },
  { id: 'EMP004', name: 'Ana Martínez', profile: 'manager', password: '1234' },
  { id: 'EMP005', name: 'Pedro Sánchez', profile: 'admin', password: '1234' },
  { id: 'EMP006', name: 'Laura Fernández', profile: 'admin', password: '1234' },
  { id: 'ADMIN001', name: 'Juan Perez', profile: 'admin', password: 'admin123' }
];

// Función para obtener el perfil por ID (con compatibilidad legacy)
export const getProfileById = (profileId) => {
  const mapped = {
    'supervisor': 'manager',
    'lider': 'manager',
    'director': 'admin',
    'administrador': 'admin'
  };
  const id = mapped[profileId?.toLowerCase()] || profileId?.toLowerCase() || 'staff';
  return EMPLOYEE_PROFILES[id] || EMPLOYEE_PROFILES.staff;
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

// Función para validar credenciales
export const validateCredentials = (numeroEmpleado, password) => {
  const employee = EMPLOYEES.find(e => e.id === numeroEmpleado && e.password === password);
  if (!employee) return null;
  const profile = getProfileById(employee.profile);
  return {
    id: employee.id,
    name: employee.name,
    profile: employee.profile,
    profileName: profile.name,
    profileColor: profile.colorHex,
    profileColorDark: profile.colorDark,
    profileIcon: profile.icon
  };
};
