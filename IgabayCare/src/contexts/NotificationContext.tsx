import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { fcmService, FCMNotification, PushNotificationData } from '../services/fcmService';

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  type: PushNotificationData['type'];
  timestamp: number;
  read: boolean;
  icon?: string;
  image?: string;
  actionUrl?: string;
  data?: Record<string, any>;
}

export interface NotificationContextType {
  notifications: NotificationItem[];
  unreadCount: number;
  isSupported: boolean;
  hasPermission: boolean;
  isLoading: boolean;
  requestPermission: () => Promise<boolean>;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
  removeNotification: (id: string) => void;
  sendTestNotification: () => void;
  initializeNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);

  // Initialize notifications
  const initializeNotifications = async () => {
    setIsLoading(true);
    
    try {
      // Check if notifications are supported
      const supported = fcmService.isNotificationSupported();
      setIsSupported(supported);

      if (!supported) {
        console.warn('Push notifications are not supported in this browser');
        setIsLoading(false);
        return;
      }

      // Check current permission status
      const permission = Notification.permission;
      setHasPermission(permission === 'granted');

      // Request permission if not granted
      if (permission !== 'granted') {
        const granted = await fcmService.requestPermission();
        setHasPermission(granted);
      }

      // Set up message listener for foreground messages
      fcmService.onMessage((payload) => {
        handleIncomingMessage(payload);
      });

      // Load stored notifications from localStorage
      loadStoredNotifications();

    } catch (error) {
      console.error('Error initializing notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Load stored notifications from localStorage
  const loadStoredNotifications = () => {
    try {
      const stored = localStorage.getItem('mediclinic_notifications');
      if (stored) {
        const parsedNotifications = JSON.parse(stored);
        setNotifications(parsedNotifications);
      }
    } catch (error) {
      console.error('Error loading stored notifications:', error);
    }
  };

  // Save notifications to localStorage
  const saveNotifications = (notificationList: NotificationItem[]) => {
    try {
      localStorage.setItem('mediclinic_notifications', JSON.stringify(notificationList));
    } catch (error) {
      console.error('Error saving notifications:', error);
    }
  };

  // Handle incoming push messages
  const handleIncomingMessage = (payload: any) => {
    const notification: NotificationItem = {
      id: payload.data?.id || generateId(),
      title: payload.notification?.title || 'New Notification',
      body: payload.notification?.body || '',
      type: payload.data?.type || 'system',
      timestamp: Date.now(),
      read: false,
      icon: payload.notification?.icon,
      image: payload.notification?.image,
      actionUrl: payload.data?.actionUrl,
      data: payload.data
    };

    setNotifications(prev => {
      const updated = [notification, ...prev].slice(0, 50); // Keep only last 50 notifications
      saveNotifications(updated);
      return updated;
    });
  };

  // Generate unique ID for notifications
  const generateId = (): string => {
    return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  // Request notification permission
  const requestPermission = async (): Promise<boolean> => {
    const granted = await fcmService.requestPermission();
    setHasPermission(granted);
    return granted;
  };

  // Mark notification as read
  const markAsRead = (id: string) => {
    setNotifications(prev => {
      const updated = prev.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      );
      saveNotifications(updated);
      return updated;
    });
  };

  // Mark all notifications as read
  const markAllAsRead = () => {
    setNotifications(prev => {
      const updated = prev.map(notif => ({ ...notif, read: true }));
      saveNotifications(updated);
      return updated;
    });
  };

  // Clear all notifications
  const clearNotifications = () => {
    setNotifications([]);
    localStorage.removeItem('mediclinic_notifications');
  };

  // Remove specific notification
  const removeNotification = (id: string) => {
    setNotifications(prev => {
      const updated = prev.filter(notif => notif.id !== id);
      saveNotifications(updated);
      return updated;
    });
  };

  // Send test notification (for development)
  const sendTestNotification = async () => {
    if (!hasPermission) {
      console.warn('Cannot send test notification: permission not granted');
      return;
    }

    console.log('🔔 Sending test notification...');

    // Test 1: Try browser native notification first
    try {
      console.log('📱 Testing browser native notification...');
      const notification = new Notification('Test Notification (Native)', {
        body: 'This is a test from browser native API',
        icon: '/favicon.ico',
        tag: 'test-native'
      });
      
      setTimeout(() => {
        notification.close();
      }, 5000);
      
      console.log('✅ Native notification sent!');
    } catch (error) {
      console.error('❌ Native notification failed:', error);
    }

    // Test 2: Try FCM notification
    const testNotification: FCMNotification = {
      title: 'Test Notification (FCM)',
      body: 'This is a test notification from MediClinic FCM',
      icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🔔</text></svg>',
      data: {
        type: 'system',
        id: generateId(),
        userId: 'test-user',
        timestamp: Date.now().toString(),
        actionUrl: '/',
        priority: 'normal'
      },
      tag: 'test-fcm',
      requireInteraction: false
    };

    console.log('📱 Sending to FCM service:', testNotification);
    await fcmService.showNotification(testNotification);
    
    // Also add to notification list
    const mockPayload = {
      notification: {
        title: testNotification.title,
        body: testNotification.body,
        icon: testNotification.icon
      },
      data: testNotification.data
    };
    
    console.log('📋 Adding to notification list:', mockPayload);
    handleIncomingMessage(mockPayload);
    console.log('✅ Test notification sent!');
  };

  // Calculate unread count
  const unreadCount = notifications.filter(n => !n.read).length;

  // Initialize on mount
  useEffect(() => {
    initializeNotifications();
  }, []);

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    isSupported,
    hasPermission,
    isLoading,
    requestPermission,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    removeNotification,
    sendTestNotification,
    initializeNotifications
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export default NotificationContext;
