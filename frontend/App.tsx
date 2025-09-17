

import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Importar todas as telas
import SplashScreen from './app/screens/SplashScreen'; 
import DashboardScreen from './app/screens/DashboardScreen';
import ProductsScreen from './app/screens/ProductsScreen';
import NewProductScreen from './app/screens/NewProductScreen';
import NewSaleScreen from './app/screens/NewSaleScreen';
import SalesHistoryScreen from './app/screens/SalesHistoryScreen';
import LoginScreen from './app/screens/LoginScreen';
import RegisterScreen from './app/screens/RegisterScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="light" backgroundColor="#2196F3" />
      
      <Stack.Navigator 
        screenOptions={{ 
          headerShown: false,
          animation: 'slide_from_right'
        }}
        initialRouteName="Splash"
      >
        {/* Tela principal - Splash */}
        <Stack.Screen 
          name="Splash" 
          component={SplashScreen}
          options={{ title: 'GEVApp' }}
        />

        {/* Tela de Login */}
        <Stack.Screen 
          name="Login"
          component={LoginScreen}
          options={{ title: 'Login' }}
        />  

        {/* Tela de Registro */}
        <Stack.Screen 
          name="Register"
          component={RegisterScreen}
          options={{ title: 'Registrar' }}
        />

        {/* Dashboard */}
        <Stack.Screen 
          name="Dashboard"
          component={DashboardScreen}
          options={{ title: 'Dashboard' }}
        />  
        
        {/* Gestão de Produtos */}
        <Stack.Screen 
          name="Products" 
          component={ProductsScreen}
          options={{ title: 'Produtos' }}
        />
        
        <Stack.Screen 
          name="NewProduct" 
          component={NewProductScreen}
          options={{ title: 'Produto' }}
        />
        
        {/* Vendas */}
        <Stack.Screen 
          name="NewSale" 
          component={NewSaleScreen}
          options={{ title: 'Nova Venda' }}
        />
        
        <Stack.Screen 
          name="SalesHistory" 
          component={SalesHistoryScreen}
          options={{ title: 'Histórico' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}