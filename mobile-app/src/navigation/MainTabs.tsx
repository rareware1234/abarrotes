import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import { useAuth } from '../context/AuthContext';
import PosScreen from '../screens/PosScreen';
import ScannerScreen from '../screens/ScannerScreen';
import CajaScreen from '../screens/CajaScreen';
import TasksScreen from '../screens/TasksScreen';
import PerfilScreen from '../screens/PerfilScreen';
import DashboardScreen from '../screens/DashboardScreen';
import AsistenciaScreen from '../screens/AsistenciaScreen';

export const MainTabs = () => {
  const { Tab } = require('@react-navigation/bottom-tabs');
  const { empleado } = useAuth();

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarStyle: {
          backgroundColor: COLORS.white,
          borderTopColor: '#e0e0e0',
          height: 65,
          paddingBottom: 8,
          paddingTop: 8,
        },
        headerStyle: {
          backgroundColor: COLORS.primary,
        },
        headerTintColor: COLORS.white,
        headerTitleStyle: { fontWeight: '600' },
      }}
    >
      <Tab.Screen
        name="POS"
        component={PosScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Ionicons name="cart" color={color} size={size} />,
          title: 'Venta',
        }}
      />
      <Tab.Screen
        name="Scanner"
        component={ScannerScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Ionicons name="barcode" color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Caja"
        component={CajaScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Ionicons name="cash-register" color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Tareas"
        component={TasksScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Ionicons name="checkbox" color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Asistencia"
        component={AsistenciaScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Ionicons name="time" color={color} size={size} />,
        }}
      />
      {empleado?.rol === 'DIRECTOR' && (
        <Tab.Screen
          name="Dashboard"
          component={DashboardScreen}
          options={{
            tabBarIcon: ({ color, size }) => <Ionicons name="analytics" color={color} size={size} />,
          }}
        />
      )}
      <Tab.Screen
        name="Perfil"
        component={PerfilScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Ionicons name="person" color={color} size={size} />,
        }}
      />
    </Tab.Navigator>
  );
};
