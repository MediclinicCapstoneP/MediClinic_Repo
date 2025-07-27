import { supabase } from '../../../supabaseClient';
import { patientService } from './patientService';
import { clinicService } from './clinicService';

export interface AuthUser {
  id: string;
  email: string;
  role: 'patient' | 'clinic';
  firstName?: string;
  lastName?: string;
  clinicName?: string;
}

export interface SignUpData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'patient' | 'clinic';
  clinicName?: string;
}

export interface SignInData {
  email: string;
  password: string;
}

// Validation functions
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateSignUpData = (data: SignUpData): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!data.firstName.trim()) {
    errors.push('First name is required');
  }
  
  if (!data.lastName.trim()) {
    errors.push('Last name is required');
  }
  
  if (!validateEmail(data.email)) {
    errors.push('Please enter a valid email address');
  }
  
  const passwordValidation = validatePassword(data.password);
  if (!passwordValidation.isValid) {
    errors.push(...passwordValidation.errors);
  }
  
  if (data.role === 'clinic' && !data.clinicName?.trim()) {
    errors.push('Clinic name is required');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Auth service functions
export const authService = {
  // Get current user
  async getCurrentUser(): Promise<AuthUser | null> {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error || !user) {
        return null;
      }
      
      const userData = user.user_metadata;
      return {
        id: user.id,
        email: user.email!,
        role: userData.role || 'patient',
        firstName: userData.first_name,
        lastName: userData.last_name,
        clinicName: userData.clinic_name,
      };
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  },

  // Sign up
  async signUp(data: SignUpData): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            first_name: data.firstName,
            last_name: data.lastName,
            role: data.role,
            clinic_name: data.clinicName,
          }
        }
      });

      if (error) {
        return { success: false, error: error.message };
      }

      // If user registration is successful and it's a patient, create patient profile
      if (authData.user && data.role === 'patient') {
        const patientResult = await patientService.createPatient({
          user_id: authData.user.id,
          first_name: data.firstName,
          last_name: data.lastName,
          email: data.email,
        });

        if (!patientResult.success) {
          // If patient profile creation fails, we should handle this appropriately
          console.error('Failed to create patient profile:', patientResult.error);
          // Note: We don't return error here because the user account was created successfully
          // The patient profile can be created later when they first log in
        }
      }

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sign up failed';
      return { success: false, error: errorMessage };
    }
  },

  // Clinic sign up
  async clinicSignUp(clinicData: any): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: authData, error } = await supabase.auth.signUp({
        email: clinicData.email,
        password: clinicData.password,
        options: {
          data: {
            clinic_name: clinicData.clinicName,
            role: 'clinic',
          }
        }
      });

      if (error) {
        return { success: false, error: error.message };
      }

      // If user registration is successful, create clinic profile
      if (authData.user) {
        const clinicResult = await clinicService.createClinic({
          user_id: authData.user.id,
          clinic_name: clinicData.clinicName,
          email: clinicData.email,
          phone: clinicData.phone,
          website: clinicData.website,
          address: clinicData.address,
          city: clinicData.city,
          state: clinicData.state,
          zip_code: clinicData.zipCode,
          license_number: clinicData.license,
          accreditation: clinicData.accreditation,
          tax_id: clinicData.taxId,
          year_established: clinicData.yearEstablished ? parseInt(clinicData.yearEstablished) : undefined,
          specialties: clinicData.specialties,
          custom_specialties: clinicData.customSpecialties,
          services: clinicData.services,
          custom_services: clinicData.customServices,
          operating_hours: clinicData.operatingHours,
          number_of_doctors: clinicData.numberOfDoctors ? parseInt(clinicData.numberOfDoctors) : undefined,
          number_of_staff: clinicData.numberOfStaff ? parseInt(clinicData.numberOfStaff) : undefined,
          description: clinicData.description,
        });

        if (!clinicResult.success) {
          console.error('Failed to create clinic profile:', clinicResult.error);
          // Note: We don't return error here because the user account was created successfully
          // The clinic profile can be created later when they first log in
        }
      }

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Clinic sign up failed';
      return { success: false, error: errorMessage };
    }
  },

  // Sign in
  async signIn(data: SignInData): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      // Check if email is verified
      if (authData.user && !authData.user.email_confirmed_at) {
        return { 
          success: false, 
          error: 'Please verify your email address before signing in. Check your inbox for a verification link.' 
        };
      }

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sign in failed';
      return { success: false, error: errorMessage };
    }
  },

  // Sign out
  async signOut(): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sign out failed';
      return { success: false, error: errorMessage };
    }
  },

  // Reset password
  async resetPassword(email: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Password reset failed';
      return { success: false, error: errorMessage };
    }
  },

  // Resend verification email
  async resendVerificationEmail(email: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        }
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to resend verification email';
      return { success: false, error: errorMessage };
    }
  },

  // Update user profile
  async updateProfile(userId: string, updates: Partial<AuthUser>): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          first_name: updates.firstName,
          last_name: updates.lastName,
          role: updates.role,
          clinic_name: updates.clinicName,
        }
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Profile update failed';
      return { success: false, error: errorMessage };
    }
  },

  // Check if user is authenticated
  async isAuthenticated(): Promise<boolean> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      return !!session;
    } catch (error) {
      return false;
    }
  },

  // Get user role
  async getUserRole(): Promise<'patient' | 'clinic' | null> {
    try {
      const user = await this.getCurrentUser();
      return user?.role || null;
    } catch (error) {
      return null;
    }
  },
};

// Helper functions for role-based access
export const hasRole = (user: AuthUser | null, requiredRole: 'patient' | 'clinic'): boolean => {
  return user?.role === requiredRole;
};

export const isPatient = (user: AuthUser | null): boolean => {
  return hasRole(user, 'patient');
};

export const isClinic = (user: AuthUser | null): boolean => {
  return hasRole(user, 'clinic');
};

// Storage helpers
export const authStorage = {
  setToken: (token: string) => {
    localStorage.setItem('auth_token', token);
  },
  
  getToken: (): string | null => {
    return localStorage.getItem('auth_token');
  },
  
  removeToken: () => {
    localStorage.removeItem('auth_token');
  },
  
  setUser: (user: AuthUser) => {
    localStorage.setItem('auth_user', JSON.stringify(user));
  },
  
  getUser: (): AuthUser | null => {
    const userStr = localStorage.getItem('auth_user');
    return userStr ? JSON.parse(userStr) : null;
  },
  
  removeUser: () => {
    localStorage.removeItem('auth_user');
  },
  
  clear: () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
  },
}; 