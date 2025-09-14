import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { User } from '../types';

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
  fetchAvailableRoles: (userId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

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

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setSupabaseUser(session.user);
        fetchUserProfile(session.user.id);
        fetchAvailableRoles(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change event:', event);
        if (session?.user) {
          setSupabaseUser(session.user);
          await fetchUserProfile(session.user.id);
          await fetchAvailableRoles(session.user.id);
        } else {
          setSupabaseUser(null);
          setUser(null);
          setAvailableRoles([]);
        }
        // Only set loading to false after processing is complete
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      console.log('Fetching user profile for user ID:', userId);
      
      // Try to get patient profile first
      const { data: patientProfile, error: patientError } = await supabase
        .from('patients')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (patientProfile && !patientError) {
        setUser({
          id: userId,
          email: patientProfile.email,
          role: 'patient',
          createdAt: patientProfile.created_at,
        });
        console.log('Patient profile set:', patientProfile);
        return;
      }
      
      // If no patient profile, try to get clinic profile
      const { data: clinicProfile, error: clinicError } = await supabase
        .from('clinics')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (clinicProfile && !clinicError) {
        setUser({
          id: userId,
          email: clinicProfile.email,
          role: 'clinic',
          createdAt: clinicProfile.created_at,
        });
        console.log('Clinic profile set:', clinicProfile);
        return;
      }
      
      console.log('No profile found for user ID:', userId);
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const fetchAvailableRoles = async (userId: string) => {
    try {
      console.log('Fetching available roles for user ID:', userId);
      // Fetch all profiles for this user to determine available roles
      const roles = [];
      
      // Check if user has a patient profile
      const { data: patientProfile } = await supabase
        .from('patients')
        .select('id')
        .eq('user_id', userId)
        .single();
      
      if (patientProfile) {
        roles.push('patient');
      }
      
      // Check if user has a clinic profile
      const { data: clinicProfile } = await supabase
        .from('clinics')
        .select('id')
        .eq('user_id', userId)
        .single();
      
      if (clinicProfile) {
        roles.push('clinic');
      }
      
      setAvailableRoles(roles);
      console.log('Available roles set:', roles);
    } catch (error) {
      console.error('Error fetching available roles:', error);
    }
  };

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
    } catch (error) {
      console.error('Login error:', error);
      throw new Error(error instanceof Error ? error.message : 'Login failed');
    } finally {
      // Loading state will be handled by auth state change listener
    }
  };

  const register = async (email: string, password: string, role: 'patient' | 'clinic') => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        // Create role-specific profile directly
        if (role === 'patient') {
          const { error: patientError } = await supabase
            .from('patients')
            .insert({
              user_id: data.user.id,
              first_name: '',
              last_name: '',
              email: email,
            });

          if (patientError) throw patientError;
        } else if (role === 'clinic') {
          const { error: clinicError } = await supabase
            .from('clinics')
            .insert({
              user_id: data.user.id,
              clinic_name: '',
              email: email,
            });

          if (clinicError) throw clinicError;
        }
      }
    } catch (error) {
      console.error('Registration error:', error);
      throw new Error(error instanceof Error ? error.message : 'Registration failed');
    } finally {
      // Loading state will be handled by auth state change listener
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSupabaseUser(null);
      setAvailableRoles([]);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const switchRole = async (role: 'patient' | 'clinic') => {
    if (!supabaseUser) {
      throw new Error('No user is currently signed in');
    }
    
    if (!availableRoles.includes(role)) {
      throw new Error(`User does not have a ${role} profile`);
    }
    
    setLoading(true);
    try {
      // Update the local user state
      if (user) {
        setUser({ ...user, role });
      }
    } catch (error) {
      console.error('Role switch error:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to switch role');
    } finally {
      setLoading(false);
    }
  };

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
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};