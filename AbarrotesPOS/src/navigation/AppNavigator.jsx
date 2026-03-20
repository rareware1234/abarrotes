import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet } from 'react-native';
import { LoginScreen, HomeScreen, POSScreen, ScannerScreen } from '../screens';
import { colors } from '../theme';
import { useAuthStore } from '../store';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const TabIcon = ({ icon, focused }) => (
  <View style={[styles.tabIcon, focused && styles.tabIconFocused]}>
    <Text style={[styles.tabIconText, focused && styles.tabIconTextFocused]}>{icon}</Text>
  </View>
);

const HomeTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Inicio',
          tabBarIcon: ({ focused }) => <TabIcon icon="🏠" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="POS"
        component={POSScreen}
        options={{
          tabBarLabel: 'Venta',
          tabBarIcon: ({ focused }) => <TabIcon icon="💰" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Scanner"
        component={ScannerScreen}
        options={{
          tabBarLabel: 'Escanear',
          tabBarIcon: ({ focused }) => <TabIcon icon="📷" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
};

const AppNavigator = () => {
  const { isAuthenticated } = useAuthStore();

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: 'slide_from_right',
        }}
      >
        {!isAuthenticated ? (
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : (
          <>
            <Stack.Screen name="Home" component={HomeTabs} />
            <Stack.Screen name="POS" component={POSScreen} />
            <Stack.Screen name="Scanner" component={ScannerScreen} />
            <Stack.Screen name="Products" component={PlaceholderScreen} />
            <Stack.Screen name="History" component={PlaceholderScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const PlaceholderScreen = ({ navigation }) => (
  <View style={styles.placeholder}>
    <Text style={styles.placeholderText}>Pantalla en desarrollo</Text>
    <Text style={styles.placeholderBack} onPress={() => navigation.goBack()}>
      Volver
    </Text>
  </View>
);

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.surface,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    height: 85,
    paddingTop: 10,
    paddingBottom: 25,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  tabIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabIconFocused: {
    backgroundColor: colors.primary + '20',
  },
  tabIconText: {
    fontSize: 22,
    opacity: 0.6,
  },
  tabIconTextFocused: {
    opacity: 1,
  },
  placeholder: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: colors.text,
    fontSize: 18,
    marginBottom: 20,
  },
  placeholderBack: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AppNavigator;
