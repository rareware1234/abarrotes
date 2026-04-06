import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { getFirestore, collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';
import { firebaseConfig } from '../firebase-config/firebase-config';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
};

export const calcularSaludTienda = (creditos) => {
  if (!creditos || creditos.length === 0) {
    return 'saludable';
  }

  const vencidos = creditos.filter(c => c.estado === 'vencido').length;
  
  const porVencer = creditos.filter(c => {
    if (c.estado !== 'activo' || !c.fechaVencimiento) return false;
    const vencimiento = c.fechaVencimiento.toDate ? c.fechaVencimiento.toDate() : new Date(c.fechaVencimiento);
    const dias = Math.ceil((vencimiento - new Date()) / (1000 * 60 * 60 * 24));
    return dias >= 0 && dias <= 7;
  }).length;

  const carteraTotal = creditos.reduce((sum, c) => sum + (c.montoAprobado || 0), 0);
  const carteraUsada = creditos.reduce((sum, c) => sum + (c.montoUsado || 0), 0);
  const carteraVencida = creditos
    .filter(c => c.estado === 'vencido')
    .reduce((sum, c) => sum + (c.montoUsado || 0), 0);

  const porcentajeUsoPromedio = carteraTotal > 0 ? carteraUsada / carteraTotal : 0;
  const porcentajeVencida = carteraTotal > 0 ? carteraVencida / carteraTotal : 0;

  if (vencidos >= 2 || porcentajeUsoPromedio > 0.85 || porcentajeVencida > 0.2) {
    return 'critico';
  }
  if (vencidos === 1 || porVencer > 0 || porcentajeUsoPromedio > 0.7) {
    return 'enRiesgo';
  }
  return 'saludable';
};

export const useCreditoDashboard = () => {
  const { empleado } = useAuth();
  const [tiendas, setTiendas] = useState([]);
  const [creditos, setCreditos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const tiendasRef = collection(db, 'tiendas');
      let tiendasQ = query(tiendasRef, where('activa', '==', true));
      const tiendasSnapshot = await getDocs(tiendasQ);
      
      let tiendasData = [];
      tiendasSnapshot.forEach(doc => {
        tiendasData.push({ id: doc.id, ...doc.data() });
      });

      if (empleado?.rol === 'manager' && empleado?.tiendasAsignadas?.length > 0) {
        tiendasData = tiendasData.filter(t => 
          empleado.tiendasAsignadas.includes(t.id)
        );
      } else if (empleado?.rol === 'manager' && !empleado?.tiendasAsignadas?.length) {
        tiendasData = [];
      }

      const creditosRef = collection(db, 'creditos');
      const creditosQ = query(creditosRef, where('estado', 'in', ['activo', 'vencido', 'suspendido']));
      const creditosSnapshot = await getDocs(creditosQ);
      
      const creditosData = [];
      creditosSnapshot.forEach(doc => {
        creditosData.push({ id: doc.id, ...doc.data() });
      });

      setTiendas(tiendasData);
      setCreditos(creditosData);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [empleado?.rol, empleado?.tiendasAsignadas]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const creditosPorTienda = tiendas.reduce((acc, tienda) => {
    acc[tienda.id] = creditos.filter(c => c.tiendaId === tienda.id);
    return acc;
  }, {});

  const calculateKPIs = () => {
    const activos = creditos.filter(c => c.estado === 'activo');
    const carteraTotal = activos.reduce((sum, c) => sum + (c.montoAprobado || 0), 0);
    const montoEnUso = activos.reduce((sum, c) => sum + (c.montoUsado || 0), 0);
    const porcentajeUso = carteraTotal > 0 ? (montoEnUso / carteraTotal) * 100 : 0;
    
    const carteraVencida = creditos
      .filter(c => c.estado === 'vencido')
      .reduce((sum, c) => sum + (c.montoUsado || 0), 0);

    const creditosCerrados = creditos.filter(c => c.estado === 'pagado').length;
    const creditosPagadosEnTiempo = creditos.filter(c => 
      c.estado === 'pagado' && !c.tuvoAtraso
    ).length;
    
    const tasaCumplimiento = creditosCerrados > 0 
      ? (creditosPagadosEnTiempo / creditosCerrados) * 100 
      : 100;

    return {
      carteraTotal,
      montoEnUso,
      porcentajeUso,
      carteraVencida,
      tasaCumplimiento,
      formatCurrency
    };
  };

  const kpis = calculateKPIs();

  return {
    tiendas,
    creditos,
    creditosPorTienda,
    kpis,
    loading,
    error,
    lastUpdated,
    refresh: loadData
  };
};

export default useCreditoDashboard;
