import { supabase } from '../../../supabaseClient';
import { AppointmentWithDetails, AppointmentStatus } from '../../../types/appointments';

export interface DoctorAppointmentFilters {
  status?: AppointmentStatus;
  date?: string;
  dateRange?: {
    start: string;
    end: string;
  };
  patientName?: string;
  appointmentType?: string;
  limit?: number;
  offset?: number;
}

export interface AppointmentUpdateData {
  status?: AppointmentStatus;
  doctor_notes?: string;
  appointment_date?: string;
  appointment_time?: string;
  appointment_type?: string;
  follow_up_date?: string;
  prescription_notes?: string;
}

export interface PatientInfo {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  date_of_birth: string | null;
  blood_type: string | null;
  allergies: string | null;
  medications: string | null;
  medical_conditions: string | null;
  emergency_contact: string | null;
  last_visit?: string;
  total_appointments?: number;
}

class DoctorAppointmentService {
  /**
   * Get appointments for a specific doctor with advanced filtering
   */
  async getDoctorAppointments(
    doctorId: string,
    filters?: DoctorAppointmentFilters
  ): Promise<{
    success: boolean;
    appointments?: AppointmentWithDetails[];
    total?: number;
    error?: string;
  }> {
    try {
      let query = supabase
        .from('appointments')
        .select(`
          *,
          patient:patients(
            id,
            first_name,
            last_name,
            email,
            phone,
            date_of_birth,
            blood_type,
            allergies,
            medications,
            medical_conditions,
            emergency_contact
          ),
          clinic:clinics(
            id,
            clinic_name,
            address,
            city,
            state,
            phone
          )
        `)
        .eq('doctor_id', doctorId);

      // Apply filters
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.date) {
        query = query.eq('appointment_date', filters.date);
      }

      if (filters?.dateRange) {
        query = query
          .gte('appointment_date', filters.dateRange.start)
          .lte('appointment_date', filters.dateRange.end);
      }

      if (filters?.appointmentType) {
        query = query.ilike('appointment_type', `%${filters.appointmentType}%`);
      }

      if (filters?.patientName) {
        // Note: This requires a more complex query for patient name search
        // For now, we'll fetch and filter client-side
      }

      // Order by date and time
      query = query
        .order('appointment_date', { ascending: true })
        .order('appointment_time', { ascending: true });

      // Apply pagination
      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      if (filters?.offset) {
        query = query.range(filters.offset, (filters.offset + (filters.limit || 50)) - 1);
      }

      const { data: appointments, error, count } = await query;

      if (error) {
        console.error('Error fetching doctor appointments:', error);
        return {
          success: false,
          error: error.message
        };
      }

      // Client-side filtering for patient name if needed
      let filteredAppointments = appointments || [];
      if (filters?.patientName && filteredAppointments.length > 0) {
        const searchTerm = filters.patientName.toLowerCase();
        filteredAppointments = filteredAppointments.filter(apt => {
          const patientName = `${apt.patient?.first_name || ''} ${apt.patient?.last_name || ''}`.toLowerCase();
          return patientName.includes(searchTerm);
        });
      }

      return {
        success: true,
        appointments: filteredAppointments,
        total: count || filteredAppointments.length
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
   * Get today's appointments for a doctor
   */
  async getTodayAppointments(doctorId: string): Promise<{
    success: boolean;
    appointments?: AppointmentWithDetails[];
    error?: string;
  }> {
    const today = new Date().toISOString().split('T')[0];
    return this.getDoctorAppointments(doctorId, { date: today });
  }

  /**
   * Get upcoming appointments for a doctor
   */
  async getUpcomingAppointments(doctorId: string, days: number = 7): Promise<{
    success: boolean;
    appointments?: AppointmentWithDetails[];
    error?: string;
  }> {
    const today = new Date();
    const endDate = new Date(today);
    endDate.setDate(today.getDate() + days);

    return this.getDoctorAppointments(doctorId, {
      dateRange: {
        start: today.toISOString().split('T')[0],
        end: endDate.toISOString().split('T')[0]
      },
      status: 'confirmed'
    });
  }

  /**
   * Update appointment status and add notes
   */
  async updateAppointment(
    appointmentId: string,
    updates: AppointmentUpdateData
  ): Promise<{
    success: boolean;
    appointment?: any;
    error?: string;
  }> {
    try {
      const updateData: any = {
        ...updates,
        updated_at: new Date().toISOString()
      };

      const { data: appointment, error } = await supabase
        .from('appointments')
        .update(updateData)
        .eq('id', appointmentId)
        .select(`
          *,
          patient:patients(first_name, last_name, email, phone),
          clinic:clinics(clinic_name)
        `)
        .single();

      if (error) {
        console.error('Error updating appointment:', error);
        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: true,
        appointment
      };
    } catch (error) {
      console.error('Error updating appointment:', error);
      return {
        success: false,
        error: 'Failed to update appointment'
      };
    }
  }

  /**
   * Mark appointment as completed
   */
  async completeAppointment(
    appointmentId: string,
    notes?: string,
    followUpDate?: string
  ): Promise<{
    success: boolean;
    error?: string;
  }> {
    const updates: AppointmentUpdateData = {
      status: 'completed',
      doctor_notes: notes,
      follow_up_date: followUpDate
    };

    const result = await this.updateAppointment(appointmentId, updates);
    return {
      success: result.success,
      error: result.error
    };
  }

  /**
   * Cancel appointment
   */
  async cancelAppointment(
    appointmentId: string,
    reason?: string
  ): Promise<{
    success: boolean;
    error?: string;
  }> {
    const updates: AppointmentUpdateData = {
      status: 'cancelled',
      doctor_notes: reason ? `Cancelled: ${reason}` : 'Cancelled by doctor'
    };

    const result = await this.updateAppointment(appointmentId, updates);
    return {
      success: result.success,
      error: result.error
    };
  }

  /**
   * Reschedule appointment
   */
  async rescheduleAppointment(
    appointmentId: string,
    newDate: string,
    newTime: string,
    reason?: string
  ): Promise<{
    success: boolean;
    error?: string;
  }> {
    const updates: AppointmentUpdateData = {
      appointment_date: newDate,
      appointment_time: newTime,
      status: 'rescheduled',
      doctor_notes: reason ? `Rescheduled: ${reason}` : 'Rescheduled by doctor'
    };

    const result = await this.updateAppointment(appointmentId, updates);
    return {
      success: result.success,
      error: result.error
    };
  }

  /**
   * Get patient information for doctor
   */
  async getPatientInfo(patientId: string): Promise<{
    success: boolean;
    patient?: PatientInfo;
    error?: string;
  }> {
    try {
      const { data: patient, error } = await supabase
        .from('patients')
        .select('*')
        .eq('id', patientId)
        .single();

      if (error) {
        console.error('Error fetching patient info:', error);
        return {
          success: false,
          error: error.message
        };
      }

      // Get additional stats
      const { data: appointments } = await supabase
        .from('appointments')
        .select('appointment_date, status')
        .eq('patient_id', patientId)
        .order('appointment_date', { ascending: false });

      const lastVisit = appointments?.find(apt => apt.status === 'completed')?.appointment_date;
      const totalAppointments = appointments?.length || 0;

      const patientInfo: PatientInfo = {
        ...patient,
        last_visit: lastVisit,
        total_appointments: totalAppointments
      };

      return {
        success: true,
        patient: patientInfo
      };
    } catch (error) {
      console.error('Error fetching patient info:', error);
      return {
        success: false,
        error: 'Failed to fetch patient information'
      };
    }
  }

  /**
   * Get doctor's patient list
   */
  async getDoctorPatients(doctorId: string): Promise<{
    success: boolean;
    patients?: PatientInfo[];
    error?: string;
  }> {
    try {
      // Get unique patients from appointments
      const { data: appointments, error } = await supabase
        .from('appointments')
        .select(`
          patient_id,
          patient:patients(*)
        `)
        .eq('doctor_id', doctorId);

      if (error) {
        console.error('Error fetching doctor patients:', error);
        return {
          success: false,
          error: error.message
        };
      }

      // Get unique patients
      const uniquePatients = new Map();
      appointments?.forEach(apt => {
        if (apt.patient && !uniquePatients.has(apt.patient_id)) {
          uniquePatients.set(apt.patient_id, apt.patient);
        }
      });

      const patients = Array.from(uniquePatients.values());

      // Add appointment stats for each patient
      const patientsWithStats = await Promise.all(
        patients.map(async (patient) => {
          const patientAppointments = appointments?.filter(apt => apt.patient_id === patient.id) || [];
          const lastVisit = patientAppointments
            .filter(apt => apt.status === 'completed')
            .sort((a, b) => new Date(b.appointment_date).getTime() - new Date(a.appointment_date).getTime())[0]?.appointment_date;

          return {
            ...patient,
            last_visit: lastVisit,
            total_appointments: patientAppointments.length
          };
        })
      );

      return {
        success: true,
        patients: patientsWithStats
      };
    } catch (error) {
      console.error('Error fetching doctor patients:', error);
      return {
        success: false,
        error: 'Failed to fetch patients'
      };
    }
  }

  /**
   * Get appointment statistics for doctor
   */
  async getDoctorAppointmentStats(doctorId: string): Promise<{
    success: boolean;
    stats?: {
      total: number;
      today: number;
      upcoming: number;
      completed: number;
      cancelled: number;
      thisWeek: number;
      thisMonth: number;
    };
    error?: string;
  }> {
    try {
      const { data: appointments, error } = await supabase
        .from('appointments')
        .select('appointment_date, status')
        .eq('doctor_id', doctorId);

      if (error) {
        console.error('Error fetching appointment stats:', error);
        return {
          success: false,
          error: error.message
        };
      }

      const today = new Date().toISOString().split('T')[0];
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      const monthStart = new Date();
      monthStart.setDate(1);

      const stats = {
        total: appointments?.length || 0,
        today: appointments?.filter(apt => apt.appointment_date === today).length || 0,
        upcoming: appointments?.filter(apt => 
          apt.appointment_date > today && apt.status !== 'cancelled'
        ).length || 0,
        completed: appointments?.filter(apt => apt.status === 'completed').length || 0,
        cancelled: appointments?.filter(apt => apt.status === 'cancelled').length || 0,
        thisWeek: appointments?.filter(apt => 
          apt.appointment_date >= weekStart.toISOString().split('T')[0]
        ).length || 0,
        thisMonth: appointments?.filter(apt => 
          apt.appointment_date >= monthStart.toISOString().split('T')[0]
        ).length || 0
      };

      return {
        success: true,
        stats
      };
    } catch (error) {
      console.error('Error calculating appointment stats:', error);
      return {
        success: false,
        error: 'Failed to calculate statistics'
      };
    }
  }
}

export const doctorAppointmentService = new DoctorAppointmentService();
export default doctorAppointmentService;
