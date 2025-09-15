import { supabase } from '../supabaseClient';
import { Notification as DetailedNotification } from '../types/notifications';
import { NotificationService } from './notificationService';
import ConnectionManager from './connectionManager';

export interface RealTimeNotificationOptions {
  onNotificationReceived?: (notification: DetailedNotification) => void;
  onNotificationUpdated?: (notification: DetailedNotification) => void;
  onNotificationDeleted?: (notificationId: string) => void;
  playSound?: boolean;
  showBrowserNotification?: boolean;
  vibrate?: boolean;
}

export class RealTimeNotificationService {
  private static subscriptions = new Map<string, any>();
  private static audioContext: AudioContext | null = null;
  private static isNotificationPermissionGranted = false;
  private static connectionState: 'disconnected' | 'connecting' | 'connected' | 'error' = 'disconnected';
  private static retryAttempts = new Map<string, number>();
  private static maxRetryAttempts = 5;
  private static retryDelay = 1000; // Start with 1 second
  private static lastConnectionAttempt = new Map<string, number>();
  private static connectionDebounceTime = 2000; // 2 seconds

  /**
   * Initialize the real-time notification service
   */
  static async initialize(): Promise<{ success: boolean; error?: string }> {
    try {
      this.connectionState = 'connecting';

      // Request notification permission if not already granted
      if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        this.isNotificationPermissionGranted = permission === 'granted';
      }

      // Initialize audio context for notification sounds with user gesture handling
      if ('AudioContext' in window || 'webkitAudioContext' in window) {
        try {
          this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
          
          // Handle suspended audio context (Chrome requires user interaction)
          if (this.audioContext.state === 'suspended') {
            // We'll resume it later when a user interaction happens
            console.log('AudioContext is suspended, will resume on first user interaction');
            this.setupUserInteractionHandler();
          }
        } catch (audioError) {
          console.warn('AudioContext initialization failed:', audioError);
          this.audioContext = null; // Continue without audio notifications
        }
      }

      // Initialize connection manager
      const connectionManager = ConnectionManager.getInstance();
      const connectionResult = await connectionManager.initialize();
      
      if (!connectionResult.success) {
        this.connectionState = 'error';
        return connectionResult;
      }

      this.connectionState = 'connected';
      return { success: true };
    } catch (error) {
      console.error('Error initializing real-time notifications:', error);
      this.connectionState = 'error';
      return { success: false, error: 'Failed to initialize notifications' };
    }
  }

  /**
   * Subscribe to real-time notifications for a user
   */
  static subscribeToUserNotifications(
    userId: string,
    options: RealTimeNotificationOptions = {}
  ): { unsubscribe: () => void } {
    const subscriptionKey = `user_${userId}`;
    const connectionManager = ConnectionManager.getInstance();
    
    // Check if connection manager allows new connections
    if (!connectionManager.canAttemptConnection()) {
      console.log(`Connection manager is debouncing attempts for ${subscriptionKey}`);
      return { unsubscribe: () => {} }; // Return dummy unsubscribe
    }
    
    // Check connection state
    const connectionState = connectionManager.getConnectionState();
    if (connectionState === 'error') {
      console.warn(`Connection is in error state, cannot create subscription for ${subscriptionKey}`);
      return { unsubscribe: () => {} };
    }
    
    // Unsubscribe if already subscribed
    if (this.subscriptions.has(subscriptionKey)) {
      this.unsubscribe(subscriptionKey);
    }

    this.retryAttempts.set(subscriptionKey, 0);

    const createSubscription = () => {
      const subscription = supabase
        .channel(`notifications_${userId}`, {
          config: {
            broadcast: { self: false },
            presence: { key: userId }
          }
        })
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${userId}`
          },
          (payload: any) => {
            try {
              const notification = payload.new as DetailedNotification;
              this.handleNewNotification(notification, options);
            } catch (error) {
              console.error('Error handling new notification:', error);
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${userId}`
          },
          (payload: any) => {
            try {
              const notification = payload.new as DetailedNotification;
              options.onNotificationUpdated?.(notification);
            } catch (error) {
              console.error('Error handling notification update:', error);
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'DELETE',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${userId}`
          },
          (payload: any) => {
            try {
              const notificationId = payload.old?.id;
              if (notificationId) {
                options.onNotificationDeleted?.(notificationId);
              }
            } catch (error) {
              console.error('Error handling notification deletion:', error);
            }
          }
        )
        .subscribe((status) => {
          console.log(`Notification subscription status for user ${userId}:`, status);
          const connectionManager = ConnectionManager.getInstance();
          
          if (status === 'SUBSCRIPTION_ERROR') {
            console.error(`Subscription error for user ${userId}:`, status);
            this.connectionState = 'error';
            connectionManager.markConnectionFailed(`Subscription error: ${status}`);
            this.handleSubscriptionError(subscriptionKey, createSubscription, options);
          } else if (status === 'CLOSED') {
            console.warn(`Subscription closed for user ${userId}:`, status);
            this.connectionState = 'disconnected';
            connectionManager.markConnectionFailed(`Subscription closed: ${status}`);
            // Let connection manager handle reconnection
          } else if (status === 'SUBSCRIBED') {
            console.log(`Successfully subscribed to notifications for user ${userId}`);
            this.retryAttempts.set(subscriptionKey, 0); // Reset retry count on success
            this.connectionState = 'connected';
            connectionManager.markConnectionSuccessful();
          } else if (status === 'CHANNEL_ERROR') {
            console.error(`Channel error for user ${userId}:`, status);
            this.connectionState = 'error';
            connectionManager.markConnectionFailed(`Channel error: ${status}`);
          }
        });

      this.subscriptions.set(subscriptionKey, subscription);
      return subscription;
    };

    createSubscription();

    return {
      unsubscribe: () => this.unsubscribe(subscriptionKey)
    };
  }

  /**
   * Subscribe to appointment-specific notifications
   */
  static subscribeToAppointmentNotifications(
    appointmentId: string,
    userId: string,
    options: RealTimeNotificationOptions = {}
  ): { unsubscribe: () => void } {
    const subscriptionKey = `appointment_${appointmentId}_${userId}`;
    
    if (this.subscriptions.has(subscriptionKey)) {
      this.unsubscribe(subscriptionKey);
    }

    const subscription = supabase
      .channel(`appointment_notifications_${appointmentId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}&appointment_id=eq.${appointmentId}`
        },
        (payload: any) => {
          const notification = payload.new as DetailedNotification;
          this.handleNewNotification(notification, options);
        }
      )
      .subscribe();

    this.subscriptions.set(subscriptionKey, subscription);

    return {
      unsubscribe: () => this.unsubscribe(subscriptionKey)
    };
  }

  /**
   * Subscribe to system-wide notifications
   */
  static subscribeToSystemNotifications(
    userType: 'patient' | 'clinic' | 'doctor',
    options: RealTimeNotificationOptions = {}
  ): { unsubscribe: () => void } {
    const subscriptionKey = `system_${userType}`;
    
    if (this.subscriptions.has(subscriptionKey)) {
      this.unsubscribe(subscriptionKey);
    }

    const subscription = supabase
      .channel(`system_notifications_${userType}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_type=eq.${userType}&type=in.(system,maintenance,security,feature_update)`
        },
        (payload: any) => {
          const notification = payload.new as DetailedNotification;
          this.handleNewNotification(notification, options);
        }
      )
      .subscribe();

    this.subscriptions.set(subscriptionKey, subscription);

    return {
      unsubscribe: () => this.unsubscribe(subscriptionKey)
    };
  }

  /**
   * Handle new notification received via real-time subscription
   */
  private static async handleNewNotification(
    notification: DetailedNotification,
    options: RealTimeNotificationOptions
  ) {
    try {
      console.log('📧 New notification received:', notification);

      // Call the callback
      options.onNotificationReceived?.(notification);

      // Play notification sound
      if (options.playSound !== false) {
        await this.playNotificationSound(notification);
      }

      // Show browser notification
      if (options.showBrowserNotification !== false) {
        this.showBrowserNotification(notification);
      }

      // Vibrate device (mobile)
      if (options.vibrate !== false) {
        this.vibrate(notification);
      }

      // Log notification analytics
      this.logNotificationReceived(notification);

    } catch (error) {
      console.error('Error handling new notification:', error);
    }
  }

  /**
   * Handle subscription errors with retry logic
   */
  private static handleSubscriptionError(
    subscriptionKey: string,
    createSubscription: () => any,
    options: RealTimeNotificationOptions
  ): void {
    const currentAttempts = this.retryAttempts.get(subscriptionKey) || 0;
    
    if (currentAttempts >= this.maxRetryAttempts) {
      console.error(`Max retry attempts reached for ${subscriptionKey}`);
      this.connectionState = 'error';
      return;
    }
    
    const retryCount = currentAttempts + 1;
    this.retryAttempts.set(subscriptionKey, retryCount);
    
    const delay = this.retryDelay * Math.pow(2, retryCount - 1); // Exponential backoff
    
    console.log(`Retrying subscription ${subscriptionKey} in ${delay}ms (attempt ${retryCount}/${this.maxRetryAttempts})`);
    
    setTimeout(() => {
      try {
        // Remove the failed subscription
        this.unsubscribe(subscriptionKey);
        // Create a new subscription
        createSubscription();
      } catch (error) {
        console.error(`Retry failed for ${subscriptionKey}:`, error);
        this.handleSubscriptionError(subscriptionKey, createSubscription, options);
      }
    }, delay);
  }

  /**
   * Resume AudioContext if suspended (requires user interaction)
   */
  private static async resumeAudioContext(): Promise<void> {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      try {
        await this.audioContext.resume();
        console.log('AudioContext resumed successfully');
      } catch (error) {
        console.warn('Failed to resume AudioContext:', error);
      }
    }
  }

  /**
   * Play notification sound based on notification type and priority
   */
  private static async playNotificationSound(notification: DetailedNotification): Promise<void> {
    if (!this.audioContext) {
      console.log('AudioContext not available, skipping sound');
      return;
    }

    try {
      // Try to resume AudioContext if suspended
      await this.resumeAudioContext();
      
      if (this.audioContext.state !== 'running') {
        console.log('AudioContext not running, skipping sound');
        return;
      }

      // Different sounds for different priorities
      const frequency = this.getNotificationSoundFrequency(notification);
      const priority = 'priority' in notification ? notification.priority : 'normal';
      const duration = priority === 'urgent' ? 200 : 100;
      
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration / 1000);
      
      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + duration / 1000);

      // Play multiple tones for urgent notifications
      if (priority === 'urgent') {
        setTimeout(() => {
          this.playNotificationSound(notification);
        }, 300);
      }

    } catch (error) {
      console.error('Error playing notification sound:', error);
    }
  }

  /**
   * Get sound frequency based on notification type and priority
   */
  private static getNotificationSoundFrequency(notification: DetailedNotification): number {
    // Base frequencies for different notification types
    const typeFrequencies = {
      appointment_confirmed: 523, // C5
      appointment_reminder: 659, // E5
      appointment_cancelled: 349, // F4
      appointment_completed: 784, // G5
      system: 440, // A4
      security: 880, // A5
      payment_successful: 698, // F5
      payment_failed: 294, // D4
    };

    let baseFrequency = typeFrequencies[notification.type as keyof typeof typeFrequencies] || 440;

    // Modify frequency based on priority
    const priority = 'priority' in notification ? notification.priority : 'normal';
    if (priority === 'urgent') {
      baseFrequency *= 1.2;
    } else if (priority === 'high') {
      baseFrequency *= 1.1;
    }

    return baseFrequency;
  }

  /**
   * Show browser notification
   */
  private static showBrowserNotification(notification: DetailedNotification): void {
    if (!this.isNotificationPermissionGranted) return;

    try {
      const priority = 'priority' in notification ? notification.priority : 'normal';
      const actionUrl = 'action_url' in notification ? notification.action_url : undefined;
      const actionText = 'action_text' in notification ? notification.action_text : undefined;
      
      const options: NotificationOptions = {
        body: notification.message,
        icon: this.getNotificationIcon(notification.type),
        badge: '/favicon.ico',
        tag: notification.id,
        requireInteraction: priority === 'urgent',
        silent: false,
        timestamp: new Date(notification.created_at).getTime(),
        data: {
          notificationId: notification.id,
          actionUrl: actionUrl
        }
      };

      // Add actions for actionable notifications
      if (actionText && actionUrl) {
        options.actions = [
          {
            action: 'view',
            title: actionText,
            icon: '/icons/view.png'
          },
          {
            action: 'dismiss',
            title: 'Dismiss',
            icon: '/icons/dismiss.png'
          }
        ];
      }

      const browserNotification = new Notification(notification.title, options);

      // Handle notification click
      browserNotification.onclick = (event) => {
        event.preventDefault();
        window.focus();
        
        if (actionUrl) {
          if (actionUrl.startsWith('http')) {
            window.open(actionUrl, '_blank');
          } else {
            // Handle internal routing
            window.location.hash = actionUrl;
          }
        }
        
        browserNotification.close();
      };

      // Auto-close after delay (except urgent notifications)
      if (priority !== 'urgent') {
        setTimeout(() => {
          browserNotification.close();
        }, 5000);
      }

    } catch (error) {
      console.error('Error showing browser notification:', error);
    }
  }

  /**
   * Vibrate device for mobile notifications
   */
  private static vibrate(notification: DetailedNotification): void {
    if (!('vibrate' in navigator)) return;

    try {
      // Different vibration patterns for different priorities
      let pattern: number[] = [100]; // Default
      const priority = 'priority' in notification ? notification.priority : 'normal';

      switch (priority) {
        case 'urgent':
          pattern = [100, 50, 100, 50, 100];
          break;
        case 'high':
          pattern = [100, 50, 100];
          break;
        case 'normal':
          pattern = [100];
          break;
        case 'low':
          pattern = [50];
          break;
      }

      navigator.vibrate(pattern);
    } catch (error) {
      console.error('Error vibrating device:', error);
    }
  }

  /**
   * Get notification icon URL based on type
   */
  private static getNotificationIcon(type: string): string {
    const iconMap: Record<string, string> = {
      appointment_confirmed: '/icons/check.png',
      appointment_reminder: '/icons/calendar.png',
      appointment_cancelled: '/icons/cancel.png',
      appointment_completed: '/icons/completed.png',
      system: '/icons/system.png',
      security: '/icons/security.png',
      payment_successful: '/icons/payment.png',
      payment_failed: '/icons/payment-failed.png',
    };

    return iconMap[type] || '/icons/notification.png';
  }

  /**
   * Log notification received for analytics
   */
  private static logNotificationReceived(notification: DetailedNotification): void {
    // You can implement analytics logging here
    const priority = 'priority' in notification ? notification.priority : 'normal';
    console.log('📊 Notification analytics:', {
      id: notification.id,
      type: notification.type,
      priority: priority,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Unsubscribe from a specific subscription
   */
  private static unsubscribe(subscriptionKey: string): void {
    const subscription = this.subscriptions.get(subscriptionKey);
    if (subscription) {
      supabase.removeChannel(subscription);
      this.subscriptions.delete(subscriptionKey);
      console.log(`🔌 Unsubscribed from ${subscriptionKey}`);
    }
  }

  /**
   * Unsubscribe from all notifications
   */
  static unsubscribeFromAll(): void {
    for (const [key, subscription] of this.subscriptions.entries()) {
      supabase.removeChannel(subscription);
      console.log(`🔌 Unsubscribed from ${key}`);
    }
    this.subscriptions.clear();
  }

  /**
   * Get current subscription status
   */
  static getSubscriptionStatus(): {
    active: string[];
    count: number;
  } {
    return {
      active: Array.from(this.subscriptions.keys()),
      count: this.subscriptions.size
    };
  }

  /**
   * Test notification functionality
   */
  static async testNotification(
    userId: string,
    type: DetailedNotification['type'] = 'system'
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const testNotification = await NotificationService.createNotification({
        user_id: userId,
        user_type: 'patient',
        type,
        title: 'Test Notification',
        message: 'This is a test notification to verify the real-time notification system is working.',
        priority: 'normal'
      });

      if (testNotification.error) {
        return { success: false, error: testNotification.error };
      }

      return { success: true };
    } catch (error) {
      console.error('Error sending test notification:', error);
      return { success: false, error: 'Failed to send test notification' };
    }
  }

  /**
   * Check if notifications are supported
   */
  static isSupported(): {
    browserNotifications: boolean;
    realTime: boolean;
    audio: boolean;
    vibration: boolean;
  } {
    return {
      browserNotifications: 'Notification' in window,
      realTime: true, // Supabase real-time is always available
      audio: 'AudioContext' in window || 'webkitAudioContext' in window,
      vibration: 'vibrate' in navigator
    };
  }

  /**
   * Get notification permission status
   */
  static getPermissionStatus(): {
    notification: NotificationPermission;
    granted: boolean;
  } {
    const permission = 'Notification' in window ? Notification.permission : 'denied';
    return {
      notification: permission,
      granted: permission === 'granted'
    };
  }

  /**
   * Get current connection status
   */
  static getConnectionStatus(): {
    state: 'disconnected' | 'connecting' | 'connected' | 'error';
    subscriptions: number;
    retryAttempts: { [key: string]: number };
  } {
    return {
      state: this.connectionState,
      subscriptions: this.subscriptions.size,
      retryAttempts: Object.fromEntries(this.retryAttempts)
    };
  }

  /**
   * Force reconnection of all subscriptions
   */
  static async forceReconnect(): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('Forcing reconnection of all subscriptions...');
      
      // Store current subscriptions info before clearing
      const currentSubs = new Map(this.subscriptions);
      
      // Clear all subscriptions
      this.unsubscribeFromAll();
      
      // Reset retry attempts
      this.retryAttempts.clear();
      
      // Reset connection state
      this.connectionState = 'disconnected';
      
      // Use connection manager for reconnection
      const connectionManager = ConnectionManager.getInstance();
      const reconnectResult = await connectionManager.forceReconnection();
      
      if (!reconnectResult.success) {
        return reconnectResult;
      }
      
      // Re-initialize the service
      const initResult = await this.initialize();
      if (!initResult.success) {
        return initResult;
      }
      
      console.log(`Force reconnect completed. Previously had ${currentSubs.size} subscriptions.`);
      return { success: true };
    } catch (error) {
      console.error('Error during force reconnect:', error);
      return { success: false, error: 'Failed to force reconnect' };
    }
  }

  /**
   * Clear retry attempts for a specific subscription
   */
  static clearRetryAttempts(subscriptionKey: string): void {
    this.retryAttempts.delete(subscriptionKey);
  }

  /**
   * Setup user interaction handler to resume AudioContext
   */
  static setupUserInteractionHandler(): void {
    const resumeOnInteraction = async () => {
      if (this.audioContext && this.audioContext.state === 'suspended') {
        await this.resumeAudioContext();
        // Remove listeners after successful resume
        document.removeEventListener('click', resumeOnInteraction);
        document.removeEventListener('touchstart', resumeOnInteraction);
        document.removeEventListener('keydown', resumeOnInteraction);
      }
    };
    
    // Add event listeners for user interactions
    document.addEventListener('click', resumeOnInteraction, { once: true });
    document.addEventListener('touchstart', resumeOnInteraction, { once: true });
    document.addEventListener('keydown', resumeOnInteraction, { once: true });
  }
}

export default RealTimeNotificationService;