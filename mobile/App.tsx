import React, { useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AppNavigator from './src/navigation/AppNavigator';
import { useAuthStore } from './src/store/authStore';
import {
  initializePushNotifications,
  setupNotificationListeners,
  handleNotificationNavigation,
} from './src/services/notificationService';

export default function App() {
  const { loadToken, isAuthenticated } = useAuthStore();
  const navigationRef = useRef<any>(null);

  useEffect(() => {
    // Load stored auth token on app start
    loadToken();
  }, []);

  // Initialize push notifications when user is authenticated
  useEffect(() => {
    if (isAuthenticated) {
      initializePushNotifications();
    }
  }, [isAuthenticated]);

  // Setup notification listeners
  useEffect(() => {
    const cleanup = setupNotificationListeners(
      undefined, // onNotificationReceived - let default handler show it
      (response) => {
        // Handle notification tap
        if (navigationRef.current) {
          handleNotificationNavigation(response, navigationRef.current);
        }
      }
    );

    return cleanup;
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <NavigationContainer ref={navigationRef}>
          <AppNavigator />
          <StatusBar style="auto" />
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
