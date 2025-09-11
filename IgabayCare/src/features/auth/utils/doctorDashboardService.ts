import { supabase } from '../../../lib/supabase';
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

      // Get appointments for the doctor
      const { data: appointments, error: appointmentsError } = await supabase
        .from('appointments')
        .select('*')
        .eq('doctor_id', doctorId);

      if (appointmentsError) {
        console.error('Error fetching doctor appointments:', appointmentsError);
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

      // Get doctor rating from reviews
      const { data: reviews, error: reviewsError } = await supabase
        .from('patient_reviews')
        .select('rating')
        .eq('doctor_id', doctorId);

      let averageRating = 0;
      if (!reviewsError && reviews && reviews.length > 0) {
        averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
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

      // Get recent completed appointments
      const { data: recentAppointments, error: appointmentsError } = await supabase
        .from('appointments')
        .select(`
          id,
          appointment_date,
          appointment_time,
          status,
          updated_at,
          patient_name,
          appointment_type
        `)
        .eq('doctor_id', doctorId)
        .order('updated_at', { ascending: false })
        .limit(limit);

      if (!appointmentsError && recentAppointments) {
        for (const appointment of recentAppointments) {
          if (appointment.status === 'completed') {
            activities.push({
              id: `apt_${appointment.id}`,
              type: 'appointment_completed',
              description: `Completed ${appointment.appointment_type} appointment with ${appointment.patient_name || 'patient'}`,
              timestamp: appointment.updated_at,
              patient_name: appointment.patient_name,
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
          const patientName = prescription.patient 
            ? `${prescription.patient.first_name} ${prescription.patient.last_name}`
            : 'patient';
          
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
   * Get doctor's assigned appointments from Supabase
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
      let query = supabase
        .from('appointments')
        .select(`
          *,
          patient:patients(id, first_name, last_name, email, phone),
          clinic:clinics(id, clinic_name, address, city, state)
        `)
        .eq('doctor_id', doctorId)
        .order('appointment_date', { ascending: true })
        .order('appointment_time', { ascending: true });

      // Apply filters
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.date) {
        query = query.eq('appointment_date', filters.date);
      }

      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      let { data: appointments, error } = await query;

      // If the query fails (possibly due to missing patients table or join issues),
      // fallback to a simple query without joins
      if (error) {
        console.warn('Failed to fetch appointments with joins, trying fallback query:', error.message);
        
        let fallbackQuery = supabase
          .from('appointments')
          .select('*')
          .eq('doctor_id', doctorId)
          .order('appointment_date', { ascending: true })
          .order('appointment_time', { ascending: true });

        // Apply same filters to fallback query
        if (filters?.status) {
          fallbackQuery = fallbackQuery.eq('status', filters.status);
        }
        if (filters?.date) {
          fallbackQuery = fallbackQuery.eq('appointment_date', filters.date);
        }
        if (filters?.limit) {
          fallbackQuery = fallbackQuery.limit(filters.limit);
        }

        const fallbackResult = await fallbackQuery;
        appointments = fallbackResult.data;
        error = fallbackResult.error;
      }

      if (error) {
        console.error('Error fetching doctor appointments:', error);
        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: true,
        appointments: appointments || []
      };
    } catch (error) {
      console.error('Error fetching doctor appointments:', error);
      return {
        success: false,
        error: 'Failed to fetch appointments'
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
  async updateDoctorProfile(doctorId: string, updates: DoctorProfileUpdate): Promise<{
    success: boolean;
    doctor?: any;
    error?: string;
  }> {
    try {
      const updateData = {
        ...updates,
        updated_at: new Date().toISOString()
      };

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
}

export const doctorDashboardService = new DoctorDashboardService();
export default doctorDashboardService;
