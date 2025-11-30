import React, { createContext, useContext, useEffect, useState } from 'react';
import { authService, AuthUser } from '../services/authService';
import { UserRole } from '../lib/supabase';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, role: UserRole, profileData: any) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    
    // Get initial session
    authService.getCurrentUser().then((currentUser) => {
      if (mounted) {
        console.log('[Mobile Auth] Initial session loaded:', currentUser?.email);
        setUser(currentUser);
        setLoading(false);
      }
    }).catch((error) => {
      console.error('Auth initialization error:', error);
      // For development - fallback to login if Supabase is not configured
      if (mounted) {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = authService.onAuthStateChange((user) => {
      if (mounted) {
        console.log('[Mobile Auth] Auth state changed:', user?.email || 'null');
        setUser(user);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const result = await authService.signIn(email, password);
      // User state will be updated by the auth state listener
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const signUp = async (email: string, password: string, role: UserRole, profileData: any) => {
    setLoading(true);
    try {
      await authService.signUp(email, password, role, profileData);
      // User state will be updated by the auth state listener
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const signOut = async () => {
    console.log('[Mobile Auth] Starting sign out');
    setLoading(true);
    try {
      // Clear user state first to prevent loading loops
      setUser(null);
      
      // Then sign out from auth service
      await authService.signOut();
      
      console.log('[Mobile Auth] Logout completed successfully');
    } catch (error) {
      console.error('[Mobile Auth] Sign out error:', error);
      // Even if signOut fails, ensure user state is cleared
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    await authService.resetPassword(email);
  };

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
