import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { onAuthChange, logout as firebaseLogout } from '../services/authService';
import { getEmpleadoPerfil } from '../services/apiService';
import { Empleado } from '../types';

interface AuthContextType {
  empleado: Empleado | null;
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [empleado, setEmpleado] = useState<Empleado | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthChange(async (user) => {
      if (user) {
        const perfil = await getEmpleadoPerfil(user.uid);
        setEmpleado(perfil);
      } else {
        setEmpleado(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const logout = async () => {
    await firebaseLogout();
    await AsyncStorage.clear();
    setEmpleado(null);
  };

  return (
    <AuthContext.Provider value={{ empleado, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
