import { Expo, ExpoPushMessage, ExpoPushTicket } from 'expo-server-sdk';
import logger from '../utils/logger';

const expo = new Expo();

export interface PushNotification {
  title: string;
  body: string;
  data?: any;
}

/**
 * Send a push notification to a single device
 */
export async function sendPushNotification(
  token: string,
  notification: PushNotification
): Promise<boolean> {
  if (!token) {
    logger.warn('Push notification token is missing');
    return false;
  }

  if (!Expo.isExpoPushToken(token)) {
    logger.error(`Invalid Expo push token: ${token}`);
    return false;
  }

  const message: ExpoPushMessage = {
    to: token,
    sound: 'default',
    title: notification.title,
    body: notification.body,
    data: notification.data || {},
    priority: 'high',
  };

  try {
    const tickets = await expo.sendPushNotificationsAsync([message]);
    logger.info(`Push notification sent, ticket:`, tickets[0]);

    // Check for errors in tickets
    for (const ticket of tickets) {
      if (ticket.status === 'error') {
        logger.error('Error sending notification:', ticket.message);
        return false;
      }
    }

    return true;
  } catch (error) {
    logger.error('Failed to send push notification:', error);
    return false;
  }
}

/**
 * Send push notifications to multiple devices in batch
 */
export async function sendBatchNotifications(
  notifications: Array<{
    token: string;
    notification: PushNotification;
  }>
): Promise<{ sent: number; failed: number }> {
  const messages: ExpoPushMessage[] = notifications
    .filter(({ token }) => Expo.isExpoPushToken(token))
    .map(({ token, notification }) => ({
      to: token,
      sound: 'default',
      title: notification.title,
      body: notification.body,
      data: notification.data || {},
      priority: 'high',
    }));

  if (messages.length === 0) {
    logger.warn('No valid push tokens found for batch notifications');
    return { sent: 0, failed: notifications.length };
  }

  // Send in chunks of 100 (Expo limit)
  const chunks = expo.chunkPushNotifications(messages);
  let sentCount = 0;
  let failedCount = 0;

  for (const chunk of chunks) {
    try {
      const tickets = await expo.sendPushNotificationsAsync(chunk);

      // Count successes and failures
      for (const ticket of tickets) {
        if (ticket.status === 'ok') {
          sentCount++;
        } else {
          failedCount++;
          logger.error('Batch notification error:', ticket);
        }
      }
    } catch (error) {
      logger.error('Batch notification chunk error:', error);
      failedCount += chunk.length;
    }
  }

  logger.info(`Batch notifications: ${sentCount} sent, ${failedCount} failed`);
  return { sent: sentCount, failed: failedCount };
}

/**
 * Check if a push token is valid
 */
export function isValidPushToken(token: string): boolean {
  return Expo.isExpoPushToken(token);
}
