import { supabase, type Tables } from '../lib/supabase';
import { Alert } from 'react-native';

// User roles
export type UserRole = 'patient' | 'clinic' | 'doctor';

// Base authentication data
export interface BaseAuthData {
  email: string;
  password: string;
}

// Patient authentication data
export interface PatientAuthData extends BaseAuthData {
  firstName: string;
  lastName: string;
}

// Authentication result
export interface AuthResult {
  success: boolean;
  error?: string;
  user?: any;
  role?: UserRole;
  patient?: Tables<'patients'>;
}

// Current user with role
export interface CurrentUser {
  user: any;
  role: UserRole | null;
  profile?: Tables<'patients'> | Tables<'clinics'>;
}

export const authService = {
  // Get current authenticated user with role verification
  async getCurrentUser(): Promise<CurrentUser | null> {
    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error || !user) {
        console.log('No authenticated user found');
        return null;
      }

      const role = user.user_metadata?.role as UserRole;
      if (!role || !['patient', 'clinic', 'doctor'].includes(role)) {
        console.error('Invalid or missing user role:', role);
        return null;
      }

      // Get user profile based on role
      let profile = null;
      if (role === 'patient') {
        const { data } = await supabase
          .from('patients')
          .select('*')
          .eq('user_id', user.id)
          .single();
        profile = data;
      } else if (role === 'clinic') {
        const { data } = await supabase
          .from('clinics')
          .select('*')
          .eq('user_id', user.id)
          .single();
        profile = data;
      }

      return { user, role, profile };
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  },

  // Patient sign up
  async patientSignUp(data: PatientAuthData): Promise<AuthResult> {
    try {
      console.log('Patient sign up attempt for:', data.email);

      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            role: 'patient',
            first_name: data.firstName,
            last_name: data.lastName,
          },
        },
      });

      if (error) {
        console.error('Patient sign up error:', error);
        return { success: false, error: error.message };
      }

      if (!authData.user) {
        return { success: false, error: 'No user data returned' };
      }

      // Create patient profile in database
      try {
        const { data: patient, error: profileError } = await supabase
          .from('patients')
          .insert({
            user_id: authData.user.id,
            first_name: data.firstName,
            last_name: data.lastName,
            email: data.email,
            blood_type: 'O+',
            allergies: 'None',
            medications: 'None',
            medical_conditions: 'None',
          })
          .select()
          .single();

        if (profileError) {
          console.error('Failed to create patient profile:', profileError);
        }

        return { 
          success: true, 
          user: authData.user, 
          role: 'patient',
          patient: patient || undefined
        };
      } catch (error) {
        console.error('Exception during patient profile creation:', error);
        return { 
          success: true, 
          user: authData.user, 
          role: 'patient'
        };
      }
    } catch (error) {
      console.error('Exception during patient sign up:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to sign up';
      return { success: false, error: errorMessage };
    }
  },

  // Patient sign in
  async patientSignIn(data: BaseAuthData): Promise<AuthResult> {
    try {
      console.log('Patient sign in attempt for:', data.email);

      const { data: authData, error } =
        await supabase.auth.signInWithPassword({
          email: data.email,
          password: data.password,
        });

      if (error) {
        console.error('Patient sign in error:', error);
        return { success: false, error: error.message };
      }

      if (!authData.user) {
        return { success: false, error: 'No user data returned' };
      }

      // Verify this is a patient user
      if (authData.user.user_metadata?.role !== 'patient') {
        console.error(
          'User is not a patient user:',
          authData.user.user_metadata
        );
        return {
          success: false,
          error:
            'This account is not registered as a patient. Please use the appropriate sign-in form for your account type.',
        };
      }

      // Check if email is confirmed
      if (!authData.user.email_confirmed_at) {
        return {
          success: false,
          error: 'Please verify your email before signing in',
        };
      }

      // Get patient profile
      try {
        const { data: patient } = await supabase
          .from('patients')
          .select('*')
          .eq('user_id', authData.user.id)
          .single();

        return { 
          success: true, 
          user: authData.user, 
          role: 'patient',
          patient: patient || undefined
        };
      } catch (profileError) {
        console.error('Error fetching patient profile:', profileError);
        return { 
          success: true, 
          user: authData.user, 
          role: 'patient'
        };
      }
    } catch (error) {
      console.error('Exception during patient sign in:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to sign in';
      return { success: false, error: errorMessage };
    }
  },

  // Sign out
  async signOut(): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error('Error signing out:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Exception during sign out:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to sign out';
      return { success: false, error: errorMessage };
    }
  },

  // Check if user is authenticated
  async isAuthenticated(): Promise<boolean> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      return !!session;
    } catch (error) {
      console.error('Error checking authentication:', error);
      return false;
    }
  },

  // Get user session
  async getSession() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;
      return session;
    } catch (error) {
      console.error('Error getting session:', error);
      return null;
    }
  },

  // Listen to auth changes
  onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback);
  },

  // Reset password
  async resetPassword(email: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      
      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Exception during password reset:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to reset password';
      return { success: false, error: errorMessage };
    }
  },

  // Update password
  async updatePassword(newPassword: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Exception during password update:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to update password';
      return { success: false, error: errorMessage };
    }
  },

  // Show error alert
  showError(message: string) {
    Alert.alert('Error', message, [{ text: 'OK' }]);
  },

  // Show success alert
  showSuccess(message: string) {
    Alert.alert('Success', message, [{ text: 'OK' }]);
  },
};
