import { signInWithEmailAndPassword, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import { Empleado } from '../types';

export const login = async (numEmpleado: string, password: string): Promise<Empleado> => {
  const email = `${numEmpleado.toUpperCase()}@abarrotesdigitales.com`;
  const { user } = await signInWithEmailAndPassword(auth, email, password);
  
  const perfilDoc = await getDoc(doc(db, 'empleados', user.uid));
  if (!perfilDoc.exists()) throw new Error('Perfil de empleado no encontrado');
  
  const perfil = perfilDoc.data() as Empleado;
  if (!perfil.activo) throw new Error('Empleado inactivo. Contacte al administrador.');
  
  return { uid: user.uid, ...perfil };
};

export const logout = async () => {
  await signOut(auth);
};

export const onAuthChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};
