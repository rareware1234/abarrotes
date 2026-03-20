// Servicio de Firestore para Abarrotes Digitales
import { initializeApp } from 'firebase/app';
import { 
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore';
import { firebaseConfig } from '../firebase-config/firebase-config';

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ==================== EMPLEADOS ====================

// Obtener perfil del empleado
export const getEmployeeProfile = async (employeeId) => {
  try {
    const docRef = doc(db, 'empleados', employeeId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { success: true, data: docSnap.data() };
    } else {
      // Devolver datos por defecto
      return {
        success: true,
        data: {
          id: employeeId,
          nombre: 'Empleado',
          profile: 'staff',
          activo: true
        }
      };
    }
  } catch (error) {
    console.error('Error getting employee profile:', error);
    return { success: false, error: error.message };
  }
};

// ==================== VENTAS ====================

// Registrar venta
export const registerSale = async (saleData) => {
  try {
    const ventaId = `VENTA-${Date.now()}`;
    const ventaRef = doc(db, 'ventas', ventaId);
    
    await setDoc(ventaRef, {
      ...saleData,
      createdAt: serverTimestamp()
    });
    
    return { success: true, id: ventaId };
  } catch (error) {
    console.error('Error registering sale:', error);
    return { success: false, error: error.message };
  }
};

// Obtener ventas del día
export const getTodaySales = async (employeeId) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const ventasRef = collection(db, 'ventas');
    const q = query(
      ventasRef,
      where('employeeId', '==', employeeId),
      where('createdAt', '>=', today),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const ventas = [];
    
    querySnapshot.forEach((doc) => {
      ventas.push({ id: doc.id, ...doc.data() });
    });
    
    return { success: true, data: ventas };
  } catch (error) {
    console.error('Error getting today sales:', error);
    return { success: false, error: error.message };
  }
};

// ==================== CAJA ====================

// Abrir caja
export const openCashRegister = async (employeeId, amount) => {
  try {
    const cajaId = `CAJA-${Date.now()}`;
    const cajaRef = doc(db, 'cajas', cajaId);
    
    await setDoc(cajaRef, {
      employeeId,
      montoApertura: amount,
      montoActual: amount,
      estado: 'abierta',
      createdAt: serverTimestamp()
    });
    
    return { success: true, id: cajaId };
  } catch (error) {
    console.error('Error opening cash register:', error);
    return { success: false, error: error.message };
  }
};

// Obtener caja abierta
export const getOpenCashRegister = async (employeeId) => {
  try {
    const cajasRef = collection(db, 'cajas');
    const q = query(
      cajasRef,
      where('employeeId', '==', employeeId),
      where('estado', '==', 'abierta')
    );
    
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return { success: true, data: { id: doc.id, ...doc.data() } };
    }
    
    return { success: true, data: null };
  } catch (error) {
    console.error('Error getting open cash register:', error);
    return { success: false, error: error.message };
  }
};

// Cerrar caja
export const closeCashRegister = async (cajaId, closingAmount) => {
  try {
    const cajaRef = doc(db, 'cajas', cajaId);
    
    await updateDoc(cajaRef, {
      montoCierre: closingAmount,
      estado: 'cerrada',
      closedAt: serverTimestamp()
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error closing cash register:', error);
    return { success: false, error: error.message };
  }
};

// ==================== TAREAS ====================

// Crear tarea
export const createTask = async (taskData) => {
  try {
    const tareaId = `TAREA-${Date.now()}`;
    const tareaRef = doc(db, 'tareas', tareaId);
    
    await setDoc(tareaRef, {
      ...taskData,
      estado: 'pendiente',
      createdAt: serverTimestamp()
    });
    
    return { success: true, id: tareaId };
  } catch (error) {
    console.error('Error creating task:', error);
    return { success: false, error: error.message };
  }
};

// Obtener tareas
export const getTasks = async (employeeId) => {
  try {
    const tareasRef = collection(db, 'tareas');
    
    // Obtener tareas asignadas al empleado o creadas por él
    const q = query(
      tareasRef,
      where('assignedTo', '==', employeeId)
    );
    
    const querySnapshot = await getDocs(q);
    const tareas = [];
    
    querySnapshot.forEach((doc) => {
      tareas.push({ id: doc.id, ...doc.data() });
    });
    
    return { success: true, data: tareas };
  } catch (error) {
    console.error('Error getting tasks:', error);
    return { success: false, error: error.message };
  }
};

// Actualizar tarea
export const updateTask = async (taskId, updates) => {
  try {
    const tareaRef = doc(db, 'tareas', taskId);
    await updateDoc(tareaRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error updating task:', error);
    return { success: false, error: error.message };
  }
};

// ==================== PRODUCTOS ====================

// Obtener productos
export const getProducts = async () => {
  try {
    const productosRef = collection(db, 'productos');
    const querySnapshot = await getDocs(productosRef);
    
    const productos = [];
    querySnapshot.forEach((doc) => {
      productos.push({ id: doc.id, ...doc.data() });
    });
    
    return { success: true, data: productos };
  } catch (error) {
    console.error('Error getting products:', error);
    return { success: false, error: error.message };
  }
};

export { db };
