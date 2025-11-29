import { fcmService } from './fcmService';
import { authService, authStorage } from '../features/auth/utils/authService';

export interface FCMTokenData {
  token: string;
  userId: string;
  userAgent: string;
  createdAt: number;
  lastUsedAt: number;
  isActive: boolean;
}

export interface TokenUpdateResponse {
  success: boolean;
  error?: string;
  token?: string;
}

class FCMTokenService {
  private readonly TOKEN_STORAGE_KEY = 'mediclinic_fcm_token';
  private readonly TOKEN_UPDATE_INTERVAL = 7 * 24 * 60 * 60 * 1000; // 7 days

  /**
   * Initialize FCM token for the current user
   */
  async initializeToken(): Promise<TokenUpdateResponse> {
    try {
      // Check if notifications are supported and permission is granted
      if (!fcmService.isNotificationSupported()) {
        return { success: false, error: 'Push notifications not supported' };
      }

      if (!fcmService.hasPermission()) {
        const granted = await fcmService.requestPermission();
        if (!granted) {
          return { success: false, error: 'Notification permission denied' };
        }
      }

      // Get current user
      const currentUser = await authService.getCurrentUser();
      if (!currentUser) {
        return { success: false, error: 'User not authenticated' };
      }

      // Get FCM token
      const token = await fcmService.getToken();
      if (!token) {
        return { success: false, error: 'Failed to get FCM token' };
      }

      // Store token locally
      this.storeTokenLocally(token, currentUser.id);

      // Skip server sync in development (no backend API yet)
      console.log('✅ FCM token initialized and stored locally');
      
      return { success: true, token };
    } catch (error) {
      console.error('Error initializing FCM token:', error);
      return { success: false, error: 'Failed to initialize token' };
    }
  }

  /**
   * Store token locally
   */
  private storeTokenLocally(token: string, userId: string): void {
    const tokenData: FCMTokenData = {
      token,
      userId,
      userAgent: navigator.userAgent,
      createdAt: Date.now(),
      lastUsedAt: Date.now(),
      isActive: true
    };

    localStorage.setItem(this.TOKEN_STORAGE_KEY, JSON.stringify(tokenData));
  }

  /**
   * Get stored token data
   */
  getStoredToken(): FCMTokenData | null {
    try {
      const stored = localStorage.getItem(this.TOKEN_STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Error getting stored token:', error);
      return null;
    }
  }

  /**
   * Update token on server
   */
  private async updateTokenOnServer(token: string, userId: string): Promise<TokenUpdateResponse> {
    try {
      // This would typically make an API call to your backend
      // For now, we'll simulate the API call
      
      const response = await fetch('/api/fcm/tokens', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`
        },
        body: JSON.stringify({
          token,
          userId,
          userAgent: navigator.userAgent,
          platform: 'web'
        })
      });

      if (!response.ok) {
        // In development, this is expected - no backend server
        if (response.status === 404) {
          console.log('ℹ️ Backend API not found - using local storage only');
          return { success: false, error: 'Backend not available' };
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      await response.json(); // Consume the response but don't use the result
      return { success: true, token };
    } catch (error) {
      // Don't log errors for expected 404 in development
      if (error instanceof Error && error.message.includes('404')) {
        console.log('ℹ️ Backend API not available - using local storage only');
      } else {
        console.error('Error updating token on server:', error);
      }
      return { success: false, error: 'Failed to update token on server' };
    }
  }

  /**
   * Get auth token for API calls
   */
  private async getAuthToken(): Promise<string> {
    try {
      // Use authStorage methods to get token
      return authStorage.getToken() || '';
    } catch (error) {
      console.error('Error getting auth token:', error);
      return '';
    }
  }

  /**
   * Remove token from server and local storage
   */
  async removeToken(): Promise<boolean> {
    try {
      const storedToken = this.getStoredToken();
      if (!storedToken) {
        return true;
      }

      // Delete token from server
      try {
        const response = await fetch(`/api/fcm/tokens/${storedToken.token}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${await this.getAuthToken()}`
          }
        });

        if (!response.ok) {
          console.warn('Failed to delete token from server');
        }
      } catch (error) {
        console.warn('Error deleting token from server:', error);
      }

      // Delete from Firebase
      await fcmService.deleteToken();

      // Remove from local storage
      localStorage.removeItem(this.TOKEN_STORAGE_KEY);

      return true;
    } catch (error) {
      console.error('Error removing token:', error);
      return false;
    }
  }

  /**
   * Check if token needs update
   */
  shouldUpdateToken(): boolean {
    const storedToken = this.getStoredToken();
    if (!storedToken) {
      return true;
    }

    const now = Date.now();
    const timeSinceUpdate = now - storedToken.lastUsedAt;
    
    return timeSinceUpdate > this.TOKEN_UPDATE_INTERVAL;
  }

  /**
   * Refresh token if needed
   */
  async refreshTokenIfNeeded(): Promise<TokenUpdateResponse> {
    if (!this.shouldUpdateToken()) {
      const storedToken = this.getStoredToken();
      return { success: true, token: storedToken?.token };
    }

    return this.initializeToken();
  }

  /**
   * Get all tokens for current user (from server)
   */
  async getUserTokens(): Promise<FCMTokenData[]> {
    try {
      const currentUser = await authService.getCurrentUser();
      if (!currentUser) {
        return [];
      }

      const response = await fetch(`/api/fcm/tokens/user/${currentUser.id}`, {
        headers: {
          'Authorization': `Bearer ${await this.getAuthToken()}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting user tokens:', error);
      return [];
    }
  }

  /**
   * Send notification to specific user
   */
  async sendNotificationToUser(
    userId: string,
    title: string,
    body: string,
    data?: Record<string, any>
  ): Promise<boolean> {
    try {
      const response = await fetch('/api/fcm/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`
        },
        body: JSON.stringify({
          userId,
          notification: {
            title,
            body,
            icon: '/favicon.ico'
          },
          data: {
            ...data,
            userId,
            timestamp: Date.now()
          }
        })
      });

      return response.ok;
    } catch (error) {
      console.error('Error sending notification:', error);
      return false;
    }
  }

  /**
   * Send notification to multiple users
   */
  async sendNotificationToUsers(
    userIds: string[],
    title: string,
    body: string,
    data?: Record<string, any>
  ): Promise<boolean> {
    try {
      const response = await fetch('/api/fcm/send-bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`
        },
        body: JSON.stringify({
          userIds,
          notification: {
            title,
            body,
            icon: '/favicon.ico'
          },
          data: {
            ...data,
            timestamp: Date.now()
          }
        })
      });

      return response.ok;
    } catch (error) {
      console.error('Error sending bulk notification:', error);
      return false;
    }
  }
}

// Export singleton instance
export const fcmTokenService = new FCMTokenService();
export default fcmTokenService;
