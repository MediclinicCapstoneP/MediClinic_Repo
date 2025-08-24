import { supabase } from '../../../supabaseClient';

export interface PatientProfile {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string | null;
  date_of_birth?: string | null;
  address?: string | null;
  emergency_contact?: string | null;
  blood_type?: string;
  allergies?: string;
  medications?: string;
  medical_conditions?: string;
  profile_pic_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreatePatientData {
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string | null;
  date_of_birth?: string | null;
  address?: string | null;
  emergency_contact?: string | null;
  blood_type?: string;
  allergies?: string;
  medications?: string;
  medical_conditions?: string;
}

export const patientService = {
  // Create a new patient profile
  async createPatient(
    data: CreatePatientData
  ): Promise<{ success: boolean; error?: string; patient?: PatientProfile }> {
    try {
      console.log("Creating patient with data:", data);

      // First check if patient already exists
      const existingPatient = await this.getPatientByUserId(data.user_id);
      if (existingPatient.success && existingPatient.patient) {
        console.log("Patient already exists, returning existing patient");
        return { success: true, patient: existingPatient.patient };
      }

      const { data: patient, error } = await supabase
        .from("patients")
        .insert([data])
        .select()
        .single();

      if (error) {
        console.error("Supabase error creating patient:", error);
        return { success: false, error: error.message };
      }

      console.log("Patient created successfully:", patient);
      return { success: true, patient };
    } catch (error) {
      console.error("Exception creating patient:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to create patient profile";
      return { success: false, error: errorMessage };
    }
  },

  // Get patient profile by user ID
  async getPatientByUserId(
    userId: string
  ): Promise<{ success: boolean; error?: string; patient?: PatientProfile }> {
    try {
      console.log("Fetching patient for user ID:", userId);

      // First check if user is authenticated
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError) {
        console.error("Auth error:", authError);
        return { success: false, error: "Authentication error" };
      }

      if (!user) {
        console.error("No authenticated user found");
        return { success: false, error: "No authenticated user found" };
      }

      console.log("Authenticated user:", user.id);

      const { data: patient, error } = await supabase
        .from("patients")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          // No patient found for this user
          console.log("No patient found for user:", userId);
          return { success: true, patient: undefined };
        }
        console.error("Error fetching patient:", error);
        return { success: false, error: error.message };
      }

      console.log("Patient found:", patient);
      return { success: true, patient };
    } catch (error) {
      console.error("Unexpected error fetching patient:", error);
      return { success: false, error: "Failed to fetch patient profile" };
    }
  },

  // Update patient profile
  async updatePatient(
    userId: string,
    updates: Partial<PatientProfile>
  ): Promise<{ success: boolean; error?: string; patient?: PatientProfile }> {
    try {
      console.log(
        "Updating patient for user ID:",
        userId,
        "with updates:",
        updates
      );

      // First check if patient exists
      const existingPatient = await this.getPatientByUserId(userId);
      if (!existingPatient.success || !existingPatient.patient) {
        console.error("Patient not found for user ID:", userId);
        return { success: false, error: "Patient profile not found" };
      }

      // Remove user_id from updates to avoid conflicts
      const { user_id, ...updateData } = updates;

      const { data: patient, error } = await supabase
        .from("patients")
        .update(updateData)
        .eq("user_id", userId)
        .select()
        .single();

      if (error) {
        console.error("Error updating patient:", error);
        return { success: false, error: error.message };
      }

      if (!patient) {
        console.error("No patient found after update for user ID:", userId);
        return {
          success: false,
          error: "Patient profile not found after update",
        };
      }

      console.log("Patient updated successfully:", patient);
      return { success: true, patient };
    } catch (error) {
      console.error("Unexpected error updating patient:", error);
      return { success: false, error: "Failed to update patient profile" };
    }
  },

  // Delete patient profile
  async deletePatient(
    userId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log("Deleting patient for user ID:", userId);

      const { error } = await supabase
        .from("patients")
        .delete()
        .eq("user_id", userId);

      if (error) {
        console.error("Error deleting patient:", error);
        return { success: false, error: error.message };
      }

      console.log("Patient deleted successfully");
      return { success: true };
    } catch (error) {
      console.error("Unexpected error deleting patient:", error);
      return { success: false, error: "Failed to delete patient profile" };
    }
  },

  // Upsert patient profile (create or update)
  async upsertPatient(
    data: CreatePatientData
  ): Promise<{ success: boolean; error?: string; patient?: PatientProfile }> {
    try {
      console.log("Upserting patient with data:", data);

      // First check if user is authenticated
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError) {
        console.error("Auth error during upsert:", authError);
        return { success: false, error: "Authentication error" };
      }

      if (!user) {
        console.error("No authenticated user found during upsert");
        return { success: false, error: "No authenticated user found" };
      }

      console.log("Authenticated user for upsert:", user.id);

      // Try to get existing patient first
      const existingPatient = await this.getPatientByUserId(data.user_id);
      console.log("Existing patient check result:", existingPatient);

      if (existingPatient.success && existingPatient.patient) {
        // Patient exists, update it
        console.log("Patient exists, updating...");
        return await this.updatePatient(data.user_id, data);
      } else {
        // Patient doesn't exist, create it
        console.log("Patient doesn't exist, creating...");
        return await this.createPatient(data);
      }
    } catch (error) {
      console.error("Exception upserting patient:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to upsert patient profile";
      return { success: false, error: errorMessage };
    }
  },

  async updateProfilePicture(userId: string, imageUrl: string) {
    const { data, error } = await supabase
      .from("patients")
      .update({ profile_pic_url: imageUrl })
      .eq("user_id", userId)
      .select()
      .single();

    if (error) {
      console.error("Error updating profile picture:", error.message);
      throw error;
    }

    return data;
  },
}; 