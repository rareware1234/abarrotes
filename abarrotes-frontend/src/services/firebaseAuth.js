// Servicio de autenticación con Firebase para Abarrotes Digitales - Escritorio
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { firebaseConfig } from '../firebase-config/firebase-config';

// Prefijo para evitar conflictos con la app móvil
const STORAGE_PREFIX = 'desktop_';

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Datos de los empleados (mapeo de UID a perfil) — sincronizado con macOS
const employeeProfiles = {
  'EMP001': { profile: 'staff',   color: '#1A7A48', colorDark: '#0F4D2E', name: 'Juan García' },
  'EMP002': { profile: 'staff',   color: '#1A7A48', colorDark: '#0F4D2E', name: 'María López' },
  'EMP003': { profile: 'manager', color: '#2563EB', colorDark: '#1E3A5F', name: 'Carlos Rodríguez' },
  'EMP004': { profile: 'manager', color: '#2563EB', colorDark: '#1E3A5F', name: 'Ana Martínez' },
  'EMP005': { profile: 'admin',   color: '#64748B', colorDark: '#1E293B', name: 'Pedro Sánchez' },
  'EMP006': { profile: 'admin',   color: '#64748B', colorDark: '#1E293B', name: 'Laura Fernández' },
  'ADMIN001': { profile: 'admin', color: '#64748B', colorDark: '#1E293B', name: 'Juan Perez' }
};

// Iniciar sesión
export const loginWithEmail = async (numeroEmpleado, password) => {
  try {
    const email = `${numeroEmpleado}@abarrotesdigitales.com`;
    
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    const employeeProfile = employeeProfiles[numeroEmpleado] || employeeProfiles.EMP001;
    
    // Guardar en sessionStorage con prefijo escritorio
    sessionStorage.setItem(`${STORAGE_PREFIX}employeeId`, numeroEmpleado);
    sessionStorage.setItem(`${STORAGE_PREFIX}employeeName`, employeeProfile.name);
    sessionStorage.setItem(`${STORAGE_PREFIX}employeeProfile`, employeeProfile.profile);
    sessionStorage.setItem(`${STORAGE_PREFIX}employeeProfileColor`, employeeProfile.color);
    sessionStorage.setItem(`${STORAGE_PREFIX}employeeProfileColorDark`, employeeProfile.colorDark);
    sessionStorage.setItem(`${STORAGE_PREFIX}loginTime`, Date.now().toString());
    sessionStorage.setItem(`${STORAGE_PREFIX}isDesktopApp`, 'true');
    
    return {
      success: true,
      user: {
        id: numeroEmpleado,
        uid: user.uid,
        email: user.email,
        nombre: employeeProfile.name,
        profile: employeeProfile.profile,
        color: employeeProfile.color,
        colorDark: employeeProfile.colorDark
      }
    };
  } catch (error) {
    console.error('Error de login:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Cerrar sesión
export const logout = async () => {
  try {
    await signOut(auth);
    // Limpiar sessionStorage con prefijo escritorio
    sessionStorage.removeItem(`${STORAGE_PREFIX}employeeId`);
    sessionStorage.removeItem(`${STORAGE_PREFIX}employeeName`);
    sessionStorage.removeItem(`${STORAGE_PREFIX}employeeProfile`);
    sessionStorage.removeItem(`${STORAGE_PREFIX}employeeProfileColor`);
    sessionStorage.removeItem(`${STORAGE_PREFIX}employeeProfileColorDark`);
    sessionStorage.removeItem(`${STORAGE_PREFIX}loginTime`);
    sessionStorage.removeItem(`${STORAGE_PREFIX}isDesktopApp`);
    return { success: true };
  } catch (error) {
    console.error('Error al cerrar sesión:', error);
    return { success: false, error: error.message };
  }
};

// Verificar estado de autenticación
export const onAuthChange = (callback) => {
  return onAuthStateChanged(auth, (user) => {
    if (user) {
      const numeroEmpleado = user.email.split('@')[0].toUpperCase();
    const employeeProfile = employeeProfiles[numeroEmpleado] || employeeProfiles.EMP001;
      
      callback({
        isAuthenticated: true,
        user: {
          id: numeroEmpleado,
          uid: user.uid,
          email: user.email,
          nombre: employeeProfile.name,
          profile: employeeProfile.profile,
          color: employeeProfile.color,
          colorDark: employeeProfile.colorDark
        }
      });
    } else {
      callback({ isAuthenticated: false, user: null });
    }
  });
};

// Verificar si hay sesión activa en la app de escritorio
export const checkDesktopSession = () => {
  const isDesktopApp = sessionStorage.getItem(`${STORAGE_PREFIX}isDesktopApp`);
  if (isDesktopApp === 'true') {
    return {
      employeeId: sessionStorage.getItem(`${STORAGE_PREFIX}employeeId`),
      employeeName: sessionStorage.getItem(`${STORAGE_PREFIX}employeeName`),
      employeeProfile: sessionStorage.getItem(`${STORAGE_PREFIX}employeeProfile`),
      employeeProfileColor: sessionStorage.getItem(`${STORAGE_PREFIX}employeeProfileColor`),
      loginTime: sessionStorage.getItem(`${STORAGE_PREFIX}loginTime`)
    };
  }
  return null;
};

export { auth, STORAGE_PREFIX };
