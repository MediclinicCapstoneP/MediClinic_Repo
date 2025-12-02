import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../supabaseClient';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { User } from '../types';
import { sessionManager } from '../utils/sessionManager';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, role: 'patient' | 'clinic') => Promise<void>;
  logout: () => void;
  loading: boolean;
  supabaseUser: SupabaseUser | null;
  switchRole: (role: 'patient' | 'clinic') => Promise<void>;
  availableRoles: string[];
  fetchUserProfile: (userId: string) => Promise<void>;
  fetchAvailableRoles: (userId: string) => Promise<string[]>;
  error: Error | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Session storage keys for browser-specific session management
 * Using sessionStorage instead of localStorage to support multiple browser sessions
 */
const SESSION_KEYS = {
  activeRole: "mediclinic_active_role",
  sessionCache: "mediclinic_session_cache",
};

/**
 * Utility: save session to sessionStorage (browser-specific)
 */
const saveSessionToCache = (session: any | null) => {
  try {
    if (!session) {
      sessionStorage.removeItem(SESSION_KEYS.sessionCache);
      return;
    }
    sessionStorage.setItem(SESSION_KEYS.sessionCache, JSON.stringify(session));
  } catch (err) {
    console.warn("Failed to cache session:", err);
  }
};

const loadSessionFromCache = (): any | null => {
  try {
    const raw = sessionStorage.getItem(SESSION_KEYS.sessionCache);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) {
    console.warn("Failed to read cached session:", err);
    return null;
  }
};

const saveActiveRoleToSession = (role: 'patient' | 'clinic' | null) => {
  try {
    if (!role) {
      sessionStorage.removeItem(SESSION_KEYS.activeRole);
    } else {
      sessionStorage.setItem(SESSION_KEYS.activeRole, role);
    }
  } catch (err) {
    console.warn("Failed to persist active role:", err);
  }
};

const loadActiveRoleFromSession = (): 'patient' | 'clinic' | null => {
  try {
    const raw = sessionStorage.getItem(SESSION_KEYS.activeRole);
    if (!raw) return null;
    return raw as 'patient' | 'clinic';
  } catch {
    return null;
  }
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [availableRoles, setAvailableRoles] = useState<string[]>([]);
  const [error, setError] = useState<Error | null>(null);
  const [initializing, setInitializing] = useState(true);

  // Add timeout to prevent infinite loading
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (loading || initializing) {
        console.warn('[Auth] Initialization timeout - forcing loading to false');
        setLoading(false);
        setInitializing(false);
        // Don't clear user state on timeout - let the session check handle it
      }
    }, 15000); // Increased to 15 seconds

    return () => clearTimeout(timeout);
  }, [loading, initializing]);

  // Use ref to avoid dependency loops
  const supabaseUserRef = useRef<SupabaseUser | null>(null);

  // Update ref when supabaseUser changes
  useEffect(() => {
    supabaseUserRef.current = supabaseUser;
  }, [supabaseUser]);

  const fetchUserProfile = useCallback(async (userId: string) => {
    try {
      console.log('[Auth] Fetching user profile for user ID:', userId);

      // Run both queries in parallel with timeout
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Profile fetch timeout')), 20000)
      );

      const [patientRes, clinicRes] = await Promise.race([
        Promise.all([
          supabase.from('patients').select('*').eq('user_id', userId).maybeSingle(),
          supabase.from('clinics').select('*').eq('user_id', userId).maybeSingle(),
        ]),
        timeoutPromise
      ]) as [any, any];

      // If both exist, choose active role from sessionStorage or default to first
      const roles: ('patient' | 'clinic')[] = [];
      if (patientRes?.data) roles.push('patient');
      if (clinicRes?.data) roles.push('clinic');

      setAvailableRoles(roles);

      // Determine active role: prefer sessionStorage, otherwise first available
      const persisted = loadActiveRoleFromSession();
      let activeRole: 'patient' | 'clinic' | undefined;
      if (persisted && roles.includes(persisted)) {
        activeRole = persisted;
      } else if (roles.length > 0) {
        activeRole = roles[0];
        saveActiveRoleToSession(activeRole);
      }

      // Build user profile depending on role
      if (activeRole === 'patient' && patientRes?.data) {
        const p = patientRes.data;
        setUser({
          id: userId,
          email: p.email ?? supabaseUserRef.current?.email ?? '',
          role: 'patient',
          createdAt: p.created_at ?? null,
        });
        console.log('[Auth] Patient profile set:', p);
        return;
      }

      if (activeRole === 'clinic' && clinicRes?.data) {
        const c = clinicRes.data;
        setUser({
          id: userId,
          email: c.email ?? supabaseUserRef.current?.email ?? '',
          role: 'clinic',
          createdAt: c.created_at ?? null,
        });
        console.log('[Auth] Clinic profile set:', c);
        return;
      }

      // No profile found: create a minimal fallback user
      console.warn('[Auth] No profile found; creating minimal fallback user');
      setUser({
        id: userId,
        email: supabaseUserRef.current?.email ?? '',
        role: (roles.includes('patient') ? 'patient' : roles[0]) ?? 'patient',
        createdAt: new Date().toISOString(),
      });
    } catch (err: any) {
      console.error('[Auth] fetchUserProfile error', err);
      // Create fallback user even on error to prevent redirect loop
      const fallbackUser = {
        id: userId,
        email: supabaseUserRef.current?.email ?? '',
        role: 'patient' as const, // Default to patient on error
        createdAt: new Date().toISOString(),
      };
      console.log('[Auth] Creating fallback user due to error:', fallbackUser);
      setUser(fallbackUser);
      setError(err instanceof Error ? err : new Error(String(err)));
    }
  }, []); // Remove supabaseUser dependency

  const fetchAvailableRoles = useCallback(async (userId: string) => {
    try {
      console.log('[Auth] Fetching available roles for user ID:', userId);

      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Roles fetch timeout')), 15000)
      );

      const [patientRes, clinicRes] = await Promise.race([
        Promise.all([
          supabase.from('patients').select('id').eq('user_id', userId).maybeSingle(),
          supabase.from('clinics').select('id').eq('user_id', userId).maybeSingle(),
        ]),
        timeoutPromise
      ]) as [any, any];

      const roles: ('patient' | 'clinic')[] = [];
      if (patientRes?.data) roles.push('patient');
      if (clinicRes?.data) roles.push('clinic');

      setAvailableRoles(roles);
      console.log('[Auth] Available roles set:', roles);
      return roles;
    } catch (err: any) {
      console.error('[Auth] fetchAvailableRoles error', err);
      // Default to patient role on error to prevent issues
      const defaultRoles = ['patient'];
      setAvailableRoles(defaultRoles);
      console.log('[Auth] Using default roles due to error:', defaultRoles);
      return defaultRoles;
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const { error, data } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Update cache if session present
      const session = data?.session ?? null;
      saveSessionToCache(session);
      if (session?.user) {
        setSupabaseUser(session.user);
        sessionManager.setCurrentUserId(session.user.id);
        // fetch profile + roles
        await Promise.all([
          fetchUserProfile(session.user.id),
          fetchAvailableRoles(session.user.id),
        ]);
      }
    } catch (err: any) {
      console.error('[Auth] login error', err);
      setError(err instanceof Error ? err : new Error(String(err)));
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchUserProfile, fetchAvailableRoles]);

  const register = useCallback(async (email: string, password: string, role: 'patient' | 'clinic') => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;
      if (!data?.user) {
        throw new Error('No user returned from supabase signUp');
      }

      // Create role-specific profile row
      if (role === 'patient') {
        const { error: pErr } = await supabase.from('patients').insert({
          user_id: data.user.id,
          first_name: '',
          last_name: '',
          email,
        });
        if (pErr) throw pErr;
      } else {
        const { error: cErr } = await supabase.from('clinics').insert({
          user_id: data.user.id,
          clinic_name: '',
          email,
        });
        if (cErr) throw cErr;
      }

      // Note: Supabase will usually send confirmation email if enabled.
      // We'll cache session if available
      const session = data.session ?? null;
      saveSessionToCache(session);
    } catch (err: any) {
      console.error('[Auth] register error', err);
      setError(err instanceof Error ? err : new Error(String(err)));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    console.log('[Auth] Starting logout process');
    setLoading(true);
    setError(null);
    
    try {
      // Clear local state first to prevent loading loops
      setSupabaseUser(null);
      setUser(null);
      setAvailableRoles([]);
      sessionManager.setCurrentUserId(null);
      
      // Clear session storage
      saveSessionToCache(null);
      saveActiveRoleToSession(null);
      
      // Then sign out from Supabase
      await supabase.auth.signOut();
      
      console.log('[Auth] Logout completed successfully');
    } catch (err: any) {
      console.error('[Auth] logout error', err);
      setError(err instanceof Error ? err : new Error(String(err)));
      // Even if signOut fails, ensure local state is cleared
      setSupabaseUser(null);
      setUser(null);
      setAvailableRoles([]);
      sessionManager.setCurrentUserId(null);
      saveSessionToCache(null);
      saveActiveRoleToSession(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const switchRole = useCallback(async (role: 'patient' | 'clinic') => {
    if (!supabaseUser) throw new Error('No user signed in');
    if (!availableRoles.includes(role))
      throw new Error(`User does not have a '${role}' profile`);

    setLoading(true);
    try {
      // Persist locally
      saveActiveRoleToSession(role);

      // Update local user object
      setUser((prev) =>
        prev
          ? {
              ...prev,
              role,
            }
          : prev
      );
    } catch (err: any) {
      console.error('[Auth] switchRole error', err);
      setError(err instanceof Error ? err : new Error(String(err)));
      throw err;
    } finally {
      setLoading(false);
    }
  }, [availableRoles, supabaseUser]);

  useEffect(() => {
    let mounted = true;
    let authSubscription: { unsubscribe: () => void } | null = null;
    let refreshInterval: number | null = null;

    (async () => {
      try {
        // 1) Load cached session quickly to speed up initial render
        const cached = loadSessionFromCache();
        if (cached?.user && mounted) {
          setSupabaseUser(cached.user as SupabaseUser);
          sessionManager.setCurrentUserId(cached.user.id);
        }

        // 2) Ask Supabase for the canonical current session
        const { data } = await supabase.auth.getSession();
        const session = data.session;
        saveSessionToCache(session ?? null);

        if (session?.user && mounted) {
          setSupabaseUser(session.user);
          sessionManager.setCurrentUserId(session.user.id);
          // fetch profile + roles in parallel with error handling
          try {
            await Promise.all([
              fetchUserProfile(session.user.id),
              fetchAvailableRoles(session.user.id),
            ]);
          } catch (profileErr) {
            console.error('[Auth] Error fetching profile/roles:', profileErr);
            // Continue even if profile fetching fails
            setError(profileErr instanceof Error ? profileErr : new Error(String(profileErr)));
          }
        } else if (mounted) {
          // no session
          setSupabaseUser(null);
          setUser(null);
          setAvailableRoles([]);
          sessionManager.setCurrentUserId(null);
        }
      } catch (err) {
        console.error('[Auth] Initialization error', err);
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        if (mounted) {
          setLoading(false);
          setInitializing(false);
        }
      }

      // 3) Subscribe to auth state changes
      const { subscription } = supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('[Auth] onAuthStateChange', event, 'loading:', loading);
        try {
          if (event === 'SIGNED_OUT') {
            console.log('[Auth] Handling SIGNED_OUT event');
            saveSessionToCache(null);
            saveActiveRoleToSession(null);
            setSupabaseUser(null);
            setUser(null);
            setAvailableRoles([]);
            sessionManager.setCurrentUserId(null);
            setLoading(false);
            return;
          }

          // For SIGNED_IN / TOKEN_REFRESHED / INITIAL_SESSION
          if (session?.user) {
            console.log('[Auth] Setting user from session change');
            saveSessionToCache(session);
            setSupabaseUser(session.user);
            sessionManager.setCurrentUserId(session.user.id);
            // Refresh profile + roles with error handling
            try {
              await Promise.all([
                fetchUserProfile(session.user.id),
                fetchAvailableRoles(session.user.id),
              ]);
            } catch (profileErr) {
              console.error('[Auth] Error fetching profile/roles in state change:', profileErr);
              setError(profileErr instanceof Error ? profileErr : new Error(String(profileErr)));
            }
          } else {
            // no user in session
            console.log('[Auth] No user in session, clearing state');
            setSupabaseUser(null);
            setUser(null);
            setAvailableRoles([]);
            sessionManager.setCurrentUserId(null);
          }
        } catch (err) {
          console.error('[Auth] auth state change handler error', err);
          setError(err instanceof Error ? err : new Error(String(err)));
        } finally {
          setLoading(false);
        }
      }).data;
      
      authSubscription = subscription;

      // 4) Setup periodic session re-validation (every 4 minutes)
      refreshInterval = window.setInterval(async () => {
        if (!mounted || loading) return; // Skip if component is unmounted or loading
        
        try {
          const { data } = await supabase.auth.getSession();
          const session = data.session;
          // If session changed, update cache and states
          const cached = loadSessionFromCache();
          const cachedToken = cached?.access_token ?? null;
          const newToken = session?.access_token ?? null;
          if (newToken !== cachedToken) {
            console.log('[Auth] Session token changed, updating state');
            saveSessionToCache(session ?? null);
            if (session?.user) {
              setSupabaseUser(session.user);
              sessionManager.setCurrentUserId(session.user.id);
              // keep profile in sync
              await Promise.all([
                fetchUserProfile(session.user.id),
                fetchAvailableRoles(session.user.id),
              ]);
            } else {
              setSupabaseUser(null);
              setUser(null);
              setAvailableRoles([]);
              sessionManager.setCurrentUserId(null);
            }
          }
        } catch (err) {
          console.warn('[Auth] periodic session check failed', err);
        }
      }, 1000 * 60 * 4); // every 4 minutes

    })();

    return () => {
      mounted = false;
      try {
        authSubscription?.unsubscribe();
      } catch {}
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [fetchUserProfile, fetchAvailableRoles]);

  const value = {
    user,
    login,
    register,
    logout,
    loading,
    supabaseUser,
    switchRole,
    availableRoles,
    fetchUserProfile,
    fetchAvailableRoles,
    error,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
