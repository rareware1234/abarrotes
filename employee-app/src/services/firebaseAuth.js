import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { firebaseConfig } from '../firebase-config/firebase-config';

const STORAGE_PREFIX = 'mobile_';
const OTHER_APP_PREFIX = 'desktop_';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

const ROLE_COLORS = {
  STAFF: '#00843D',
  SUPERVISOR: '#007bff',
  DIRECTOR: '#fd7e14'
};

export const loginWithEmail = async (numeroEmpleado, password) => {
  try {
    sessionStorage.setItem(`${STORAGE_PREFIX}pendingLogin`, 'true');
    sessionStorage.removeItem(`${OTHER_APP_PREFIX}isDesktopApp`);
    sessionStorage.removeItem(`${OTHER_APP_PREFIX}employeeId`);
    sessionStorage.removeItem(`${OTHER_APP_PREFIX}employeeName`);
    sessionStorage.removeItem(`${OTHER_APP_PREFIX}employeeProfile`);
    sessionStorage.removeItem(`${OTHER_APP_PREFIX}employeeProfileColor`);
    sessionStorage.removeItem(`${OTHER_APP_PREFIX}loginTime`);
    sessionStorage.removeItem(`${OTHER_APP_PREFIX}firebaseUid`);
    sessionStorage.removeItem(`${OTHER_APP_PREFIX}isDesktopApp`);

    const email = `${numeroEmpleado}@abarrotesdigitales.com`;
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;
    
    const perfilDoc = await getDoc(doc(db, 'empleados', firebaseUser.uid));
    
    let nombre = 'Empleado';
    let rol = 'STAFF';
    let activo = true;
    
    if (perfilDoc.exists()) {
      const perfil = perfilDoc.data();
      nombre = perfil.nombre || nombre;
      rol = perfil.rol || rol;
      activo = perfil.activo !== false;
    }
    
    if (!activo) {
      await signOut(auth);
      sessionStorage.removeItem(`${STORAGE_PREFIX}pendingLogin`);
      return { success: false, error: 'Empleado desactivado' };
    }
    
    sessionStorage.setItem(`${STORAGE_PREFIX}employeeId`, numeroEmpleado);
    sessionStorage.setItem(`${STORAGE_PREFIX}employeeName`, nombre);
    sessionStorage.setItem(`${STORAGE_PREFIX}employeeProfile`, rol);
    sessionStorage.setItem(`${STORAGE_PREFIX}employeeProfileColor`, ROLE_COLORS[rol] || ROLE_COLORS.STAFF);
    sessionStorage.setItem(`${STORAGE_PREFIX}loginTime`, Date.now().toString());
    sessionStorage.setItem(`${STORAGE_PREFIX}firebaseUid`, firebaseUser.uid);
    sessionStorage.setItem(`${STORAGE_PREFIX}isMobileApp`, 'true');
    sessionStorage.removeItem(`${STORAGE_PREFIX}pendingLogin`);
    
    return {
      success: true,
      user: {
        id: numeroEmpleado,
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        nombre,
        profile: rol,
        color: ROLE_COLORS[rol] || ROLE_COLORS.STAFF
      }
    };
  } catch (error) {
    console.error('Error de login:', error);
    sessionStorage.removeItem(`${STORAGE_PREFIX}pendingLogin`);
    return { success: false, error: error.message };
  }
};

export const logout = async () => {
  try {
    await signOut(auth);
    sessionStorage.removeItem(`${STORAGE_PREFIX}employeeId`);
    sessionStorage.removeItem(`${STORAGE_PREFIX}employeeName`);
    sessionStorage.removeItem(`${STORAGE_PREFIX}employeeProfile`);
    sessionStorage.removeItem(`${STORAGE_PREFIX}employeeProfileColor`);
    sessionStorage.removeItem(`${STORAGE_PREFIX}loginTime`);
    sessionStorage.removeItem(`${STORAGE_PREFIX}firebaseUid`);
    sessionStorage.removeItem(`${STORAGE_PREFIX}isMobileApp`);
    return { success: true };
  } catch (error) {
    console.error('Error al cerrar sesión:', error);
    return { success: false, error: error.message };
  }
};

export const onAuthChange = (callback) => {
  return onAuthStateChanged(auth, async (firebaseUser) => {
    const pendingLogin = sessionStorage.getItem(`${STORAGE_PREFIX}pendingLogin`);
    const otherAppActive = sessionStorage.getItem(`${OTHER_APP_PREFIX}isDesktopApp`);

    if (pendingLogin === 'true') {
      sessionStorage.removeItem(`${STORAGE_PREFIX}pendingLogin`);
      return;
    }

    if (otherAppActive === 'true') {
      if (!firebaseUser) return;
      if (firebaseUser) {
        try { await signOut(auth); } catch(e) {}
      }
      return;
    }

    if (firebaseUser) {
      try {
        const perfilDoc = await getDoc(doc(db, 'empleados', firebaseUser.uid));
        const numEmpleado = firebaseUser.email.split('@')[0].toUpperCase();
        
        let nombre = 'Empleado';
        let rol = 'STAFF';
        
        if (perfilDoc.exists()) {
          const perfil = perfilDoc.data();
          nombre = perfil.nombre || nombre;
          rol = perfil.rol || rol;
        }
        
        callback({
          isAuthenticated: true,
          user: {
            id: numEmpleado,
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            nombre,
            profile: rol,
            color: ROLE_COLORS[rol] || ROLE_COLORS.STAFF
          }
        });
      } catch (error) {
        console.error('Error cargando perfil en onAuthChange:', error);
        callback({ isAuthenticated: false, user: null });
      }
    } else {
      callback({ isAuthenticated: false, user: null });
    }
  });
};

export const checkMobileSession = () => {
  const isMobileApp = sessionStorage.getItem(`${STORAGE_PREFIX}isMobileApp`);
  if (isMobileApp === 'true') {
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

export const getCurrentUser = () => {
  return auth.currentUser;
};

export { STORAGE_PREFIX };
