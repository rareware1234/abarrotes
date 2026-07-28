import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged
} from 'firebase/auth';
import {
  collection,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  query,
  where
} from 'firebase/firestore';
import { db, auth } from '../firebase.js';

// Abre la conexión WebSocket de Firestore en background para que las
// primeras queries de otras páginas no tengan el cold-start delay.
const warmFirestore = () => getDoc(doc(db, '_warmup', 'ping')).catch(() => {});

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

// Temas completos por rol
const ROLE_THEME = {
  staff: {
    primary: '#1A7A48', dark: '#0F4D2E', hover: '#166040', accent: '#4ADE80',
    tintedBg: 'rgba(26,122,72,0.12)', shadow: 'rgba(26,122,72,0.25)',
    gradient: 'linear-gradient(135deg, #0F4D2E 0%, #1A7A48 100%)',
    navBg: '#0F4D2E', color: '#1A7A48', colorDark: '#0F4D2E'
  },
  manager: {
    primary: '#2E6BC4', dark: '#1E4F8F', hover: '#245DAA', accent: '#5A9AE0',
    tintedBg: 'rgba(46,107,196,0.14)', shadow: 'rgba(46,107,196,0.28)',
    gradient: 'linear-gradient(135deg, #1E4F8F 0%, #2E6BC4 100%)',
    navBg: '#1E4F8F', color: '#2E6BC4', colorDark: '#1E4F8F'
  },
  admin: {
    primary: '#64748B', dark: '#475569', hover: '#334155', accent: '#F59E0B',
    tintedBg: 'rgba(100,116,139,0.12)', shadow: 'rgba(100,116,139,0.25)',
    gradient: 'linear-gradient(135deg, #475569 0%, #64748B 100%)',
    navBg: '#475569', color: '#64748B', colorDark: '#475569'
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
    'tiendas_ver', 'tiendas_editar', 'tiendas_crear',
    'turnos_ver', 'turnos_editar', 'turnos_crear',
    'tareas_ver', 'tareas_editar', 'tareas_crear',
    'promociones_ver', 'promociones_editar', 'promociones_crear',
    'creditos_ver', 'creditos_aprobar',
    'configuracion'
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

const setThemeColor = (color) => {
  let meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.remove();
  meta = document.createElement('meta');
  meta.name = 'theme-color';
  meta.content = color;
  document.head.appendChild(meta);
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
  root.style.setProperty('--role-active-tab', t.accent);
  root.style.setProperty('--primary', t.color);
  root.style.setProperty('--primary-dark', t.colorDark);
  root.style.setProperty('--primary-color', t.color);
  setThemeColor(t.dark);
};

const limpiarTemaRol = () => {
  const root = document.documentElement;
  const props = [
    '--role-primary', '--role-dark', '--role-hover', '--role-accent',
    '--role-tinted-bg', '--role-shadow', '--role-gradient', '--role-nav-bg',
    '--role-active-tab',
    '--primary', '--primary-dark', '--primary-hover', '--primary-light', '--primary-color'
  ];
  props.forEach(p => root.style.removeProperty(p));
  setThemeColor('#0F4D2E');
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
            warmFirestore(); // conexión Firestore en background
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

      // 1. Buscar empleado en Firestore PRIMERO para obtener el email real
      const empleadosRef = collection(db, 'empleados');
      const q = query(empleadosRef, where('numEmpleado', '==', numEmpleado));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        return { success: false, error: 'Empleado no encontrado en el sistema' };
      }

      const empleadoDoc = snapshot.docs[0];
      const empleadoData = empleadoDoc.data();

      // 2. Usar el email REAL del empleado para autenticar en Firebase
      const email = empleadoData.email;
      if (!email) {
        return { success: false, error: 'El empleado no tiene email configurado' };
      }

      // Auto-registro (biblia §2.2): si el empleado se creó pero nunca activó su
      // cuenta en Firebase Auth (pendienteAuth) y la contraseña coincide con la
      // temporal, se crea la cuenta al vuelo y se le exige cambiar la contraseña.
      let userCredential;
      try {
        userCredential = await signInWithEmailAndPassword(auth, email, password);
      } catch (err) {
        const puedeAutoRegistrar =
          empleadoData.pendienteAuth === true &&
          empleadoData.passwordTemp &&
          String(empleadoData.passwordTemp) === String(password) &&
          ['auth/invalid-credential', 'auth/user-not-found', 'auth/wrong-password'].includes(err.code);
        if (!puedeAutoRegistrar) throw err;
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
        // Migrar el doc: quitar pendiente/temporal y exigir cambio de contraseña.
        try {
          await updateDoc(doc(db, 'empleados', empleadoDoc.id), {
            pendienteAuth: false,
            passwordTemp: '',
            requiereCambioPassword: true,
            uid: userCredential.user.uid,
          });
        } catch { /* no bloquear el login si falla la migración del doc */ }
        empleadoData.requiereCambioPassword = true;
      }
      const user = userCredential.user;

      // 3. Construir objeto empleado completo
      const rol = ROL_MAP[empleadoData.rol?.toUpperCase()] || 'staff';

      const empleadoCompleto = {
        uid: user.uid,
        nombre: empleadoData.nombre,
        numEmpleado: numEmpleado,
        rol: rol,
        email: user.email,
        tiendaId: empleadoData.tiendaId || null,
        tiendasAsignadas: empleadoData.tiendasAsignadas || [],
        empresaId: empleadoData.empresaId || 'default-pv',
        empresasAsignadas: empleadoData.empresasAsignadas || [],
        requiereCambioPassword: empleadoData.requiereCambioPassword || false,
        activo: empleadoData.activo !== false,
        fotoUrl: empleadoData.fotoUrl || null
      };

      if (!empleadoCompleto.activo) {
        await firebaseSignOut(auth);
        return { success: false, error: 'Tu cuenta está desactivada' };
      }

      // 4. Guardar en sessionStorage
      sessionStorage.setItem('desktop_empleado', JSON.stringify(empleadoCompleto));
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
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
        mensaje = 'Número de empleado o contraseña incorrectos';
      } else if (error.code === 'auth/user-disabled') {
        mensaje = 'Tu cuenta está desactivada';
      } else if (error.code === 'permission-denied' || error.message?.includes('permission')) {
        mensaje = 'Error de configuración del servidor. Contacta al administrador.';
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

  const updateEmpleadoFoto = (fotoUrl) => {
    if (!empleado) return;
    const updated = { ...empleado, fotoUrl };
    setEmpleado(updated);
    sessionStorage.setItem('desktop_empleado', JSON.stringify(updated));
  };

  const clearRequiereCambioPassword = () => {
    if (!empleado) return;
    const updated = { ...empleado, requiereCambioPassword: false };
    setEmpleado(updated);
    sessionStorage.setItem('desktop_empleado', JSON.stringify(updated));
  };

  const roleTheme = ROLE_THEME[empleado?.rol] || ROLE_THEME.staff;

  const value = {
    empleado,
    isAuthenticated: !!empleado,
    isLoading,
    signIn,
    signOut,
    hasPermission,
    updateEmpleadoFoto,
    clearRequiereCambioPassword,
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
export { ROLE_THEME, PERMISOS, aplicarTemaRol };