import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  getFirestore,
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
    primary: '#1A7A48', dark: '#0F4D2E', hover: '#166040', accent: '#4ADE80',
    tintedBg: 'rgba(26,122,72,0.08)', shadow: 'rgba(26,122,72,0.20)',
    gradient: 'linear-gradient(135deg, #0F4D2E 0%, #1A7A48 100%)',
    navBg: '#0F4D2E', color: '#1A7A48', colorDark: '#0F4D2E'
  },
  manager: {
    primary: '#2563EB', dark: '#1E3A5F', hover: '#1D4ED8', accent: '#60A5FA',
    tintedBg: 'rgba(37,99,235,0.08)', shadow: 'rgba(37,99,235,0.20)',
    gradient: 'linear-gradient(135deg, #1E3A5F 0%, #2563EB 100%)',
    navBg: '#1E3A5F', color: '#2563EB', colorDark: '#1E3A5F'
  },
  admin: {
    primary: '#64748B', dark: '#1E293B', hover: '#475569', accent: '#F59E0B',
    tintedBg: 'rgba(100,116,139,0.08)', shadow: 'rgba(100,116,139,0.20)',
    gradient: 'linear-gradient(135deg, #1E293B 0%, #475569 100%)',
    navBg: '#1E293B', color: '#64748B', colorDark: '#1E293B'
  }
};

// Permisos actualizados
const PERMISOS = {
  staff: [
    'ventas', 'productos_ver', 'caja_consulta', 'creditos_ver',
    'turnos_ver', 'tareas_ver'
  ],
  manager: [
    'ventas', 'productos_ver', 'productos_editar', 'productos_agregar',
    'caja_consulta', 'caja_operar', 'reportes', 'empleados_ver',
    'empleados_editar', 'empleados_crear',
    'tiendas_ver',
    'turnos_ver', 'turnos_editar', 'turnos_crear',
    'tareas_ver', 'tareas_editar', 'tareas_crear',
    'promociones_ver', 'promociones_editar', 'promociones_crear',
    'creditos_ver', 'creditos_aprobar'
  ],
  admin: [
    'ventas', 'productos_ver', 'productos_editar', 'productos_agregar', 'productos_eliminar',
    'caja_consulta', 'caja_operar', 'reportes', 
    'empleados_ver', 'empleados_editar', 'empleados_crear',
    'tiendas_ver', 'tiendas_editar', 'tiendas_crear',
    'turnos_ver', 'turnos_editar', 'turnos_crear',
    'tareas_ver', 'tareas_editar', 'tareas_crear',
    'promociones_ver', 'promociones_editar', 'promociones_crear',
    'creditos_ver', 'creditos_aprobar', 'creditos_editar', 'creditos_suspender',
    'configuracion'
  ]
};

const ROL_MAP = {
  'STAFF': 'staff', 'LIDER': 'manager', 'MANAGER': 'manager',
  'DIRECTOR': 'admin', 'ADMIN': 'admin'
};

const aplicarTemaRol = (rol) => {
  const t = ROLE_THEME[rol] || ROLE_THEME.staff;
  const root = document.documentElement;
  root.style.setProperty('--role-primary', t.primary);
  root.style.setProperty('--role-dark', t.dark);
  root.style.setProperty('--role-hover', t.hover);
  root.style.setProperty('--role-accent', t.accent);
  root.style.setProperty('--role-tinted-bg', t.tintedBg);
  root.style.setProperty('--role-shadow', t.shadow);
  root.style.setProperty('--role-gradient', t.gradient);
  root.style.setProperty('--role-nav-bg', t.navBg);
  root.style.setProperty('--primary', t.color);
  root.style.setProperty('--primary-dark', t.colorDark);
  root.style.setProperty('--primary-color', t.color);
};

const limpiarTemaRol = () => {
  const root = document.documentElement;
  const props = [
    '--role-primary', '--role-dark', '--role-hover', '--role-accent',
    '--role-tinted-bg', '--role-shadow', '--role-gradient', '--role-nav-bg',
    '--primary', '--primary-dark', '--primary-hover', '--primary-light', '--primary-color'
  ];
  props.forEach(p => root.style.removeProperty(p));
};

export const AuthProvider = ({ children }) => {
  const [empleado, setEmpleado] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const signingInRef = useRef(false);

  // Escuchar Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Firebase tiene sesión, verificar que también existe en sessionStorage
        const stored = sessionStorage.getItem('desktop_empleado');
        if (!stored) {
          if (signingInRef.current) {
            // signIn está en progreso, no forzar logout — signIn se encargará de setear todo
            setIsLoading(false);
            return;
          }
          // Firebase tiene sesión pero no tenemos datos del empleado → forzar logout
          await firebaseSignOut(auth);
          sessionStorage.clear();
          setEmpleado(null);
          limpiarTemaRol();
        } else {
          // Hay datos → restaurar
          try {
            const parsed = JSON.parse(stored);
            setEmpleado(parsed);
            aplicarTemaRol(parsed.rol);
          } catch (e) {
            await firebaseSignOut(auth);
            sessionStorage.clear();
            setEmpleado(null);
            limpiarTemaRol();
          }
        }
      } else {
        // Firebase sin sesión → limpiar todo
        sessionStorage.clear();
        setEmpleado(null);
        limpiarTemaRol();
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (numEmpleado, password) => {
    try {
      setIsLoading(true);
      signingInRef.current = true;
      
      const email = `${numEmpleado}@puntosverde.com`;
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      const empleadosRef = collection(db, 'empleados');
      const q = query(empleadosRef, where('numEmpleado', '==', numEmpleado));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        await firebaseSignOut(auth);
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
        await firebaseSignOut(auth);
        return { success: false, error: 'Tu cuenta está desactivada' };
      }
      
      // Guardar en sessionStorage
      sessionStorage.setItem('desktop_empleado', JSON.stringify(empleadoCompleto));
      
      // Guardar campos legacy para compatibilidad
      sessionStorage.setItem('desktop_employeeName', empleadoCompleto.nombre);
      sessionStorage.setItem('desktop_employeeProfile', empleadoCompleto.rol);
      sessionStorage.setItem('desktop_employeeProfileColor', ROLE_THEME[empleadoCompleto.rol].color);
      sessionStorage.setItem('desktop_employeeProfileColorDark', ROLE_THEME[empleadoCompleto.rol].dark);
      sessionStorage.setItem('desktop_loginTime', Date.now().toString());
      sessionStorage.setItem('desktop_isDesktopApp', 'true');
      
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
      signingInRef.current = false;
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      sessionStorage.clear();
      setEmpleado(null);
      limpiarTemaRol();
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
export { ROLE_THEME, PERMISOS };