import { db } from '../firebase.js';
import {

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
import { getActivaId } from '../lib/empresaActiva';


export const evaluarCliente = async (clienteId) => {
  try {
    const scoreResult = await calcularScore(clienteId);
    if (!scoreResult.success) {
      return scoreResult;
    }
    
    const { score, nivel, factores } = scoreResult.data;
    const oferta = generarOferta(score, nivel, scoreResult.data.stats?.avgOrder || 0);
    
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

const generarOferta = (score, nivel, avgOrder = 0) => {
  const tasas = {
    'Excelente': 3,
    'Bueno': 5,
    'Regular': 8,
    'No aplica': null
  };

  // Match Swift: montoMaximo = multiplier * avgOrder (not hardcoded)
  const multipliers = { 'Excelente': 2.0, 'Bueno': 1.5, 'Regular': 1.0 };
  const mult = multipliers[nivel] || 0;
  const montoMaximo = nivel === 'No aplica' ? 0 : Math.round(mult * avgOrder / 100) * 100;

  const plazos = [
    { semanas: 2, factor: 1 },
    { semanas: 4, factor: 1.02 },
    { semanas: 8, factor: 1.04 }
  ];

  return {
    tasa: tasas[nivel],
    montoMaximo,
    plazos,
    nivel
  };
};

const calcularScore = async (clienteId) => {
  try {
    const fecha90Dias = new Date();
    fecha90Dias.setDate(fecha90Dias.getDate() - 90);

    const [ordenesSnap, creditosSnap] = await Promise.all([
      getDocs(query(
        collection(db, 'ordenes'),
        where('clienteId', '==', clienteId),
        where('createdAt', '>=', fecha90Dias)
      )),
      getDocs(query(
        collection(db, 'creditos'),
        where('clienteId', '==', clienteId),
        orderBy('createdAt', 'desc')
      )),
    ]);

    const ordenes = [];
    ordenesSnap.forEach(d => ordenes.push({ id: d.id, ...d.data() }));
    const creditos = [];
    creditosSnap.forEach(d => creditos.push({ id: d.id, ...d.data() }));

    const diasUnicos = new Set();
    let gastoTotal = 0;

    ordenes.forEach(orden => {
      if (orden.createdAt?.toDate) {
        const dia = orden.createdAt.toDate().toISOString().split('T')[0];
        diasUnicos.add(dia);
        gastoTotal += orden.total || 0;
      }
    });

    const visitas = diasUnicos.size;
    const avgOrder = ordenes.length > 0 ? gastoTotal / ordenes.length : 0;

    // Frecuencia: threshold system (matches Swift CreditScoreEngine)
    let frecuencia = 0;
    if (visitas >= 8) frecuencia = 30;
    else if (visitas >= 4) frecuencia = 20;
    else if (visitas >= 2) frecuencia = 10;

    // Consistencia: coefficient of variation (web-only, 25 pts max)
    let consistencia = 0;
    const montos = ordenes.filter(o => o.createdAt?.toDate).map(o => o.total || 0);
    if (montos.length > 1) {
      const media = gastoTotal / montos.length;
      const varianza = montos.reduce((s, v) => s + Math.pow(v - media, 2), 0) / montos.length;
      const desviacion = Math.sqrt(varianza);
      consistencia = media > 0 ? Math.max(0, 25 - (desviacion / media) * 25) : 12.5;
    } else if (montos.length === 1) {
      consistencia = 12.5;
    }

    // Monto: thresholds matching Swift ($2000/$1000/$500)
    let monto = 0;
    if (avgOrder >= 2000) monto = 25;
    else if (avgOrder >= 1000) monto = 18;
    else if (avgOrder >= 500) monto = 10;
    else if (ordenes.length > 0) monto = 5;

    // Historial: based on credit state (matches Swift CreditScoreEngine)
    let historial = 10; // sin_credito default (new customer, neutral)
    if (creditos.length > 0) {
      const ultimo = creditos[0];
      if (ultimo.estado === 'pagado') historial = 20;       // pagado_tiempo
      else if (ultimo.estado === 'activo') historial = 15;  // en curso, buen estado
      else if (ultimo.estado === 'suspendido') historial = 5;
      else if (ultimo.estado === 'vencido') historial = 0;
    }

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
          visitas,
          avgOrder,
          gastoTotal
        }
      }
    };
  } catch (error) {
    console.error('Error calculating score:', error);
    return { success: false, error: error.message };
  }
};

export const aprobarCredito = async (clienteId, monto, plazo, tasa, aprobadoPorUid = null) => {
  try {
    const creditoRef = doc(collection(db, 'creditos'));
    const fechaVencimiento = new Date();
    fechaVencimiento.setDate(fechaVencimiento.getDate() + plazo * 7);

    await setDoc(creditoRef, {
      empresaId: getActivaId(), // scoping multi-tenant
      clienteId,
      montoAprobado: monto,
      montoUsado: 0,
      montoDisponible: monto,
      plazoSemanas: plazo,
      tasaMensual: tasa,
      estado: 'activo',
      fechaAprobacion: serverTimestamp(),
      fechaVencimiento,
      aprobadoPorUid, // auditoría: quién aprobó (biblia §3.9)
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
    
    const nuevoUsado = Math.max(0, (data.montoUsado || 0) - capital);
    const nuevoDisponible = Math.min(
      (data.montoDisponible || 0) + capital,
      data.montoAprobado
    );

    let nuevoEstado = data.estado;
    if (nuevoUsado <= 0) {
      nuevoEstado = 'pagado';
    }

    await updateDoc(creditoRef, {
      montoUsado: nuevoUsado,
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