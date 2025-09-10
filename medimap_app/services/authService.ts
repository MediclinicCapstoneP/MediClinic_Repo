import { supabase } from '../lib/supabase';
import type { InsertTables, Tables } from '../lib/supabase';

export interface CurrentUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  dateOfBirth?: string;
  address?: string;
  emergencyContact?: string;
  bloodType?: string;
  allergies?: string;
  medications?: string;
  medicalConditions?: string;
}

interface SignUpData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

interface SignInData {
  email: string;
  password: string;
}

interface AuthResult {
  success: boolean;
  error?: string;
  user?: CurrentUser;
}

class AuthService {
  async patientSignUp(data: SignUpData): Promise<AuthResult> {
    try {
      // First, create the auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            first_name: data.firstName,
            last_name: data.lastName,
          },
        },
      });

      if (authError) {
        return {
          success: false,
          error: authError.message,
        };
      }

      if (!authData.user) {
        return {
          success: false,
          error: 'Failed to create user account',
        };
      }

      // Create patient profile
      const patientData: InsertTables<'patients'> = {
        user_id: authData.user.id,
        first_name: data.firstName,
        last_name: data.lastName,
        email: data.email,
      };

      const { error: profileError } = await supabase
        .from('patients')
        .insert([patientData]);

      if (profileError) {
        // If profile creation fails, we should clean up the auth user
        // But for now, we'll just log the error and continue
        console.error('Failed to create patient profile:', profileError);
      }

      return {
        success: true,
      };
    } catch (error) {
      console.error('Sign up error:', error);
      return {
        success: false,
        error: 'An unexpected error occurred during sign up',
      };
    }
  }

  async patientSignIn(data: SignInData): Promise<AuthResult> {
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (authError) {
        return {
          success: false,
          error: authError.message,
        };
      }

      if (!authData.user) {
        return {
          success: false,
          error: 'Authentication failed',
        };
      }

      const currentUser = await this.getCurrentUser();
      
      return {
        success: true,
        user: currentUser || undefined,
      };
    } catch (error) {
      console.error('Sign in error:', error);
      return {
        success: false,
        error: 'An unexpected error occurred during sign in',
      };
    }
  }

  async getCurrentUser(): Promise<CurrentUser | null> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        return null;
      }

      // Get patient profile data
      const { data: patientData, error } = await supabase
        .from('patients')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      if (error) {
        console.error('Error fetching patient profile:', error);
        return null;
      }

      if (!patientData) {
        return null;
      }

      return {
        id: patientData.id,
        email: patientData.email,
        firstName: patientData.first_name,
        lastName: patientData.last_name,
        phone: patientData.phone || undefined,
        dateOfBirth: patientData.date_of_birth || undefined,
        address: patientData.address || undefined,
        emergencyContact: patientData.emergency_contact || undefined,
        bloodType: patientData.blood_type || undefined,
        allergies: patientData.allergies || undefined,
        medications: patientData.medications || undefined,
        medicalConditions: patientData.medical_conditions || undefined,
      };
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  async signOut(): Promise<void> {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Sign out error:', error);
      }
    } catch (error) {
      console.error('Sign out error:', error);
    }
  }

  async resetPassword(email: string): Promise<AuthResult> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'your-app://reset-password', // This should be your app's deep link
      });

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
      };
    } catch (error) {
      console.error('Password reset error:', error);
      return {
        success: false,
        error: 'An unexpected error occurred',
      };
    }
  }

  onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback);
  }

  async getSession() {
    return await supabase.auth.getSession();
  }
}

export const authService = new AuthService();
