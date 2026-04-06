import React, { createContext, useState, useContext, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  getFirestore,
  doc,
  getDoc,
  collection,
  getDocs,
  query,
  where
} from 'firebase/firestore';
import { firebaseConfig } from '../firebase-config/firebase-config';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Temas completos por rol
const ROLE_THEME = {
  staff: {
    primary: '#1A7A48',
    dark: '#0F4D2E',
    hover: '#166040',
    accent: '#4ADE80',
    tintedBg: 'rgba(26,122,72,0.08)',
    shadow: 'rgba(26,122,72,0.20)',
    gradient: 'linear-gradient(135deg, #0F4D2E 0%, #1A7A48 100%)',
    gradientSoft: 'linear-gradient(135deg, rgba(26,122,72,0.12) 0%, rgba(74,222,128,0.08) 100%)',
    navBg: '#0F4D2E',
    activeTab: '#4ADE80',
    icon: '👤',
    label: 'Staff',
    // Compatibilidad legacy
    color: '#1A7A48',
    colorDark: '#0F4D2E',
    colorHover: '#166040',
    colorAccent: '#4ADE80',
    colorHex: '#1A7A48'
  },
  manager: {
    primary: '#2563EB',
    dark: '#1E3A5F',
    hover: '#1D4ED8',
    accent: '#60A5FA',
    tintedBg: 'rgba(37,99,235,0.08)',
    shadow: 'rgba(37,99,235,0.20)',
    gradient: 'linear-gradient(135deg, #1E3A5F 0%, #2563EB 100%)',
    gradientSoft: 'linear-gradient(135deg, rgba(37,99,235,0.12) 0%, rgba(96,165,250,0.08) 100%)',
    navBg: '#1E3A5F',
    activeTab: '#60A5FA',
    icon: '💼',
    label: 'Manager',
    // Compatibilidad legacy
    color: '#2563EB',
    colorDark: '#1E3A5F',
    colorHover: '#1D4ED8',
    colorAccent: '#60A5FA',
    colorHex: '#2563EB'
  },
  admin: {
    primary: '#64748B',
    dark: '#1E293B',
    hover: '#475569',
    accent: '#F59E0B',
    tintedBg: 'rgba(100,116,139,0.08)',
    shadow: 'rgba(100,116,139,0.20)',
    gradient: 'linear-gradient(135deg, #1E293B 0%, #475569 100%)',
    gradientSoft: 'linear-gradient(135deg, rgba(100,116,139,0.12) 0%, rgba(245,158,11,0.08) 100%)',
    navBg: '#1E293B',
    activeTab: '#F59E0B',
    icon: '👑',
    label: 'Administrador',
    // Compatibilidad legacy
    color: '#64748B',
    colorDark: '#1E293B',
    colorHover: '#475569',
    colorAccent: '#F59E0B',
    colorHex: '#64748B'
  }
};

// Permisos por rol
const PERMISOS = {
  staff: [
    'ventas',
    'productos_ver',
    'caja_consulta'
  ],
  manager: [
    'ventas',
    'productos_ver',
    'productos_editar',
    'productos_agregar',
    'caja_consulta',
    'caja_operar',
    'reportes',
    'empleados_ver',
    'creditos_ver',
    'creditos_aprobar'
  ],
  admin: [
    'ventas',
    'productos_ver',
    'productos_editar',
    'productos_agregar',
    'productos_eliminar',
    'caja_consulta',
    'caja_operar',
    'reportes',
    'empleados_ver',
    'empleados_editar',
    'empleados_crear',
    'tiendas_ver',
    'tiendas_editar',
    'tiendas_crear',
    'turnos_ver',
    'turnos_editar',
    'turnos_crear',
    'tareas_ver',
    'tareas_editar',
    'tareas_crear',
    'promociones_ver',
    'promociones_editar',
    'promociones_crear',
    'creditos_ver',
    'creditos_aprobar',
    'creditos_editar'
  ]
};

const ROL_MAP = {
  'STAFF': 'staff',
  'LIDER': 'manager',
  'MANAGER': 'manager',
  'DIRECTOR': 'admin',
  'ADMIN': 'admin'
};

// Función para aplicar tema al DOM
const aplicarTemaRol = (rol) => {
  const t = ROLE_THEME[rol] || ROLE_THEME.staff;
  const root = document.documentElement;
  
  // Nuevas variables CSS
  root.style.setProperty('--role-primary', t.primary);
  root.style.setProperty('--role-dark', t.dark);
  root.style.setProperty('--role-hover', t.hover);
  root.style.setProperty('--role-accent', t.accent);
  root.style.setProperty('--role-tinted-bg', t.tintedBg);
  root.style.setProperty('--role-shadow', t.shadow);
  root.style.setProperty('--role-gradient', t.gradient);
  root.style.setProperty('--role-gradient-soft', t.gradientSoft);
  root.style.setProperty('--role-nav-bg', t.navBg);
  root.style.setProperty('--role-active-tab', t.activeTab);
  
  // Compatibilidad legacy con useProfileColor
  root.style.setProperty('--primary', t.primary);
  root.style.setProperty('--primary-dark', t.dark);
  root.style.setProperty('--primary-hover', t.hover);
  root.style.setProperty('--primary-light', t.accent);
  root.style.setProperty('--primary-color', t.colorHex);
};

export const AuthProvider = ({ children }) => {
  const [empleado, setEmpleado] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restaurar sesión al cargar
  useEffect(() => {
    const storedEmpleado = sessionStorage.getItem('desktop_empleado');
    if (storedEmpleado) {
      const emp = JSON.parse(storedEmpleado);
      setEmpleado(emp);
      aplicarTemaRol(emp.rol);
    }
    setIsLoading(false);
  }, []);

  const signIn = async (numEmpleado, password) => {
    try {
      setIsLoading(true);
      
      const email = `${numEmpleado}@puntosverde.com`;
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      const empleadosRef = collection(db, 'empleados');
      const q = query(empleadosRef, where('numEmpleado', '==', numEmpleado));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        await signOut(auth);
        return { success: false, error: 'Empleado no encontrado en el sistema' };
      }
      
      const empleadoDoc = snapshot.docs[0];
      const empleadoData = empleadoDoc.data();
      const rol = ROL_MAP[empleadoData.rol?.toUpperCase()] || 'staff';
      
      const empleadoCompleto = {
        uid: user.uid,
        nombre: empleadoData.nombre,
        numEmpleado: numEmpleado,
        rol: rol,
        email: user.email,
        tiendaId: empleadoData.tiendaId || null,
        tiendasAsignadas: empleadoData.tiendasAsignadas || [],
        requiereCambioPassword: empleadoData.requiereCambioPassword || false,
        activo: empleadoData.activo !== false
      };
      
      if (!empleadoCompleto.activo) {
        await signOut(auth);
        return { success: false, error: 'Tu cuenta está desactivada' };
      }
      
      sessionStorage.setItem('desktop_empleado', JSON.stringify(empleadoCompleto));
      setEmpleado(empleadoCompleto);
      aplicarTemaRol(rol);
      
      return { success: true };
    } catch (error) {
      console.error('Error en signIn:', error);
      let mensaje = 'Error al iniciar sesión';
      if (error.code === 'auth/invalid-credential') {
        mensaje = 'Número de empleado o contraseña incorrectos';
      } else if (error.code === 'auth/user-disabled') {
        mensaje = 'Tu cuenta está desactivada';
      }
      return { success: false, error: mensaje };
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      await signOut(auth);
      sessionStorage.removeItem('desktop_empleado');
      setEmpleado(null);
      
      // Limpiar variables CSS
      const root = document.documentElement;
      const props = [
        '--role-primary', '--role-dark', '--role-hover', '--role-accent',
        '--role-tinted-bg', '--role-shadow', '--role-gradient', '--role-gradient-soft',
        '--role-nav-bg', '--role-active-tab',
        '--primary', '--primary-dark', '--primary-hover', '--primary-light', '--primary-color'
      ];
      props.forEach(p => root.style.removeProperty(p));
      
      return { success: true };
    } catch (error) {
      console.error('Error en signOut:', error);
      return { success: false, error: error.message };
    }
  };

  const hasPermission = (permiso) => {
    if (!empleado) return false;
    const permisosRol = PERMISOS[empleado.rol] || [];
    return permisosRol.includes(permiso);
  };

  // Tema actual basado en el rol del empleado
  const roleTheme = ROLE_THEME[empleado?.rol] || ROLE_THEME.staff;

  const value = {
    empleado,
    isAuthenticated: !!empleado,
    isLoading,
    signIn,
    signOut,
    hasPermission,
    permisos: PERMISOS,
    roleTheme
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
export { ROLE_THEME };