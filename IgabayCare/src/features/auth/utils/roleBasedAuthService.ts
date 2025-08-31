import { supabase } from "../../../supabaseClient";
import { patientService } from "./patientService";
import { clinicService } from "./clinicService";

// User roles
export type UserRole = "patient" | "clinic" | "doctor";

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

// Clinic authentication data
export interface ClinicAuthData extends BaseAuthData {
  clinic_name: string;
  location?: string | { lat: number; lng: number };
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
  latitude?: number;
  longitude?: number;
}

// Doctor authentication data
export interface DoctorAuthData extends BaseAuthData {
  firstName: string;
  lastName: string;
  licenseNumber: string;
  specialization: string;
  phone?: string;
  clinic_id?: string;
  experience_years?: number;
}

// Authentication result
export interface AuthResult {
  success: boolean;
  error?: string;
  user?: any;
  role?: UserRole;
}

export const roleBasedAuthService = {
  // Get current authenticated user with role verification
  async getCurrentUser(): Promise<{ user: any; role: UserRole | null } | null> {
    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error || !user) {
        return null;
      }

      const role = user.user_metadata?.role as UserRole;
      if (!role || !["patient", "clinic", "doctor"].includes(role)) {
        console.error("Invalid or missing user role:", role);
        return null;
      }

      return { user, role };
    } catch (error) {
      console.error("Error getting current user:", error);
      return null;
    }
  },

  // Patient Authentication
  patient: {
    // Sign up for patients
    async signUp(data: PatientAuthData): Promise<AuthResult> {
      try {
        console.log("Patient sign up attempt for:", data.email);

        const { data: authData, error } = await supabase.auth.signUp({
          email: data.email,
          password: data.password,
          options: {
            data: {
              role: "patient",
              first_name: data.firstName,
              last_name: data.lastName,
            },
          },
        });

        if (error) {
          console.error("Patient sign up error:", error);
          return { success: false, error: error.message };
        }

        if (!authData.user) {
          return { success: false, error: "No user data returned" };
        }

        // Create patient profile in database
        await new Promise((resolve) => setTimeout(resolve, 1000)); // Delay for session
        try {
          const patientResult = await patientService.upsertPatient({
            user_id: authData.user.id,
            first_name: data.firstName,
            last_name: data.lastName,
            email: data.email,
            phone: null,
            date_of_birth: null,
            address: null,
            emergency_contact: null,
            blood_type: "O+",
            allergies: "None",
            medications: "None",
            medical_conditions: "None",
          });

          if (!patientResult.success) {
            console.error(
              "Failed to create patient profile:",
              patientResult.error
            );
          }
        } catch (error) {
          console.error("Exception during patient profile creation:", error);
        }

        console.log("Patient sign up successful:", authData.user.id);
        return { success: true, user: authData.user, role: "patient" };
      } catch (error) {
        console.error("Exception during patient sign up:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Failed to sign up";
        return { success: false, error: errorMessage };
      }
    },

    // Sign in for patients
    async signIn(data: BaseAuthData): Promise<AuthResult> {
      try {
        console.log("Patient sign in attempt for:", data.email);

        const { data: authData, error } =
          await supabase.auth.signInWithPassword({
            email: data.email,
            password: data.password,
          });

        if (error) {
          console.error("Patient sign in error:", error);
          return { success: false, error: error.message };
        }

        if (!authData.user) {
          return { success: false, error: "No user data returned" };
        }

        // Verify this is a patient user
        if (authData.user.user_metadata?.role !== "patient") {
          console.error(
            "User is not a patient user:",
            authData.user.user_metadata
          );
          return {
            success: false,
            error:
              "This account is not registered as a patient. Please use the appropriate sign-in form for your account type.",
          };
        }

        // Check if email is confirmed
        if (!authData.user.email_confirmed_at) {
          return {
            success: false,
            error: "Please verify your email before signing in",
          };
        }

        console.log("Patient sign in successful:", authData.user.id);
        return { success: true, user: authData.user, role: "patient" };
      } catch (error) {
        console.error("Exception during patient sign in:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Failed to sign in";
        return { success: false, error: errorMessage };
      }
    },
  },

  // Clinic Authentication
  clinic: {
    // Sign up for clinics
    async signUp(data: ClinicAuthData): Promise<AuthResult> {
      try {
        console.log("Clinic sign up attempt for:", data.email);

        // Store complete clinic registration data in user metadata
        const registrationData = {
          role: "clinic",
          clinic_name: data.clinic_name,
          first_name: data.clinic_name, // For compatibility
          last_name: "", // For compatibility
          // Store all registration data for profile creation after email verification
          clinic_registration_data: {
            clinic_name: data.clinic_name,
            email: data.email,
            phone: data.phone,
            website: data.website,
            address: data.address,
            city: data.city,
            state: data.state,
            zip_code: data.zip_code,
            license_number: data.license_number,
            accreditation: data.accreditation,
            tax_id: data.tax_id,
            year_established: data.year_established,
            specialties: data.specialties || [],
            custom_specialties: data.custom_specialties || [],
            services: data.services || [],
            custom_services: data.custom_services || [],
            operating_hours: data.operating_hours || {
              monday: { open: "08:00", close: "18:00" },
              tuesday: { open: "08:00", close: "18:00" },
              wednesday: { open: "08:00", close: "18:00" },
              thursday: { open: "08:00", close: "18:00" },
              friday: { open: "08:00", close: "18:00" },
              saturday: { open: "09:00", close: "16:00" },
              sunday: { open: "10:00", close: "14:00" },
            },
            number_of_doctors: data.number_of_doctors || 0,
            number_of_staff: data.number_of_staff || 0,
            description: data.description,
            status: "approved" // Set status to approved for new registrations
          }
        };

        const { data: authData, error } = await supabase.auth.signUp({
          email: data.email,
          password: data.password,
          options: {
            data: registrationData,
          },
        });

        if (error) {
          console.error("Clinic sign up error:", error);
          return { success: false, error: error.message };
        }

        if (!authData.user) {
          return { success: false, error: "No user data returned" };
        }

        console.log("Clinic auth user created:", authData.user.id);
        console.log("Complete registration data stored in user metadata");

        // For email confirmation flow, we don't create the profile immediately
        // The registration data is now safely stored in user metadata
        // Profile will be created after email verification using the stored data
        if (!authData.user.email_confirmed_at) {
          console.log("Email confirmation required. Complete registration data saved. Profile will be created after email verification.");
          return { success: true, user: authData.user, role: "clinic" };
        }

        // If email is already confirmed (shouldn't happen in normal flow), create profile immediately
        return await this.createClinicProfileFromMetadata(authData.user);
      } catch (error) {
        console.error("Exception during clinic sign up:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Failed to sign up";
        return { success: false, error: errorMessage };
      }
    },

    // Helper method to create clinic profile from stored metadata
    async createClinicProfileFromMetadata(user: any): Promise<AuthResult> {
      try {
        console.log("Creating clinic profile from metadata for user:", user.id);
        
        // Get registration data from user metadata
        const registrationData = user.user_metadata?.clinic_registration_data;
        if (!registrationData) {
          console.error("No registration data found in user metadata");
          return { success: false, error: "Registration data not found. Please contact support." };
        }
        
        console.log("Found registration data:", registrationData);
        
        // Wait a bit to ensure the session is properly established
        await new Promise((resolve) => setTimeout(resolve, 1000));

        const clinicResult = await clinicService.upsertClinic({
          user_id: user.id,
          clinic_name: registrationData.clinic_name,
          email: registrationData.email || user.email,
          phone: registrationData.phone,
          website: registrationData.website,
          address: registrationData.address,
          city: registrationData.city,
          state: registrationData.state,
          zip_code: registrationData.zip_code,
          license_number: registrationData.license_number,
          accreditation: registrationData.accreditation,
          tax_id: registrationData.tax_id,
          year_established: registrationData.year_established,
          specialties: registrationData.specialties || [],
          custom_specialties: registrationData.custom_specialties || [],
          services: registrationData.services || [],
          custom_services: registrationData.custom_services || [],
          operating_hours: registrationData.operating_hours || {
            monday: { open: "08:00", close: "18:00" },
            tuesday: { open: "08:00", close: "18:00" },
            wednesday: { open: "08:00", close: "18:00" },
            thursday: { open: "08:00", close: "18:00" },
            friday: { open: "08:00", close: "18:00" },
            saturday: { open: "09:00", close: "16:00" },
            sunday: { open: "10:00", close: "14:00" },
          },
          number_of_doctors: registrationData.number_of_doctors || 0,
          number_of_staff: registrationData.number_of_staff || 0,
          description: registrationData.description,
        });

        if (!clinicResult.success) {
          console.error(
            "Failed to create clinic profile:",
            clinicResult.error
          );
          return { success: false, error: `Failed to create clinic profile: ${clinicResult.error}` };
        }
        
        console.log("Clinic profile created successfully from metadata:", clinicResult.clinic?.id);
        
        // Update clinic status to approved
        if (clinicResult.clinic?.id) {
          await clinicService.updateClinic(clinicResult.clinic.id, { status: 'approved' });
          console.log("Clinic status updated to approved");
        }

        return { success: true, user, role: "clinic" };
      } catch (error) {
        console.error("Exception during clinic profile creation from metadata:", error);
        const errorMessage = error instanceof Error ? error.message : "Failed to create clinic profile";
        return { success: false, error: errorMessage };
      }
    },

    // Legacy helper method for backward compatibility
    async createClinicProfileForUser(user: any, data: ClinicAuthData): Promise<AuthResult> {
      return this.createClinicProfileFromMetadata(user);
    },

    // Sign in for clinics
    async signIn(data: BaseAuthData): Promise<AuthResult> {
      try {
        console.log("Clinic sign in attempt for:", data.email);

        const { data: authData, error } =
          await supabase.auth.signInWithPassword({
            email: data.email,
            password: data.password,
          });

        if (error) {
          console.error("Clinic sign in error:", error);
          return { success: false, error: error.message };
        }

        if (!authData.user) {
          return { success: false, error: "No user data returned" };
        }

        // Verify this is a clinic user
        if (authData.user.user_metadata?.role !== "clinic") {
          console.error(
            "User is not a clinic user:",
            authData.user.user_metadata
          );
          return {
            success: false,
            error:
              "This account is not registered as a clinic. Please use the patient sign-in for patient accounts.",
          };
        }

        // Check if email is confirmed
        if (!authData.user.email_confirmed_at) {
          return {
            success: false,
            error: "Please verify your email before signing in",
          };
        }

        // Check if clinic profile exists, create it if missing using stored registration data
        try {
          const existingClinic = await clinicService.getClinicByUserId(authData.user.id);
          
          if (!existingClinic.success || !existingClinic.clinic) {
            console.log("No clinic profile found, attempting to create from stored registration data...");
            
            // Try to create profile from stored registration data
            const registrationData = authData.user.user_metadata?.clinic_registration_data;
            
            if (registrationData) {
              console.log("Found stored registration data, creating full profile...");
              const createResult = await this.createClinicProfileFromMetadata(authData.user);
              
              if (!createResult.success) {
                console.error("Failed to create clinic profile from metadata:", createResult.error);
                // Fallback to basic profile
                await this.createBasicClinicProfile(authData.user, data.email);
              }
            } else {
              console.log("No registration data found, creating basic profile...");
              await this.createBasicClinicProfile(authData.user, data.email);
            }
          } else {
            console.log("Existing clinic profile found:", existingClinic.clinic.id);
            
            // Check if profile needs to be updated to approved status
            if (existingClinic.clinic.status === 'pending') {
              console.log("Updating clinic status to approved...");
              await clinicService.updateClinic(existingClinic.clinic.id, { status: 'approved' });
            }
          }
        } catch (error) {
          console.error("Error checking/creating clinic profile:", error);
          // Continue with sign-in anyway
        }

        console.log("Clinic sign in successful:", authData.user.id);
        return { success: true, user: authData.user, role: "clinic" };
      } catch (error) {
        console.error("Exception during clinic sign in:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Failed to sign in";
        return { success: false, error: errorMessage };
      }
    },

    // Helper method to create basic clinic profile as fallback
    async createBasicClinicProfile(user: any, email: string): Promise<void> {
      try {
        const clinicName = user.user_metadata?.clinic_name || 
                         user.user_metadata?.first_name || 
                         "My Clinic";
        
        const createResult = await clinicService.upsertClinic({
          user_id: user.id,
          clinic_name: clinicName,
          email: user.email || email,
          specialties: [],
          custom_specialties: [],
          services: [],
          custom_services: [],
          operating_hours: {
            monday: { open: "08:00", close: "18:00" },
            tuesday: { open: "08:00", close: "18:00" },
            wednesday: { open: "08:00", close: "18:00" },
            thursday: { open: "08:00", close: "18:00" },
            friday: { open: "08:00", close: "18:00" },
            saturday: { open: "09:00", close: "16:00" },
            sunday: { open: "10:00", close: "14:00" },
          },
          number_of_doctors: 0,
          number_of_staff: 0,
        });
        
        if (createResult.success) {
          console.log("Basic clinic profile created successfully");
          // Update to approved status
          if (createResult.clinic?.id) {
            await clinicService.updateClinic(createResult.clinic.id, { status: 'approved' });
          }
        } else {
          console.error("Failed to create basic clinic profile:", createResult.error);
        }
      } catch (error) {
        console.error("Error creating basic clinic profile:", error);
      }
    },
  },

  // Doctor Authentication (for future use)
  doctor: {
    // Sign up for doctors
    async signUp(data: DoctorAuthData): Promise<AuthResult> {
      try {
        console.log("Doctor sign up attempt for:", data.email);

        const { data: authData, error } = await supabase.auth.signUp({
          email: data.email,
          password: data.password,
          options: {
            data: {
              role: "doctor",
              first_name: data.firstName,
              last_name: data.lastName,
              clinic_id: data.clinic_id,
              specialization: data.specialization,
              license_number: data.licenseNumber,
              phone: data.phone,
              experience_years: data.experience_years,
            },
          },
        });

        if (error) {
          console.error("Doctor sign up error:", error);
          return { success: false, error: error.message };
        }

        if (!authData.user) {
          return { success: false, error: "No user data returned" };
        }

        // TODO: Create doctor profile in database when doctors table is implemented
        console.log("Doctor sign up successful:", authData.user.id);
        return { success: true, user: authData.user, role: "doctor" };
      } catch (error) {
        console.error("Exception during doctor sign up:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Failed to sign up";
        return { success: false, error: errorMessage };
      }
    },

    // Sign in for doctors
    async signIn(data: BaseAuthData): Promise<AuthResult> {
      try {
        console.log("Doctor sign in attempt for:", data.email);

        const { data: authData, error } =
          await supabase.auth.signInWithPassword({
            email: data.email,
            password: data.password,
          });

        if (error) {
          console.error("Doctor sign in error:", error);
          return { success: false, error: error.message };
        }

        if (!authData.user) {
          return { success: false, error: "No user data returned" };
        }

        // Verify this is a doctor user
        if (authData.user.user_metadata?.role !== "doctor") {
          console.error(
            "User is not a doctor user:",
            authData.user.user_metadata
          );
          return {
            success: false,
            error:
              "This account is not registered as a doctor. Please use the appropriate sign-in form for your account type.",
          };
        }

        // Check if email is confirmed
        if (!authData.user.email_confirmed_at) {
          return {
            success: false,
            error: "Please verify your email before signing in",
          };
        }

        console.log("Doctor sign in successful:", authData.user.id);
        return { success: true, user: authData.user, role: "doctor" };
      } catch (error) {
        console.error("Exception during doctor sign in:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Failed to sign in";
        return { success: false, error: errorMessage };
      }
    },
  },

  // Common functions
  async signOut(): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error("Error signing out:", error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error("Exception during sign out:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to sign out";
      return { success: false, error: errorMessage };
    }
  },

  async resendVerificationEmail(
    email: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: email,
      });

      if (error) {
        console.error("Error resending verification email:", error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error("Exception resending verification email:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to resend verification email";
      return { success: false, error: errorMessage };
    }
  },

  // Role verification helpers
  async isPatient(): Promise<boolean> {
    const currentUser = await this.getCurrentUser();
    return currentUser?.role === "patient";
  },

  async isClinic(): Promise<boolean> {
    const currentUser = await this.getCurrentUser();
    return currentUser?.role === "clinic";
  },

  async isDoctor(): Promise<boolean> {
    const currentUser = await this.getCurrentUser();
    return currentUser?.role === "doctor";
  },

  async getUserRole(): Promise<UserRole | null> {
    const currentUser = await this.getCurrentUser();
    return currentUser?.role || null;
  },
};
