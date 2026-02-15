import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { authAPI } from './api';

// Configure how notifications should be displayed when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Request notification permissions and get the Expo push token
 */
export async function registerForPushNotifications(): Promise<string | null> {
  try {
    // Check if running on physical device
    if (!__DEV__) {
      console.log('Push notifications require a physical device');
    }

    // Request permission
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('Failed to get push notification permissions');
      return null;
    }

    // Get the Expo push token
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: '068870cd-4055-4557-beee-c5fef2c7eb9c',
    });

    const token = tokenData.data;
    console.log('Expo Push Token:', token);

    // Configure notification channel for Android
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#4CAF50',
      });
    }

    return token;
  } catch (error) {
    console.error('Error getting push token:', error);
    return null;
  }
}

/**
 * Send the push token to the backend
 */
export async function savePushTokenToBackend(token: string): Promise<boolean> {
  try {
    await authAPI.updateProfile({
      pushNotificationToken: token,
    });
    console.log('Push token saved to backend successfully');
    return true;
  } catch (error) {
    console.error('Error saving push token to backend:', error);
    return false;
  }
}

/**
 * Initialize push notifications
 * This should be called when the user logs in
 */
export async function initializePushNotifications(): Promise<void> {
  try {
    const token = await registerForPushNotifications();

    if (token) {
      await savePushTokenToBackend(token);
    }
  } catch (error) {
    console.error('Error initializing push notifications:', error);
  }
}

/**
 * Setup notification listeners
 * Returns cleanup function to remove listeners
 */
export function setupNotificationListeners(
  onNotificationReceived?: (notification: Notifications.Notification) => void,
  onNotificationTapped?: (response: Notifications.NotificationResponse) => void
): () => void {
  // Listener for notifications received while app is in foreground
  const receivedSubscription = Notifications.addNotificationReceivedListener(
    (notification) => {
      console.log('Notification received:', notification);
      if (onNotificationReceived) {
        onNotificationReceived(notification);
      }
    }
  );

  // Listener for when user taps on a notification
  const responseSubscription = Notifications.addNotificationResponseReceivedListener(
    (response) => {
      console.log('Notification tapped:', response);
      if (onNotificationTapped) {
        onNotificationTapped(response);
      }
    }
  );

  // Return cleanup function
  return () => {
    receivedSubscription.remove();
    responseSubscription.remove();
  };
}

/**
 * Handle notification tap navigation
 */
export function handleNotificationNavigation(
  response: Notifications.NotificationResponse,
  navigation: any
): void {
  const data = response.notification.request.content.data;

  if (data.type === 'price_drop' && data.priceWatchId) {
    // Navigate to price history screen
    navigation.navigate('PriceHistory', {
      watchId: data.priceWatchId,
    });
  }
}

/**
 * Get notification badge count
 */
export async function getBadgeCount(): Promise<number> {
  return await Notifications.getBadgeCountAsync();
}

/**
 * Set notification badge count
 */
export async function setBadgeCount(count: number): Promise<void> {
  await Notifications.setBadgeCountAsync(count);
}

/**
 * Clear all notifications
 */
export async function clearAllNotifications(): Promise<void> {
  await Notifications.dismissAllNotificationsAsync();
  await setBadgeCount(0);
}
