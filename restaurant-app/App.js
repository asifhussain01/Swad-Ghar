import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RestaurantAuthProvider } from './src/context/RestaurantAuthContext';
import { OrderNotificationProvider } from './src/context/OrderNotificationContext';
import { navigationRef } from './src/navigation/navigationRef';
import RootNavigator from './src/navigation/RootNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <RestaurantAuthProvider>
        <NavigationContainer ref={navigationRef}>
          <OrderNotificationProvider>
            <RootNavigator />
            <StatusBar style="dark" />
          </OrderNotificationProvider>
        </NavigationContainer>
      </RestaurantAuthProvider>
    </SafeAreaProvider>
  );
}
