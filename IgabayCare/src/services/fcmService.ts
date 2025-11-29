import { messaging, getToken, onMessage, vapidKey } from '../config/firebase';

export interface FCMNotification {
  title: string;
  body: string;
  icon?: string;
  image?: string;
  data?: Record<string, string>;
  tag?: string;
  requireInteraction?: boolean;
  actions?: NotificationAction[];
}

export interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}

export interface PushNotificationData {
  type: 'appointment' | 'message' | 'reminder' | 'system' | 'payment' | 'prescription';
  id: string;
  userId: string;
  timestamp: number;
  actionUrl?: string;
  priority: 'high' | 'normal' | 'low';
}

class FCMService {
  private currentToken: string | null = null;
  private isSupported: boolean = false;
  private permissionGranted: boolean = false;

  constructor() {
    this.checkSupport();
  }

  /**
   * Check if Firebase Cloud Messaging is supported in this browser
   */
  private checkSupport(): void {
    this.isSupported = 'Notification' in window && 
                      'serviceWorker' in navigator && 
                      'PushManager' in window &&
                      messaging !== null;
  }

  /**
   * Request notification permission from the user
   */
  async requestPermission(): Promise<boolean> {
    if (!this.isSupported) {
      console.warn('Push notifications are not supported in this browser');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      this.permissionGranted = permission === 'granted';
      
      if (this.permissionGranted) {
        console.log('Notification permission granted');
        await this.getToken();
      } else {
        console.warn('Notification permission denied');
      }
      
      return this.permissionGranted;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  /**
   * Get FCM token for the current device
   */
  async getToken(): Promise<string | null> {
    if (!this.isSupported || !this.permissionGranted) {
      console.warn('Cannot get token: notifications not supported or permission not granted');
      return null;
    }

    try {
      const token = await getToken(messaging, {
        vapidKey: vapidKey,
        serviceWorkerRegistration: await this.getServiceWorkerRegistration()
      });
      
      this.currentToken = token;
      console.log('FCM token obtained:', token);
      return token;
    } catch (error) {
      console.error('Error getting FCM token:', error);
      return null;
    }
  }

  /**
   * Get or register service worker
   */
  private async getServiceWorkerRegistration(): Promise<ServiceWorkerRegistration | undefined> {
    try {
      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
      console.log('Service Worker registered successfully');
      return registration || undefined;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return undefined;
    }
  }

  /**
   * Listen for incoming messages when app is in foreground
   */
  onMessage(callback: (payload: any) => void): void {
    if (!this.isSupported) return;

    onMessage(messaging, (payload) => {
      console.log('Foreground message received:', payload);
      
      // Show notification in foreground
      if (payload.notification) {
        this.showNotification({
          title: payload.notification.title || 'New Notification',
          body: payload.notification.body || '',
          icon: payload.notification.icon || '/favicon.ico',
          data: payload.data
        });
      }
      
      callback(payload);
    });
  }

  /**
   * Show a notification to the user
   */
  async showNotification(notification: FCMNotification): Promise<void> {
    if (!this.permissionGranted) {
      console.warn('Cannot show notification: permission not granted');
      return;
    }

    console.log('🔔 Attempting to show notification:', notification);

    try {
      const registration = await this.getServiceWorkerRegistration();
      if (!registration) {
        console.error('❌ Service worker registration failed');
        return;
      }

      console.log('✅ Service worker registered, showing notification...');

      await registration.showNotification(notification.title, {
        body: notification.body,
        icon: notification.icon || 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🔔</text></svg>',
        tag: notification.tag,
        requireInteraction: notification.requireInteraction || false,
        data: notification.data
      });

      console.log('✅ Notification shown successfully!');
    } catch (error) {
      console.error('❌ Error showing notification:', error);
    }
  }

  /**
   * Handle background messages through service worker
   */
  async handleBackgroundMessage(): Promise<void> {
    // This is handled by the service worker
    // The service worker will show notifications when the app is in background
  }

  /**
   * Get current FCM token
   */
  getCurrentToken(): string | null {
    return this.currentToken;
  }

  /**
   * Check if notifications are supported
   */
  isNotificationSupported(): boolean {
    return this.isSupported;
  }

  /**
   * Check if permission is granted
   */
  hasPermission(): boolean {
    return this.permissionGranted;
  }

  /**
   * Delete current FCM token (useful for logout)
   */
  async deleteToken(): Promise<boolean> {
    if (!this.currentToken) return true;

    try {
      // Note: deleteToken is not available in newer Firebase versions
      // This would typically be handled by the backend
      this.currentToken = null;
      console.log('FCM token cleared locally');
      return true;
    } catch (error) {
      console.error('Error clearing FCM token:', error);
      return false;
    }
  }

  /**
   * Send notification to specific user (server-side functionality)
   * This would typically be called from your backend
   */
  async sendNotificationToUser(
    targetToken: string,
    notification: FCMNotification,
    data?: PushNotificationData
  ): Promise<boolean> {
    // This should be implemented on your backend
    // Here's a placeholder for the structure
    try {
      const payload = {
        to: targetToken,
        notification: {
          title: notification.title,
          body: notification.body,
          icon: notification.icon,
          image: notification.image,
          click_action: data?.actionUrl
        },
        data: {
          ...data,
          ...notification.data
        },
        priority: data?.priority || 'high'
      };

      console.log('Notification payload prepared:', payload);
      // This would be sent to your backend API
      return true;
    } catch (error) {
      console.error('Error preparing notification payload:', error);
      return false;
    }
  }
}

// Export singleton instance
export const fcmService = new FCMService();
export default fcmService;
