import { supabase } from '../supabaseClient';

export class SessionManager {
  private static instance: SessionManager;
  private currentUserId: string | null = null;
  private sessionCheckInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.startSessionMonitoring();
  }

  static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }

  private startSessionMonitoring() {
    // Check session every 30 seconds
    this.sessionCheckInterval = setInterval(async () => {
      await this.validateCurrentSession();
    }, 30000);
  }

  private async validateCurrentSession() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Session validation error:', error);
        return;
      }

      const currentSessionUserId = session?.user?.id || null;
      
      // If session user changed unexpectedly, handle it
      if (this.currentUserId && currentSessionUserId && this.currentUserId !== currentSessionUserId) {
        console.warn('Session user changed unexpectedly:', {
          previous: this.currentUserId,
          current: currentSessionUserId
        });
        this.handleSessionConflict();
      }
      
      this.currentUserId = currentSessionUserId;
    } catch (error) {
      console.error('Session check failed:', error);
    }
  }

  private handleSessionConflict() {
    // Clear local state and force re-authentication
    console.log('Handling session conflict - clearing local state');
    this.currentUserId = null;
    
    // Force page reload to reinitialize auth
    window.location.reload();
  }

  setCurrentUserId(userId: string | null) {
    this.currentUserId = userId;
  }

  getCurrentUserId(): string | null {
    return this.currentUserId;
  }

  cleanup() {
    if (this.sessionCheckInterval) {
      clearInterval(this.sessionCheckInterval);
      this.sessionCheckInterval = null;
    }
  }
}

export const sessionManager = SessionManager.getInstance();
