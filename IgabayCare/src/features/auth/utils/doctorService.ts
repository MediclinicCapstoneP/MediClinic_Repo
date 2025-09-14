import { supabase } from '../../../supabaseClient';

export interface DoctorProfile {
  id: string;
  user_id: string;
  clinic_id: string;
  full_name: string;
  specialization: string;
  email: string;
  phone: string | null;
  license_number: string;
  years_experience: number | null;
  availability: string | null;
  status: 'active' | 'on-leave' | 'inactive';
  rating: number;
  total_patients: number;
  profile_picture_url: string | null;
  profile_picture_path: string | null;
  // Authentication fields
  username: string | null;
  password_hash: string | null;
  is_clinic_created: boolean;
  email_verified: boolean;
  last_login: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateDoctorData {
  user_id: string;
  clinic_id: string;
  full_name: string;
  specialization: string;
  email: string;
  phone?: string;
  license_number: string;
  years_experience?: number;
  availability?: string;
  status?: 'active' | 'on-leave' | 'inactive';
  // Authentication fields for clinic-created accounts
  username?: string;
  password?: string;
  is_clinic_created?: boolean;
}

export interface UpdateDoctorData {
  full_name?: string;
  specialization?: string;
  email?: string;
  phone?: string;
  license_number?: string;
  years_experience?: number;
  availability?: string;
  status?: 'active' | 'on-leave' | 'inactive';
  profile_picture_url?: string;
  profile_picture_path?: string;
  // Authentication fields
  username?: string;
  password?: string;
}

export interface DoctorLoginData {
  email: string;
  password: string;
}

class DoctorService {
  async createDoctor(data: CreateDoctorData): Promise<{ success: boolean; error?: string; doctor?: DoctorProfile }> {
    try {
      console.log('Creating doctor with data:', data);
      
      // If this is a clinic-created account with password, create Supabase auth user first
      if (data.is_clinic_created && data.password) {
        // Create Supabase auth user using regular signup
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: data.email,
          password: data.password,
          options: {
            data: {
              role: 'doctor',
              first_name: data.first_name,
              last_name: data.last_name,
              clinic_id: data.clinic_id,
              is_clinic_created: true,
              license_number: data.license_number,
              specialization: data.specialization
            }
          }
        });

        if (authError) {
          console.error('Supabase auth error creating doctor user:', authError);
          return { success: false, error: authError.message };
        }

        if (!authData.user) {
          return { success: false, error: 'Failed to create auth user' };
        }

        // Use the created auth user's ID
        data.user_id = authData.user.id;
        
        // Note: The user will need to confirm their email before they can sign in
        // For clinic-created accounts, you might want to auto-confirm emails
        // This would require a server-side function or admin panel action
      }
      
      // Prepare doctor data for database
      let doctorData: any = { ...data };
      if (data.is_clinic_created && data.password) {
        // Hash the password for storage in doctors table as backup
        const hashedPassword = await this.hashPassword(data.password);
        doctorData.password_hash = hashedPassword;
        delete doctorData.password;
      }
      
      const { data: doctor, error } = await supabase
        .from('doctors')
        .insert([doctorData])
        .select()
        .single();

      if (error) {
        console.error('Supabase error creating doctor:', error);
        return { success: false, error: error.message };
      }

      console.log('Doctor created successfully:', doctor);
      return { success: true, doctor };
    } catch (error) {
      console.error('Error creating doctor:', error);
      return { success: false, error: 'Failed to create doctor' };
    }
  }

  async getDoctorsByClinicId(clinicId: string): Promise<{ success: boolean; error?: string; doctors?: DoctorProfile[] }> {
    try {
      console.log('Fetching doctors for clinic:', clinicId);
      
      const { data: doctors, error } = await supabase
        .from('doctors')
        .select('*')
        .eq('clinic_id', clinicId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error fetching doctors:', error);
        return { success: false, error: error.message };
      }

      console.log('Doctors fetched successfully:', doctors);
      return { success: true, doctors };
    } catch (error) {
      console.error('Error fetching doctors:', error);
      return { success: false, error: 'Failed to fetch doctors' };
    }
  }

  async getDoctorById(id: string): Promise<{ success: boolean; error?: string; doctor?: DoctorProfile }> {
    try {
      const { data: doctor, error } = await supabase
        .from('doctors')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Supabase error fetching doctor:', error);
        return { success: false, error: error.message };
      }

      return { success: true, doctor };
    } catch (error) {
      console.error('Error fetching doctor:', error);
      return { success: false, error: 'Failed to fetch doctor' };
    }
  }

  async updateDoctor(id: string, data: UpdateDoctorData): Promise<{ success: boolean; error?: string; doctor?: DoctorProfile }> {
    try {
      // If no data to update, just fetch the doctor
      if (Object.keys(data).length === 0) {
        const { data: doctor, error } = await supabase
          .from('doctors')
          .select('*')
          .eq('id', id)
          .single();

        if (error) {
          console.error('Supabase error fetching doctor:', error);
          return { success: false, error: error.message };
        }

        if (!doctor) {
          return { success: false, error: 'Doctor not found' };
        }

        return { success: true, doctor };
      }

      let updateData: any = { ...data };
      
      // If updating password, hash it
      if (data.password) {
        const hashedPassword = await this.hashPassword(data.password);
        updateData.password_hash = hashedPassword;
        delete updateData.password;
      }

      const { data: doctor, error } = await supabase
        .from('doctors')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Supabase error updating doctor:', error);
        return { success: false, error: error.message };
      }

      if (!doctor) {
        return { success: false, error: 'Doctor not found or no changes made' };
      }

      return { success: true, doctor };
    } catch (error) {
      console.error('Error updating doctor:', error);
      return { success: false, error: 'Failed to update doctor' };
    }
  }

  async deleteDoctor(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('doctors')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Supabase error deleting doctor:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error deleting doctor:', error);
      return { success: false, error: 'Failed to delete doctor' };
    }
  }

  async getAllActiveDoctors(): Promise<{ success: boolean; error?: string; doctors?: DoctorProfile[] }> {
    try {
      const { data: doctors, error } = await supabase
        .from('doctors')
        .select('*')
        .eq('status', 'active')
        .order('full_name', { ascending: true });

      if (error) {
        console.error('Supabase error fetching active doctors:', error);
        return { success: false, error: error.message };
      }

      return { success: true, doctors };
    } catch (error) {
      console.error('Error fetching active doctors:', error);
      return { success: false, error: 'Failed to fetch active doctors' };
    }
  }

  // Authentication methods for clinic-created doctor accounts
  async doctorLogin(loginData: DoctorLoginData): Promise<{ success: boolean; error?: string; doctor?: DoctorProfile }> {
    try {
      console.log('Doctor login attempt for:', loginData.email);
      
      // First, try to sign in with Supabase auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: loginData.email,
        password: loginData.password
      });

      if (authError) {
        console.error('Supabase auth error during doctor login:', authError);
        // Provide more specific error messages
        if (authError.message.includes('Invalid login credentials')) {
          return { success: false, error: 'Invalid email or password. Please check your credentials and try again.' };
        }
        if (authError.message.includes('Email not confirmed')) {
          return { success: false, error: 'Please verify your email before signing in. Check your inbox for the confirmation email.' };
        }
        return { success: false, error: authError.message };
      }

      if (!authData.user) {
        return { success: false, error: 'No user data returned' };
      }

      // Check if the user has doctor role in metadata
      const userRole = authData.user.user_metadata?.role;
      if (userRole !== 'doctor') {
        // Sign out the user since they're not a doctor
        await supabase.auth.signOut();
        return { success: false, error: 'Invalid user role' };
      }

      // Get the doctor profile from the database
      const { data: doctor, error: doctorError } = await supabase
        .from('doctors')
        .select('*')
        .eq('user_id', authData.user.id)
        .single();

      if (doctorError || !doctor) {
        console.error('Doctor profile not found:', doctorError);
        // Sign out the user since we can't find their profile
        await supabase.auth.signOut();
        return { success: false, error: 'Doctor profile not found' };
      }

      // Update last login
      await supabase
        .from('doctors')
        .update({ last_login: new Date().toISOString() })
        .eq('id', doctor.id);
      
      console.log('Doctor login successful:', doctor.full_name);
      return { success: true, doctor };
    } catch (error) {
      console.error('Error during doctor login:', error);
      return { success: false, error: 'Login failed' };
    }
  }

  async getDoctorByEmail(email: string): Promise<{ success: boolean; error?: string; doctor?: DoctorProfile }> {
    try {
      const { data: doctor, error } = await supabase
        .from('doctors')
        .select('*')
        .eq('email', email)
        .single();

      if (error) {
        console.error('Supabase error fetching doctor by email:', error);
        return { success: false, error: error.message };
      }

      return { success: true, doctor };
    } catch (error) {
      console.error('Error fetching doctor by email:', error);
      return { success: false, error: 'Failed to fetch doctor' };
    }
  }

  // Password hashing and verification (simplified - use proper library in production)
  private async hashPassword(password: string): Promise<string> {
    // In production, use bcrypt or similar
    // For now, using a simple hash (NOT SECURE FOR PRODUCTION)
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  private async verifyPassword(password: string, hash: string): Promise<boolean> {
    const hashedPassword = await this.hashPassword(password);
    return hashedPassword === hash;
  }
}

export const doctorService = new DoctorService(); 