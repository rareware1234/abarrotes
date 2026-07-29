import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import {
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  sendPasswordResetEmail
} from 'firebase/auth';
import {
  collection,
  getDocs,
  getDoc,
  doc,
  query,
  where,
  limit
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, auth, functions } from '../firebase.js';

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
          } catch {
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
      // NO togglear el `isLoading` GLOBAL aquí. Es exclusivo del bootstrap
      // inicial de auth (onAuthStateChanged). Durante un login interactivo,
      // `PublicRoute` reaccionaría a isLoading=true mostrando el splash
      // AuthLoading, lo que DESMONTA <Login/> y borra su estado local `error`
      // → el mensaje de error nunca se ve (fallo silencioso). El spinner del
      // botón usa el `loading` LOCAL de Login. `signingInRef` ya coordina el
      // listener onAuthStateChanged.
      signingInRef.current = true;

      // 1. Resolver el email vía Cloud Function `lookupEmpleadoEmail` (segura:
      //    devuelve SOLO el email, sin PII). NO se lee `empleados` directo: las
      //    reglas de Firestore lo bloquean SIN sesión A PROPÓSITO (antes exponía
      //    CURP/RFC/NSS/CLABE con `allow read: if true`). La app Swift usa esta
      //    misma función; el web había quedado leyendo `empleados` directo →
      //    permission-denied → login roto. El doc COMPLETO se lee tras autenticar.
      let email;
      try {
        const lookup = httpsCallable(functions, 'lookupEmpleadoEmail');
        const res = await lookup({ numEmpleado });
        email = res?.data?.email;
      } catch (err) {
        if (err?.code === 'functions/not-found') {
          return { success: false, error: 'Empleado no encontrado en el sistema' };
        }
        throw err; // otros errores → catch general (feedback claro al usuario)
      }
      if (!email) {
        return { success: false, error: 'El empleado no tiene email configurado' };
      }

      // 2. Autenticar en Firebase Auth con el email real.
      //    NOTA: el auto-registro en cliente (pendienteAuth/passwordTemp, biblia
      //    §2.2) se removió: requería leer el doc del empleado SIN sesión, algo
      //    que las reglas ahora bloquean con razón. La activación de cuentas
      //    nuevas se hace por la app nativa/admin o debe migrarse a una Cloud
      //    Function server-side (pendiente).
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 3. Ya autenticados → leer el doc del empleado (permitido por reglas: es
      //    mi propio doc). De aquí salen rol, tienda, empresa, etc.
      const empSnap = await getDocs(
        query(collection(db, 'empleados'), where('numEmpleado', '==', numEmpleado), limit(1))
      );
      if (empSnap.empty) {
        await firebaseSignOut(auth);
        return { success: false, error: 'No se encontró el perfil del empleado' };
      }
      const empleadoData = empSnap.docs[0].data();

      // 4. Construir objeto empleado completo
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
      // Solo el código, nunca el objeto completo (puede traer email/PII).
      console.error('signIn error:', error?.code || 'unknown');
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
    }
  };

  // Recuperación de contraseña. Reusa el MISMO lookup seguro que el login
  // (Cloud Function que devuelve solo el email, sin abrir `empleados`) y
  // dispara el correo nativo de Firebase Auth. No duplica lógica de resolución.
  const resetPassword = async (numEmpleado) => {
    const num = (numEmpleado || '').trim();
    if (!num) {
      return { success: false, error: 'Ingresa tu número de empleado primero' };
    }
    try {
      const lookup = httpsCallable(functions, 'lookupEmpleadoEmail');
      const res = await lookup({ numEmpleado: num });
      const email = res?.data?.email;
      if (!email) {
        return { success: false, error: 'No se encontró una cuenta para ese número de empleado' };
      }
      await sendPasswordResetEmail(auth, email);
      return { success: true };
    } catch (error) {
      console.error('resetPassword error:', error?.code || 'unknown');
      if (error?.code === 'functions/not-found') {
        return { success: false, error: 'Empleado no encontrado' };
      }
      return { success: false, error: 'No se pudo enviar el correo de recuperación. Intenta más tarde.' };
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
    resetPassword,
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