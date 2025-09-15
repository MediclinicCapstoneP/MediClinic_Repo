/**
 * Connection Manager for Supabase Real-time WebSocket connections
 * Handles connection state, reconnection logic, and prevents connection spam
 */

import { supabase } from '../supabaseClient';

export class ConnectionManager {
  private static instance: ConnectionManager;
  private connectionState: 'disconnected' | 'connecting' | 'connected' | 'error' = 'disconnected';
  private reconnectionTimer: NodeJS.Timeout | null = null;
  private healthCheckTimer: NodeJS.Timeout | null = null;
  private lastConnectionAttempt = 0;
  private readonly minReconnectionDelay = 2000; // 2 seconds
  private readonly maxReconnectionDelay = 30000; // 30 seconds
  private readonly healthCheckInterval = 15000; // 15 seconds
  private reconnectionAttempts = 0;
  private readonly maxReconnectionAttempts = 8;

  private constructor() {}

  static getInstance(): ConnectionManager {
    if (!ConnectionManager.instance) {
      ConnectionManager.instance = new ConnectionManager();
    }
    return ConnectionManager.instance;
  }

  /**
   * Get current connection state
   */
  getConnectionState(): 'disconnected' | 'connecting' | 'connected' | 'error' {
    return this.connectionState;
  }

  /**
   * Check if we can attempt a new connection
   */
  canAttemptConnection(): boolean {
    const now = Date.now();
    const timeSinceLastAttempt = now - this.lastConnectionAttempt;
    return timeSinceLastAttempt >= this.minReconnectionDelay;
  }

  /**
   * Test database connectivity
   */
  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🔍 Testing database connection...');
      const { error } = await supabase
        .from('notifications')
        .select('count', { count: 'exact', head: true });

      if (error) {
        console.error('❌ Database connection test failed:', error);
        this.connectionState = 'error';
        return { success: false, error: error.message };
      }

      console.log('✅ Database connection test successful');
      return { success: true };
    } catch (error) {
      console.error('❌ Database connection test error:', error);
      this.connectionState = 'error';
      return { success: false, error: String(error) };
    }
  }

  /**
   * Initialize connection manager
   */
  async initialize(): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🚀 Initializing Connection Manager...');
      
      // Test basic connectivity first
      const testResult = await this.testConnection();
      if (!testResult.success) {
        return testResult;
      }

      // Start health check
      this.startHealthCheck();

      this.connectionState = 'connected';
      this.reconnectionAttempts = 0;

      console.log('✅ Connection Manager initialized successfully');
      return { success: true };
    } catch (error) {
      console.error('❌ Connection Manager initialization failed:', error);
      this.connectionState = 'error';
      return { success: false, error: String(error) };
    }
  }

  /**
   * Start periodic health checks
   */
  private startHealthCheck(): void {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
    }

    this.healthCheckTimer = setInterval(async () => {
      if (this.connectionState === 'connected') {
        const healthCheck = await this.testConnection();
        if (!healthCheck.success) {
          console.warn('🏥 Health check failed, marking connection as error');
          this.connectionState = 'error';
          this.scheduleReconnection();
        }
      }
    }, this.healthCheckInterval);
  }

  /**
   * Stop health checks
   */
  private stopHealthCheck(): void {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = null;
    }
  }

  /**
   * Schedule a reconnection attempt with exponential backoff
   */
  scheduleReconnection(): void {
    if (this.reconnectionTimer || this.reconnectionAttempts >= this.maxReconnectionAttempts) {
      return;
    }

    const delay = Math.min(
      this.minReconnectionDelay * Math.pow(2, this.reconnectionAttempts),
      this.maxReconnectionDelay
    );

    console.log(`📅 Scheduling reconnection attempt ${this.reconnectionAttempts + 1}/${this.maxReconnectionAttempts} in ${delay}ms`);

    this.reconnectionTimer = setTimeout(async () => {
      this.reconnectionTimer = null;
      this.reconnectionAttempts++;
      
      const result = await this.initialize();
      if (!result.success && this.reconnectionAttempts < this.maxReconnectionAttempts) {
        this.scheduleReconnection();
      } else if (!result.success) {
        console.error('❌ Max reconnection attempts reached, giving up');
        this.connectionState = 'error';
      }
    }, delay);
  }

  /**
   * Force a reconnection
   */
  async forceReconnection(): Promise<{ success: boolean; error?: string }> {
    console.log('🔄 Forcing reconnection...');
    
    // Clear any pending reconnection
    if (this.reconnectionTimer) {
      clearTimeout(this.reconnectionTimer);
      this.reconnectionTimer = null;
    }

    // Reset state
    this.connectionState = 'disconnected';
    this.reconnectionAttempts = 0;

    // Attempt to reconnect
    return await this.initialize();
  }

  /**
   * Mark connection as failed
   */
  markConnectionFailed(error?: string): void {
    console.error('💥 Connection marked as failed:', error);
    this.connectionState = 'error';
    this.scheduleReconnection();
  }

  /**
   * Mark connection as successful
   */
  markConnectionSuccessful(): void {
    console.log('✅ Connection marked as successful');
    this.connectionState = 'connected';
    this.reconnectionAttempts = 0;
    this.lastConnectionAttempt = Date.now();

    // Clear any pending reconnection
    if (this.reconnectionTimer) {
      clearTimeout(this.reconnectionTimer);
      this.reconnectionTimer = null;
    }
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    console.log('🧹 Cleaning up Connection Manager...');
    
    if (this.reconnectionTimer) {
      clearTimeout(this.reconnectionTimer);
      this.reconnectionTimer = null;
    }

    this.stopHealthCheck();
    this.connectionState = 'disconnected';
  }

  /**
   * Get connection statistics
   */
  getStats(): {
    state: string;
    reconnectionAttempts: number;
    maxReconnectionAttempts: number;
    lastAttempt: number;
    canAttempt: boolean;
  } {
    return {
      state: this.connectionState,
      reconnectionAttempts: this.reconnectionAttempts,
      maxReconnectionAttempts: this.maxReconnectionAttempts,
      lastAttempt: this.lastConnectionAttempt,
      canAttempt: this.canAttemptConnection()
    };
  }
}

export default ConnectionManager;