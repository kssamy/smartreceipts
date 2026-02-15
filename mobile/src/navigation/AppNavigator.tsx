import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuthStore } from '../store/authStore';
import { ActivityIndicator, View } from 'react-native';

// Auth Screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';

// Main Screens
import DashboardScreen from '../screens/dashboard/DashboardScreen';
import ReceiptsScreen from '../screens/receipts/ReceiptsScreen';
import ReceiptDetailScreen from '../screens/receipts/ReceiptDetailScreen';
import ScanScreen from '../screens/scan/ScanScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';

// Price Watch Screens
import PriceWatchListScreen from '../screens/priceWatch/PriceWatchListScreen';
import PriceHistoryScreen from '../screens/priceWatch/PriceHistoryScreen';

// Legal Screens
import { PrivacyPolicyScreen, TermsScreen } from '../screens/legal';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Auth Navigator
function AuthNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}

// Profile Stack Navigator
function ProfileNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="ProfileMain"
        component={ProfileScreen}
        options={{ headerTitle: 'Profile' }}
      />
      <Stack.Screen
        name="Privacy"
        component={PrivacyPolicyScreen}
        options={{ headerTitle: 'Privacy Policy' }}
      />
      <Stack.Screen
        name="Terms"
        component={TermsScreen}
        options={{ headerTitle: 'Terms & Conditions' }}
      />
    </Stack.Navigator>
  );
}

// Receipts Stack Navigator
function ReceiptsNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="ReceiptsList"
        component={ReceiptsScreen}
        options={{ headerTitle: 'My Receipts' }}
      />
      <Stack.Screen
        name="ReceiptDetail"
        component={ReceiptDetailScreen}
        options={{ headerTitle: 'Receipt Details' }}
      />
    </Stack.Navigator>
  );
}

// Price Watch Stack Navigator
function PriceWatchNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="PriceWatchList"
        component={PriceWatchListScreen}
        options={{ headerTitle: 'Price Tracker' }}
      />
      <Stack.Screen
        name="PriceHistory"
        component={PriceHistoryScreen}
        options={{ headerTitle: 'Price History' }}
      />
    </Stack.Navigator>
  );
}

// Main Tab Navigator
function MainNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: true,
        tabBarStyle: {
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarLabel: 'Dashboard',
          headerTitle: 'SmartReceipt',
        }}
      />
      <Tab.Screen
        name="Receipts"
        component={ReceiptsNavigator}
        options={{
          tabBarLabel: 'Receipts',
          headerTitle: 'My Receipts',
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="PriceWatch"
        component={PriceWatchNavigator}
        options={{
          tabBarLabel: 'Tracker',
          headerTitle: 'Price Tracker',
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="Scan"
        component={ScanScreen}
        options={{
          tabBarLabel: 'Scan',
          headerTitle: 'Scan Receipt',
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileNavigator}
        options={{
          tabBarLabel: 'Profile',
          headerTitle: 'Profile',
          headerShown: false,
        }}
      />
    </Tab.Navigator>
  );
}

// Root App Navigator
export default function AppNavigator() {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return isAuthenticated ? <MainNavigator /> : <AuthNavigator />;
}
