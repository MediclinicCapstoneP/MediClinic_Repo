import { createClient } from '@supabase/supabase-js';

// Get environment variables
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

// Create a simple Supabase client without session persistence for now
// This avoids AsyncStorage SSR issues during development
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: false, // Temporarily disable to avoid SSR issues
    detectSessionInUrl: false,
  },
});

// Database type definitions (matching IgabayCare structure)
export interface Database {
  public: {
    Tables: {
      patients: {
        Row: {
          id: string;
          user_id: string;
          first_name: string;
          last_name: string;
          email: string;
          phone?: string;
          date_of_birth?: string;
          address?: string;
          emergency_contact?: string;
          blood_type?: string;
          allergies?: string;
          medications?: string;
          medical_conditions?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          first_name: string;
          last_name: string;
          email: string;
          phone?: string;
          date_of_birth?: string;
          address?: string;
          emergency_contact?: string;
          blood_type?: string;
          allergies?: string;
          medications?: string;
          medical_conditions?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          first_name?: string;
          last_name?: string;
          email?: string;
          phone?: string;
          date_of_birth?: string;
          address?: string;
          emergency_contact?: string;
          blood_type?: string;
          allergies?: string;
          medications?: string;
          medical_conditions?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      clinics: {
        Row: {
          id: string;
          user_id: string;
          clinic_name: string;
          email: string;
          phone?: string;
          website?: string;
          address?: string;
          city?: string;
          state?: string;
          zip_code?: string;
          license_number?: string;
          accreditation?: string;
          tax_id?: string;
          year_established?: number;
          specialties?: string[];
          custom_specialties?: string[];
          services?: string[];
          custom_services?: string[];
          operating_hours?: any;
          number_of_doctors?: number;
          number_of_staff?: number;
          description?: string;
          profile_picture_url?: string;
          profile_picture_path?: string;
          latitude?: number;
          longitude?: number;
          status: 'pending' | 'approved' | 'rejected';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          clinic_name: string;
          email: string;
          phone?: string;
          website?: string;
          address?: string;
          city?: string;
          state?: string;
          zip_code?: string;
          license_number?: string;
          accreditation?: string;
          tax_id?: string;
          year_established?: number;
          specialties?: string[];
          custom_specialties?: string[];
          services?: string[];
          custom_services?: string[];
          operating_hours?: any;
          number_of_doctors?: number;
          number_of_staff?: number;
          description?: string;
          profile_picture_url?: string;
          profile_picture_path?: string;
          latitude?: number;
          longitude?: number;
          status?: 'pending' | 'approved' | 'rejected';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          clinic_name?: string;
          email?: string;
          phone?: string;
          website?: string;
          address?: string;
          city?: string;
          state?: string;
          zip_code?: string;
          license_number?: string;
          accreditation?: string;
          tax_id?: string;
          year_established?: number;
          specialties?: string[];
          custom_specialties?: string[];
          services?: string[];
          custom_services?: string[];
          operating_hours?: any;
          number_of_doctors?: number;
          number_of_staff?: number;
          description?: string;
          profile_picture_url?: string;
          profile_picture_path?: string;
          latitude?: number;
          longitude?: number;
          status?: 'pending' | 'approved' | 'rejected';
          created_at?: string;
          updated_at?: string;
        };
      };
      appointments: {
        Row: {
          id: string;
          patient_id: string;
          clinic_id: string;
          appointment_date: string;
          appointment_time: string;
          appointment_type: string;
          status: string;
          notes?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          patient_id: string;
          clinic_id: string;
          appointment_date: string;
          appointment_time: string;
          appointment_type: string;
          status?: string;
          notes?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          patient_id?: string;
          clinic_id?: string;
          appointment_date?: string;
          appointment_time?: string;
          appointment_type?: string;
          status?: string;
          notes?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type InsertTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert'];
export type UpdateTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update'];
