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
  serverTimestamp
} from 'firebase/firestore';
import { firebaseConfig } from '../firebase-config/firebase-config';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export const evaluarCliente = async (clienteId) => {
  try {
    const scoreResult = await calcularScore(clienteId);
    if (!scoreResult.success) {
      return scoreResult;
    }
    
    const { score, nivel, factores } = scoreResult;
    const oferta = generarOferta(score, nivel);
    
    return {
      success: true,
      data: {
        score,
        nivel,
        factores,
        oferta
      }
    };
  } catch (error) {
    console.error('Error evaluating client:', error);
    return { success: false, error: error.message };
  }
};

const generarOferta = (score, nivel) => {
  const tasas = {
    'Excelente': 3,
    'Bueno': 5,
    'Regular': 8,
    'No aplica': null
  };
  
  const maximos = {
    'Excelente': 50000,
    'Bueno': 30000,
    'Regular': 15000,
    'No aplica': 0
  };
  
  const plazos = [
    { semanas: 4, factor: 1 },
    { semanas: 8, factor: 1.02 },
    { semanas: 12, factor: 1.04 }
  ];
  
  return {
    tasa: tasas[nivel],
    montoMaximo: maximos[nivel],
    plazos,
    nivel
  };
};

const calcularScore = async (clienteId) => {
  try {
    const ordenesRef = collection(db, 'ordenes');
    const fecha90Dias = new Date();
    fecha90Dias.setDate(fecha90Dias.getDate() - 90);
    
    const q = query(
      ordenesRef,
      where('clienteId', '==', clienteId),
      where('createdAt', '>=', fecha90Dias)
    );
    
    const snapshot = await getDocs(q);
    const ordenes = [];
    snapshot.forEach(doc => {
      ordenes.push({ id: doc.id, ...doc.data() });
    });
    
    if (ordenes.length === 0) {
      return {
        success: true,
        data: { score: 0, nivel: 'No aplica', factores: { frecuencia: 0, consistencia: 0, monto: 0, historial: 0 } }
      };
    }
    
    const diasUnicos = new Set();
    const diasOrdenados = [];
    let gastoTotal = 0;
    
    ordenes.forEach(orden => {
      if (orden.createdAt && orden.createdAt.toDate) {
        const fecha = orden.createdAt.toDate();
        const dia = fecha.toISOString().split('T')[0];
        diasUnicos.add(dia);
        diasOrdenados.push({ dia, total: orden.total || 0 });
        gastoTotal += orden.total || 0;
      }
    });
    
    const frecuencia = Math.min(30, diasUnicos.size * 3);
    
    let consistencia = 0;
    if (diasOrdenados.length > 1) {
      const promedios = [];
      for (let i = 0; i < diasOrdenados.length; i++) {
        promedios.push(diasOrdenados[i].total);
      }
      const media = gastoTotal / promedios.length;
      const varianza = promedios.reduce((sum, val) => sum + Math.pow(val - media, 2), 0) / promedios.length;
      const desviacion = Math.sqrt(varianza);
      consistencia = Math.max(0, 25 - (desviacion / media) * 25);
    } else {
      consistencia = 12.5;
    }
    
    const montoPromedio = gastoTotal / ordenes.length;
    let monto = 0;
    if (montoPromedio >= 500) monto = 25;
    else if (montoPromedio >= 300) monto = 20;
    else if (montoPromedio >= 150) monto = 15;
    else monto = 10;
    
    const historial = ordenes.length >= 10 ? 20 : ordenes.length * 2;
    
    const score = Math.round(frecuencia + consistencia + monto + historial);
    const nivel = score >= 80 ? 'Excelente' : score >= 60 ? 'Bueno' : score >= 40 ? 'Regular' : 'No aplica';
    
    return {
      success: true,
      data: {
        score,
        nivel,
        factores: {
          frecuencia: Math.round(frecuencia),
          consistencia: Math.round(consistencia),
          monto: Math.round(monto),
          historial: Math.round(historial)
        },
        stats: {
          totalOrdenes: ordenes.length,
          diasVisitados: diasUnicos.size,
          gastoPromedio: montoPromedio,
          gastoTotal
        }
      }
    };
  } catch (error) {
    console.error('Error calculating score:', error);
    return { success: false, error: error.message };
  }
};

export const aprobarCredito = async (clienteId, monto, plazo, tasa) => {
  try {
    const creditoRef = doc(collection(db, 'creditos'));
    const fechaVencimiento = new Date();
    fechaVencimiento.setDate(fechaVencimiento.getDate() + plazo * 7);
    
    await setDoc(creditoRef, {
      clienteId,
      montoAprobado: monto,
      montoUsado: 0,
      montoDisponible: monto,
      plazoSemanas: plazo,
      tasaMensual: tasa,
      estado: 'activo',
      fechaAprobacion: serverTimestamp(),
      fechaVencimiento,
      transacciones: [],
      createdAt: serverTimestamp()
    });
    
    return { success: true, id: creditoRef.id };
  } catch (error) {
    console.error('Error approving credit:', error);
    return { success: false, error: error.message };
  }
};

export const usarCredito = async (creditoId, monto, ordenId) => {
  try {
    const creditoRef = doc(db, 'creditos', creditoId);
    const docSnap = await getDoc(creditoRef);
    
    if (!docSnap.exists()) {
      return { success: false, error: 'Crédito no encontrado' };
    }
    
    const data = docSnap.data();
    if (data.montoDisponible < monto) {
      return { success: false, error: 'Saldo insuficiente' };
    }
    
    const transacciones = data.transacciones || [];
    transacciones.push({
      tipo: 'compra',
      monto,
      ordenId,
      fecha: new Date()
    });
    
    await updateDoc(creditoRef, {
      montoUsado: data.montoUsado + monto,
      montoDisponible: data.montoDisponible - monto,
      transacciones
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error using credit:', error);
    return { success: false, error: error.message };
  }
};

export const registrarPago = async (creditoId, monto) => {
  try {
    const creditoRef = doc(db, 'creditos', creditoId);
    const docSnap = await getDoc(creditoRef);
    
    if (!docSnap.exists()) {
      return { success: false, error: 'Crédito no encontrado' };
    }
    
    const data = docSnap.data();
    const transacciones = data.transacciones || [];
    
    const interes = monto * (data.tasaMensual / 100);
    const capital = monto - interes;
    
    transacciones.push({
      tipo: 'pago',
      monto,
      capital,
      interes,
      fecha: new Date()
    });
    
    const nuevoDisponible = Math.min(
      data.montoDisponible + capital,
      data.montoAprobado
    );
    
    let nuevoEstado = data.estado;
    if (nuevoDisponible >= data.montoAprobado) {
      nuevoEstado = 'pagado';
    }
    
    await updateDoc(creditoRef, {
      montoDisponible: nuevoDisponible,
      transacciones,
      estado: nuevoEstado
    });
    
    return { success: true, interes };
  } catch (error) {
    console.error('Error registering payment:', error);
    return { success: false, error: error.message };
  }
};

export const suspenderCredito = async (creditoId, motivo) => {
  try {
    const creditoRef = doc(db, 'creditos', creditoId);
    await updateDoc(creditoRef, {
      estado: 'suspendido',
      motivoSuspension: motivo,
      suspendedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error('Error suspending credit:', error);
    return { success: false, error: error.message };
  }
};

export const creditoActivo = async (clienteId) => {
  try {
    const creditosRef = collection(db, 'creditos');
    const q = query(
      creditosRef,
      where('clienteId', '==', clienteId),
      where('estado', '==', 'activo')
    );
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return { success: true, data: null };
    }
    
    const doc = snapshot.docs[0];
    return { success: true, data: { id: doc.id, ...doc.data() } };
  } catch (error) {
    console.error('Error checking active credit:', error);
    return { success: false, error: error.message };
  }
};

export const listarCreditos = async (tiendaId) => {
  try {
    const creditosRef = collection(db, 'creditos');
    let q;
    
    if (tiendaId) {
      q = query(creditosRef, where('tiendaId', '==', tiendaId));
    } else {
      q = query(creditosRef, orderBy('createdAt', 'desc'));
    }
    
    const snapshot = await getDocs(q);
    const creditos = [];
    snapshot.forEach(doc => {
      creditos.push({ id: doc.id, ...doc.data() });
    });
    return { success: true, data: creditos };
  } catch (error) {
    console.error('Error listing credits:', error);
    return { success: false, error: error.message };
  }
};

export const getCredito = async (creditoId) => {
  try {
    const creditoRef = doc(db, 'creditos', creditoId);
    const docSnap = await getDoc(creditoRef);
    
    if (!docSnap.exists()) {
      return { success: true, data: null };
    }
    
    return { success: true, data: { id: docSnap.id, ...docSnap.data() } };
  } catch (error) {
    console.error('Error fetching credit:', error);
    return { success: false, error: error.message };
  }
};

export default {
  evaluarCliente,
  aprobarCredito,
  usarCredito,
  registrarPago,
  suspenderCredito,
  creditoActivo,
  listarCreditos,
  getCredito
};