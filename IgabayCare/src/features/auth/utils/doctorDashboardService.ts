import { supabase } from '../../../supabaseClient';
import { AppointmentWithDetails, AppointmentStatus } from '../../../types/appointments';

export interface DoctorStats {
  totalPatients: number;
  todayAppointments: number;
  completedAppointments: number;
  upcomingAppointments: number;
  totalRevenue: number;
  averageRating: number;
}

export interface DoctorActivity {
  id: string;
  type: 'appointment_completed' | 'prescription_created' | 'appointment_rescheduled' | 'profile_updated';
  description: string;
  timestamp: string;
  patient_name?: string;
  appointment_id?: string;
}

export interface DoctorProfileUpdate {
  full_name?: string;
  email?: string;
  phone?: string;
  specialization?: string;
  availability?: string;
  profile_picture_url?: string;
  profile_picture_path?: string;
  years_experience?: number;
  status?: 'active' | 'on-leave' | 'inactive';
}

class DoctorDashboardService {
  /**
   * Get doctor statistics and metrics
   */
  async getDoctorStats(doctorId: string): Promise<{
    success: boolean;
    stats?: DoctorStats;
    error?: string;
  }> {
    try {
      const today = new Date().toISOString().split('T')[0];

      // Get appointments for the doctor - now doctor_id should be properly populated
      const { data: appointments, error: appointmentsError } = await supabase
        .from('appointments')
        .select('*')
        .eq('doctor_id', doctorId);

      if (appointmentsError) {
        console.error('Error fetching doctor appointments for stats:', appointmentsError);
        return {
          success: false,
          error: appointmentsError.message
        };
      }

      // Get unique patients
      const uniquePatientIds = new Set(appointments?.map(apt => apt.patient_id) || []);
      const totalPatients = uniquePatientIds.size;

      // Calculate stats
      const todayAppointments = appointments?.filter(apt => apt.appointment_date === today).length || 0;
      const completedAppointments = appointments?.filter(apt => apt.status === 'completed').length || 0;
      const upcomingAppointments = appointments?.filter(apt => 
        apt.appointment_date > today && apt.status !== 'cancelled'
      ).length || 0;

      // Calculate total revenue (from completed appointments)
      const totalRevenue = appointments
        ?.filter(apt => apt.status === 'completed')
        .reduce((sum, apt) => sum + (apt.payment_amount || 0), 0) || 0;

      // Get doctor ratings from reviews (with error handling for missing table)
      let averageRating = 0;
      try {
        const { data: reviews, error: reviewsError } = await supabase
          .from('reviews')
          .select('rating, overall_rating')
          .eq('doctor_id', doctorId);

        if (!reviewsError && reviews && reviews.length > 0) {
          // Use overall_rating if available, otherwise fall back to rating column
          const ratingsToAverage = reviews.map(review => review.overall_rating || review.rating);
          averageRating = ratingsToAverage.reduce((sum, rating) => sum + rating, 0) / ratingsToAverage.length;
        }
      } catch (error) {
        console.warn('Reviews table not found or inaccessible, defaulting to 0 rating:', error);
        averageRating = 0;
      }

      const stats: DoctorStats = {
        totalPatients,
        todayAppointments,
        completedAppointments,
        upcomingAppointments,
        totalRevenue,
        averageRating: Math.round(averageRating * 10) / 10 // Round to 1 decimal
      };

      return {
        success: true,
        stats
      };
    } catch (error) {
      console.error('Error fetching doctor stats:', error);
      return {
        success: false,
        error: 'Failed to fetch doctor stats'
      };
    }
  }

  /**
   * Get recent doctor activities
   */
  async getDoctorActivity(doctorId: string, limit: number = 10): Promise<{
    success: boolean;
    activities?: DoctorActivity[];
    error?: string;
  }> {
    try {
      // For now, we'll generate activities based on recent appointments and prescriptions
      const activities: DoctorActivity[] = [];

      // Get recent completed appointments - now with improved patient name resolution
      const { data: recentAppointments, error: appointmentsError } = await supabase
        .from('appointments')
        .select(`
          id,
          appointment_date,
          appointment_time,
          status,
          updated_at,
          patient_name,
          appointment_type,
          patient:patients(first_name, last_name)
        `)
        .eq('doctor_id', doctorId)
        .order('updated_at', { ascending: false })
        .limit(limit);

      if (!appointmentsError && recentAppointments) {
        for (const appointment of recentAppointments) {
          if (appointment.status === 'completed') {
            // Determine patient name with improved logic
            let patientName = appointment.patient_name || 'patient';
            if (appointment.patient && appointment.patient.first_name && appointment.patient.last_name) {
              patientName = `${appointment.patient.first_name} ${appointment.patient.last_name}`;
            }
            
            activities.push({
              id: `apt_${appointment.id}`,
              type: 'appointment_completed',
              description: `Completed ${appointment.appointment_type} appointment with ${patientName}`,
              timestamp: appointment.updated_at,
              patient_name: patientName,
              appointment_id: appointment.id
            });
          }
        }
      }

      // Get recent prescriptions
      const { data: recentPrescriptions, error: prescriptionsError } = await supabase
        .from('prescriptions')
        .select(`
          id,
          medication_name,
          created_at,
          patient:patients(first_name, last_name)
        `)
        .eq('doctor_id', doctorId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (!prescriptionsError && recentPrescriptions) {
        for (const prescription of recentPrescriptions) {
          // The patient data from the join might be an array or object
          let patientName = 'patient';
          if (prescription.patient) {
            if (Array.isArray(prescription.patient) && prescription.patient.length > 0) {
              // If it's an array, take the first element
              const patientObj: any = prescription.patient[0];
              if (patientObj.first_name && patientObj.last_name) {
                patientName = `${patientObj.first_name} ${patientObj.last_name}`;
              }
            } else if (!Array.isArray(prescription.patient)) {
              // If it's an object
              const patientObj: any = prescription.patient;
              if (patientObj.first_name && patientObj.last_name) {
                patientName = `${patientObj.first_name} ${patientObj.last_name}`;
              }
            }
          }
          
          activities.push({
            id: `presc_${prescription.id}`,
            type: 'prescription_created',
            description: `Created prescription for ${prescription.medication_name} for ${patientName}`,
            timestamp: prescription.created_at,
            patient_name: patientName
          });
        }
      }

      // Sort activities by timestamp
      activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      return {
        success: true,
        activities: activities.slice(0, limit)
      };
    } catch (error) {
      console.error('Error fetching doctor activity:', error);
      return {
        success: false,
        error: 'Failed to fetch doctor activity'
      };
    }
  }

  /**
   * Get doctor's assigned appointments using EXACTLY the same logic as clinic appointments
   */
  async getDoctorAppointments(doctorId: string, filters?: {
    status?: AppointmentStatus;
    date?: string;
    limit?: number;
  }): Promise<{
    success: boolean;
    appointments?: AppointmentWithDetails[];
    error?: string;
  }> {
    try {
      console.log('🔍 Fetching appointments for doctor ID:', doctorId);
      
      // Use EXACTLY the same method as clinic appointments (line 50 in Appointment.tsx)
      const { AppointmentService } = await import('./appointmentService');
      
      // Build filters EXACTLY like clinic appointments do (lines 44-48 in Appointment.tsx)
      const appointmentFilters = {
        doctor_id: doctorId,
        ...(filters?.status && filters.status !== 'all' && { status: filters.status }),
        ...(filters?.date && { appointment_date: filters.date })
      };
      
      console.log('📋 Using appointment filters:', appointmentFilters);
      
      // Use EXACTLY the same method call as clinic appointments
      const appointmentsData = await AppointmentService.getAppointmentsWithDetails(appointmentFilters);
      
      console.log('🎯 Fetched appointments:', appointmentsData?.length || 0);
      console.log('👤 Sample patient data:', appointmentsData?.[0]?.patient);
      
      // Apply limit filter if specified (not done in clinic, but needed for dashboard)
      const finalAppointments = filters?.limit 
        ? appointmentsData.slice(0, filters.limit)
        : appointmentsData;
      
      console.log('✅ Final appointments for doctor:', finalAppointments?.length || 0);

      return {
        success: true,
        appointments: finalAppointments || []
      };
    } catch (error) {
      console.error('❌ Error fetching doctor appointments:', error);
      return {
        success: false,
        error: 'Failed to fetch appointments: ' + (error as Error).message
      };
    }
  }


  /**
   * Update appointment status
   */
  async updateAppointmentStatus(appointmentId: string, status: AppointmentStatus, notes?: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString()
      };

      if (notes) {
        updateData.doctor_notes = notes;
      }

      const { error } = await supabase
        .from('appointments')
        .update(updateData)
        .eq('id', appointmentId);

      if (error) {
        console.error('Error updating appointment status:', error);
        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: true
      };
    } catch (error) {
      console.error('Error updating appointment status:', error);
      return {
        success: false,
        error: 'Failed to update appointment status'
      };
    }
  }

  /**
   * Reschedule appointment
   */
  async rescheduleAppointment(appointmentId: string, newDate: string, newTime: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({
          appointment_date: newDate,
          appointment_time: newTime,
          status: 'rescheduled',
          updated_at: new Date().toISOString()
        })
        .eq('id', appointmentId);

      if (error) {
        console.error('Error rescheduling appointment:', error);
        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: true
      };
    } catch (error) {
      console.error('Error rescheduling appointment:', error);
      return {
        success: false,
        error: 'Failed to reschedule appointment'
      };
    }
  }

  /**
   * Upload profile picture to Supabase Storage
   */
  async uploadProfilePicture(doctorId: string, file: File): Promise<{
    success: boolean;
    url?: string;
    path?: string;
    error?: string;
  }> {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${doctorId}-${Math.random()}.${fileExt}`;
      const filePath = `doctor-profiles/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('profile-pictures')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Error uploading profile picture:', uploadError);
        return {
          success: false,
          error: uploadError.message
        };
      }

      const { data: { publicUrl } } = supabase.storage
        .from('profile-pictures')
        .getPublicUrl(filePath);

      // Update doctor profile with new picture URL
      const { error: updateError } = await supabase
        .from('doctors')
        .update({
          profile_picture_url: publicUrl,
          profile_picture_path: filePath,
          updated_at: new Date().toISOString()
        })
        .eq('id', doctorId);

      if (updateError) {
        console.error('Error updating doctor profile with picture URL:', updateError);
        // Clean up uploaded file
        await supabase.storage
          .from('profile-pictures')
          .remove([filePath]);
        
        return {
          success: false,
          error: updateError.message
        };
      }

      return {
        success: true,
        url: publicUrl,
        path: filePath
      };
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      return {
        success: false,
        error: 'Failed to upload profile picture'
      };
    }
  }

  /**
   * Update doctor profile
   */
  async updateDoctorProfile(doctorId: string, updates: any): Promise<{
    success: boolean;
    doctor?: any;
    error?: string;
  }> {
    try {
      // First, check if the doctor exists
      const { data: existingDoctor, error: checkError } = await supabase
        .from('doctors')
        .select('id')
        .eq('id', doctorId)
        .single();

      if (checkError) {
        if (checkError.code === 'PGRST116') {
          console.warn('Doctor not found for update:', doctorId);
          return {
            success: false,
            error: 'Doctor profile not found. Cannot update non-existent doctor.'
          };
        }
        console.error('Error checking doctor existence:', checkError);
        return {
          success: false,
          error: checkError.message
        };
      }

      // Transform profile data to match database schema
      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      // Map profile fields to database columns based on actual schema
      // Your doctors table has these actual columns: full_name, specialization, email, phone, 
      // license_number, years_experience, availability, status, rating, total_patients, 
      // profile_picture_url, profile_picture_path, etc.
      
      if (updates.first_name || updates.last_name) {
        updateData.full_name = `${updates.first_name || ''} ${updates.last_name || ''}`.trim();
      }
      
      // Direct field mappings that exist in your database
      if (updates.full_name) updateData.full_name = updates.full_name;
      if (updates.email) updateData.email = updates.email;
      if (updates.phone) updateData.phone = updates.phone;
      if (updates.specialization) updateData.specialization = updates.specialization;
      if (updates.license_number) updateData.license_number = updates.license_number;
      if (updates.years_of_experience !== undefined) updateData.years_experience = updates.years_of_experience;
      if (updates.availability) updateData.availability = updates.availability;
      if (updates.status) updateData.status = updates.status;
      if (updates.rating !== undefined) updateData.rating = updates.rating;
      if (updates.total_patients !== undefined) updateData.total_patients = updates.total_patients;
      if (updates.profile_picture_url) updateData.profile_picture_url = updates.profile_picture_url;
      if (updates.profile_picture_path) updateData.profile_picture_path = updates.profile_picture_path;
      if (updates.email_verified !== undefined) updateData.email_verified = updates.email_verified;
      
      // Handle profile_pic_url -> profile_picture_url mapping
      if (updates.profile_pic_url) updateData.profile_picture_url = updates.profile_pic_url;
      
      // Fields that don't exist in your database schema are ignored
      // (date_of_birth, gender, address, qualifications, bio, clinic_address, consultation_fee)

      const { data: doctor, error } = await supabase
        .from('doctors')
        .update(updateData)
        .eq('id', doctorId)
        .select()
        .single();

      if (error) {
        console.error('Error updating doctor profile:', error);
        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: true,
        doctor
      };
    } catch (error) {
      console.error('Error updating doctor profile:', error);
      return {
        success: false,
        error: 'Failed to update doctor profile'
      };
    }
  }

  /**
   * Get doctor by user ID (for authentication)
   */
  async getDoctorByUserId(userId: string): Promise<{
    success: boolean;
    doctor?: any;
    error?: string;
  }> {
    try {
      const { data: doctor, error } = await supabase
        .from('doctors')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Error fetching doctor by user ID:', error);
        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: true,
        doctor
      };
    } catch (error) {
      console.error('Error fetching doctor by user ID:', error);
      return {
        success: false,
        error: 'Failed to fetch doctor'
      };
    }
  }

  /**
   * Get doctor profile by doctor ID (for profile management)
   */
  async getDoctorProfile(doctorId: string): Promise<{
    success: boolean;
    profile?: any;
    error?: string;
  }> {
    try {
      const { data: doctor, error } = await supabase
        .from('doctors')
        .select('*')
        .eq('id', doctorId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          console.warn('Doctor profile not found for ID:', doctorId);
          return {
            success: false,
            error: 'Doctor profile not found. Please check if the doctor exists.'
          };
        }
        console.error('Error fetching doctor profile:', error);
        return {
          success: false,
          error: error.message
        };
      }

      // Transform the data to match the expected profile format
      // Based on your actual database schema: doctors table has full_name, not separate first_name/last_name
      const profile = {
        id: doctor.id,
        user_id: doctor.user_id,
        first_name: doctor.full_name?.split(' ')[0] || '',
        last_name: doctor.full_name?.split(' ').slice(1).join(' ') || '',
        full_name: doctor.full_name || '',
        email: doctor.email,
        phone: doctor.phone,
        profile_pic_url: doctor.profile_picture_url,
        specialization: doctor.specialization,
        years_of_experience: doctor.years_experience,
        license_number: doctor.license_number,
        availability: doctor.availability,
        status: doctor.status,
        rating: doctor.rating,
        total_patients: doctor.total_patients,
        clinic_id: doctor.clinic_id,
        is_clinic_created: doctor.is_clinic_created,
        email_verified: doctor.email_verified,
        created_at: doctor.created_at,
        updated_at: doctor.updated_at,
        // Add placeholder fields that the form might expect but don't exist in DB
        date_of_birth: null,
        gender: null,
        address: null,
        qualifications: null,
        bio: null,
        clinic_address: null,
        consultation_fee: null
      };

      return {
        success: true,
        profile
      };
    } catch (error) {
      console.error('Error fetching doctor profile:', error);
      return {
        success: false,
        error: 'Failed to fetch doctor profile'
      };
    }
  }
}

export const doctorDashboardService = new DoctorDashboardService();
export default doctorDashboardService;
