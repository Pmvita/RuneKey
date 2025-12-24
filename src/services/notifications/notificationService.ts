// RuneKey/src/services/notifications/notificationService.ts
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { logger } from '../../utils/logger';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export interface NotificationConfig {
  title: string;
  body: string;
  data?: Record<string, any>;
  sound?: boolean;
  priority?: 'min' | 'low' | 'default' | 'high' | 'max';
}

export class NotificationService {
  private static instance: NotificationService;
  private isInitialized = false;
  private pushToken: string | null = null;

  private constructor() {}

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Request permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        logger.warn('Notification permissions not granted');
        return;
      }

      // Get push token
      if (Platform.OS !== 'web') {
        try {
          const tokenData = await Notifications.getExpoPushTokenAsync();
          this.pushToken = tokenData.data;
          logger.info('Push token obtained', { token: this.pushToken });
        } catch (error) {
          logger.warn('Failed to get push token', error);
          // Push token is optional, continue without it
        }
      }

      this.isInitialized = true;
      logger.info('Notification service initialized');
    } catch (error) {
      logger.error('Failed to initialize notification service', error);
    }
  }

  async scheduleLocalNotification(config: NotificationConfig, trigger?: Notifications.NotificationTriggerInput): Promise<string> {
    try {
      await this.ensureInitialized();

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: config.title,
          body: config.body,
          data: config.data || {},
          sound: config.sound !== false,
          priority: config.priority || 'default',
        },
        trigger: trigger || null, // null means show immediately
      });

      logger.info('Local notification scheduled', { id: notificationId, title: config.title });
      return notificationId;
    } catch (error) {
      logger.error('Failed to schedule notification', error);
      throw error;
    }
  }

  async showTransactionNotification(
    type: 'sent' | 'received' | 'swap' | 'failed',
    amount: string,
    token: string,
    hash?: string
  ): Promise<void> {
    const configs = {
      sent: {
        title: 'Transaction Sent',
        body: `Sent ${amount} ${token}`,
      },
      received: {
        title: 'Transaction Received',
        body: `Received ${amount} ${token}`,
      },
      swap: {
        title: 'Swap Completed',
        body: `Swapped ${amount} ${token}`,
      },
      failed: {
        title: 'Transaction Failed',
        body: `Failed to send ${amount} ${token}`,
      },
    };

    const config = configs[type];
    await this.scheduleLocalNotification({
      ...config,
      data: { type, amount, token, hash },
      priority: type === 'failed' ? 'high' : 'default',
    });
  }

  async showPriceAlertNotification(
    token: string,
    price: number,
    change: number,
    threshold?: number
  ): Promise<void> {
    const changePercent = ((change / price) * 100).toFixed(2);
    const direction = change > 0 ? 'increased' : 'decreased';
    const emoji = change > 0 ? '📈' : '📉';

    await this.scheduleLocalNotification({
      title: `${emoji} ${token} Price Alert`,
      body: `${token} ${direction} by ${Math.abs(parseFloat(changePercent))}%`,
      data: { type: 'price_alert', token, price, change, threshold },
      priority: 'high',
    });
  }

  async showNetworkSwitchNotification(network: string): Promise<void> {
    await this.scheduleLocalNotification({
      title: 'Network Switched',
      body: `Switched to ${network} network`,
      data: { type: 'network_switch', network },
    });
  }

  async showWalletConnectedNotification(address: string): Promise<void> {
    await this.scheduleLocalNotification({
      title: 'Wallet Connected',
      body: `Connected to ${address.slice(0, 6)}...${address.slice(-4)}`,
      data: { type: 'wallet_connected', address },
    });
  }

  async showWalletDisconnectedNotification(): Promise<void> {
    await this.scheduleLocalNotification({
      title: 'Wallet Disconnected',
      body: 'Your wallet has been disconnected',
      data: { type: 'wallet_disconnected' },
    });
  }

  async showSecurityAlertNotification(message: string): Promise<void> {
    await this.scheduleLocalNotification({
      title: 'Security Alert',
      body: message,
      data: { type: 'security_alert' },
      priority: 'max',
    });
  }

  async cancelNotification(notificationId: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      logger.info('Notification cancelled', { id: notificationId });
    } catch (error) {
      logger.error('Failed to cancel notification', error);
    }
  }

  async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      logger.info('All notifications cancelled');
    } catch (error) {
      logger.error('Failed to cancel all notifications', error);
    }
  }

  getPushToken(): string | null {
    return this.pushToken;
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }
  }

  // Listen to notification events
  addNotificationReceivedListener(
    listener: (notification: Notifications.Notification) => void
  ): Notifications.Subscription {
    return Notifications.addNotificationReceivedListener(listener);
  }

  addNotificationResponseReceivedListener(
    listener: (response: Notifications.NotificationResponse) => void
  ): Notifications.Subscription {
    return Notifications.addNotificationResponseReceivedListener(listener);
  }
}

export const notificationService = NotificationService.getInstance();

