import { supabase, UserRole, UserMetadata, Patient, Clinic, Doctor } from '@/lib/supabase';

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  profile: { role: UserRole; data: Patient | Clinic | Doctor } | null;
}

class AuthService {
  // Sign up for patients only (doctors are created by clinics)
  async signUp(email: string, password: string, role: UserRole, profileData: any) {
    try {
      // Only allow patient registration
      if (role !== 'patient') {
        throw new Error('Only patients can register. Doctors and clinics must be created by administrators.');
      }

      // Create auth user with metadata
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role: 'patient',
            profile_completed: true,
          } as UserMetadata,
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Failed to create user');

      // Create patient profile
      const { error: profileError } = await supabase
        .from('patients')
        .insert({
          user_id: authData.user.id,
          first_name: profileData.firstName,
          last_name: profileData.lastName,
          email: email,
          phone: profileData.phone,
          date_of_birth: profileData.dateOfBirth,
        });

      if (profileError) {
        // Cleanup auth user if profile creation fails
        console.error('Profile creation failed:', profileError);
        throw new Error('Failed to create patient profile. Please try again.');
      }

      return { user: authData.user, session: authData.session };
    } catch (error: any) {
      console.error('Sign up error:', error);
      throw error;
    }
  }

  // Sign in with automatic role detection
  async signIn(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      if (!data.user) throw new Error('Failed to sign in');

      // Get user profile and role
      const userProfile = await this.getUserProfile(data.user.id);
      
      return {
        user: data.user,
        session: data.session,
        profile: userProfile,
      };
    } catch (error: any) {
      console.error('Sign in error:', error);
      throw error;
    }
  }

  // Get current user with profile
  async getCurrentUser(): Promise<AuthUser | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return null;

      const profile = await this.getUserProfile(user.id);
      
      return {
        id: user.id,
        email: user.email!,
        role: profile?.role || 'patient',
        profile,
      };
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  }

  // Get user profile based on role
  async getUserProfile(userId: string): Promise<{ role: UserRole; data: Patient | Clinic | Doctor } | null> {
    try {
      // Check patients table
      const { data: patientData, error: patientError } = await supabase
        .from('patients')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (patientData && !patientError) {
        return { role: 'patient', data: patientData };
      }

      // Check clinics table
      const { data: clinicData, error: clinicError } = await supabase
        .from('clinics')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (clinicData && !clinicError) {
        return { role: 'clinic', data: clinicData };
      }

      // Check doctors table
      const { data: doctorData, error: doctorError } = await supabase
        .from('doctors')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (doctorData && !doctorError) {
        return { role: 'doctor', data: doctorData };
      }

      return null;
    } catch (error) {
      console.error('Get user profile error:', error);
      return null;
    }
  }

  // Sign out
  async signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error: any) {
      console.error('Sign out error:', error);
      throw error;
    }
  }

  // Reset password
  async resetPassword(email: string) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'mediclinic://reset-password',
      });
      if (error) throw error;
    } catch (error: any) {
      console.error('Reset password error:', error);
      throw error;
    }
  }

  // Update password
  async updatePassword(newPassword: string) {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (error) throw error;
    } catch (error: any) {
      console.error('Update password error:', error);
      throw error;
    }
  }

  // Listen to auth state changes
  onAuthStateChange(callback: (user: AuthUser | null) => void) {
    return supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const profile = await this.getUserProfile(session.user.id);
        callback({
          id: session.user.id,
          email: session.user.email!,
          role: profile?.role || 'patient',
          profile,
        });
      } else {
        callback(null);
      }
    });
  }
}

export const authService = new AuthService();
