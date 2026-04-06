import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  getDocs,
  query,
  where,
  orderBy
} from 'firebase/firestore';
import { firebaseConfig } from '../firebase-config/firebase-config';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export const calcularScore = async (clienteId) => {
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
        score: 0,
        nivel: 'No aplica',
        factores: {
          frecuencia: 0,
          consistencia: 0,
          monto: 0,
          historial: 0
        },
        stats: {
          totalOrdenes: 0,
          diasVisitados: 0,
          gastoPromedio: 0,
          gastoTotal: 0
        }
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
    
    let frecuencia = Math.min(30, diasUnicos.size * 3);
    
    let consistencia = 0;
    if (diasOrdenados.length > 1) {
      const promedios = diasOrdenados.map(d => d.total);
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
        gastoPromedio: Math.round(montoPromedio),
        gastoTotal
      }
    };
  } catch (error) {
    console.error('Error calculating score:', error);
    return {
      score: 0,
      nivel: 'Error',
      factores: { frecuencia: 0, consistencia: 0, monto: 0, historial: 0 },
      stats: { totalOrdenes: 0, diasVisitados: 0, gastoPromedio: 0, gastoTotal: 0 }
    };
  }
};

export const getNivelColor = (nivel) => {
  const colores = {
    'Excelente': '#1A7A48',
    'Bueno': '#2563EB',
    'Regular': '#F59E0B',
    'No aplica': '#64748B'
  };
  return colores[nivel] || '#64748B';
};

export const getNivelTasa = (nivel) => {
  const tasas = {
    'Excelente': 3,
    'Bueno': 5,
    'Regular': 8,
    'No aplica': null
  };
  return tasas[nivel];
};

export const getMontoMaximo = (nivel) => {
  const maximos = {
    'Excelente': 50000,
    'Bueno': 30000,
    'Regular': 15000,
    'No aplica': 0
  };
  return maximos[nivel];
};

export const calcularPago = (monto, tasa, plazoSemanas) => {
  const tasaSemanal = tasa / 4;
  const interes = monto * (tasaSemanal / 100) * plazoSemanas;
  const total = monto + interes;
  const semanal = total / plazoSemanas;
  
  return {
    monto,
    tasa,
    plazo: plazoSemanas,
    interes: Math.round(interes),
    total: Math.round(total),
    semanal: Math.round(semanal)
  };
};

export default {
  calcularScore,
  getNivelColor,
  getNivelTasa,
  getMontoMaximo,
  calcularPago
};