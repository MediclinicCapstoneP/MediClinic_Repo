import { supabase } from '../lib/supabase';

export interface DoctorAppointment {
  id: string;
  patient_id: string;
  doctor_id: string;
  clinic_id: string;
  appointment_date: string;
  appointment_time: string;
  appointment_type: string;
  status: 'scheduled' | 'confirmed' | 'payment_confirmed' | 'in_progress' | 'completed' | 'cancelled';
  symptoms?: string;
  notes?: string;
  total_amount?: number;
  payment_status?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  cancelled_at?: string;
  cancelled_by?: string;
  patient: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    date_of_birth?: string;
  };
  clinic: {
    id: string;
    clinic_name: string;
    address?: string;
    phone?: string;
  };
  transaction?: {
    id: string;
    amount: number;
    status: string;
    payment_method: string;
  };
}

export interface AppointmentFilters {
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  patientName?: string;
}

export interface AppointmentStats {
  total: number;
  today: number;
  upcoming: number;
  completed: number;
  cancelled: number;
  inProgress: number;
}

class DoctorAppointmentService {
  async getAppointments(
    doctorId: string, 
    filters?: AppointmentFilters
  ): Promise<{ success: boolean; data: DoctorAppointment[]; error?: string }> {
    try {
      let query = supabase
        .from('appointments')
        .select(`
          *,
          patient:patients(*),
          clinic:clinics(*),
          transaction:transactions(*)
        `)
        .eq('doctor_id', doctorId);

      // Apply filters
      if (filters?.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      if (filters?.dateFrom) {
        query = query.gte('appointment_date', filters.dateFrom);
      }

      if (filters?.dateTo) {
        query = query.lte('appointment_date', filters.dateTo);
      }

      if (filters?.patientName) {
        query = query.or(`patient.first_name.ilike.%${filters.patientName}%,patient.last_name.ilike.%${filters.patientName}%`);
      }

      const { data, error } = await query.order('appointment_date', { ascending: false });

      if (error) throw error;

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error fetching appointments:', error);
      return { success: false, data: [], error: 'Failed to fetch appointments' };
    }
  }

  async getTodayAppointments(doctorId: string): Promise<{ success: boolean; data: DoctorAppointment[]; error?: string }> {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          patient:patients(*),
          clinic:clinics(*),
          transaction:transactions(*)
        `)
        .eq('doctor_id', doctorId)
        .eq('appointment_date', today)
        .in('status', ['scheduled', 'confirmed', 'payment_confirmed', 'in_progress'])
        .order('appointment_time', { ascending: true });

      if (error) throw error;

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error fetching today appointments:', error);
      return { success: false, data: [], error: 'Failed to fetch today appointments' };
    }
  }

  async updateAppointmentStatus(
    appointmentId: string, 
    status: string,
    doctorId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const updateData: any = { 
        status, 
        updated_at: new Date().toISOString() 
      };

      if (status === 'completed') {
        updateData.completed_at = new Date().toISOString();
      } else if (status === 'in_progress') {
        // Remove completed_at if status changes from completed
        updateData.completed_at = null;
      }

      const { error } = await supabase
        .from('appointments')
        .update(updateData)
        .eq('id', appointmentId)
        .eq('doctor_id', doctorId); // Ensure doctor can only update their own appointments

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Error updating appointment status:', error);
      return { success: false, error: 'Failed to update appointment status' };
    }
  }

  async cancelAppointment(
    appointmentId: string, 
    reason: string,
    doctorId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          cancelled_by: doctorId,
          notes: reason,
          updated_at: new Date().toISOString()
        })
        .eq('id', appointmentId)
        .eq('doctor_id', doctorId);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      return { success: false, error: 'Failed to cancel appointment' };
    }
  }

  async rescheduleAppointment(
    appointmentId: string,
    newDate: string,
    newTime: string,
    doctorId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({
          appointment_date: newDate,
          appointment_time: newTime,
          status: 'scheduled', // Reset to scheduled when rescheduled
          updated_at: new Date().toISOString()
        })
        .eq('id', appointmentId)
        .eq('doctor_id', doctorId);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Error rescheduling appointment:', error);
      return { success: false, error: 'Failed to reschedule appointment' };
    }
  }

  async addConsultationNotes(
    appointmentId: string,
    notes: string,
    doctorId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({
          notes: notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', appointmentId)
        .eq('doctor_id', doctorId);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Error adding consultation notes:', error);
      return { success: false, error: 'Failed to add consultation notes' };
    }
  }

  async getAppointmentStats(doctorId: string): Promise<{ success: boolean; data: AppointmentStats; error?: string }> {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Get all appointments for stats
      const { data: allAppointments, error: allError } = await supabase
        .from('appointments')
        .select('id, status, appointment_date')
        .eq('doctor_id', doctorId);

      if (allError) throw allError;

      // Get today's appointments
      const { data: todayAppointments, error: todayError } = await supabase
        .from('appointments')
        .select('id, status')
        .eq('doctor_id', doctorId)
        .eq('appointment_date', today);

      if (todayError) throw todayError;

      const stats: AppointmentStats = {
        total: allAppointments?.length || 0,
        today: todayAppointments?.length || 0,
        upcoming: allAppointments?.filter(apt => 
          ['scheduled', 'confirmed', 'payment_confirmed'].includes(apt.status) && 
          apt.appointment_date > today
        ).length || 0,
        completed: allAppointments?.filter(apt => apt.status === 'completed').length || 0,
        cancelled: allAppointments?.filter(apt => apt.status === 'cancelled').length || 0,
        inProgress: allAppointments?.filter(apt => apt.status === 'in_progress').length || 0
      };

      return { success: true, data: stats };
    } catch (error) {
      console.error('Error fetching appointment stats:', error);
      return { 
        success: false, 
        data: {
          total: 0,
          today: 0,
          upcoming: 0,
          completed: 0,
          cancelled: 0,
          inProgress: 0
        }, 
        error: 'Failed to fetch appointment stats' 
      };
    }
  }

  async getPatientHistory(
    doctorId: string, 
    patientId: string
  ): Promise<{ success: boolean; data: DoctorAppointment[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          patient:patients(*),
          clinic:clinics(*),
          transaction:transactions(*)
        `)
        .eq('doctor_id', doctorId)
        .eq('patient_id', patientId)
        .order('appointment_date', { ascending: false });

      if (error) throw error;

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error fetching patient history:', error);
      return { success: false, data: [], error: 'Failed to fetch patient history' };
    }
  }

  async searchPatients(
    doctorId: string,
    searchTerm: string
  ): Promise<{ success: boolean; data: any[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          patient_id,
          patient:patients(first_name, last_name, email, phone, date_of_birth)
        `)
        .eq('doctor_id', doctorId)
        .or(`patient.first_name.ilike.%${searchTerm}%,patient.last_name.ilike.%${searchTerm}%`);

      if (error) throw error;

      // Remove duplicates by patient_id
      const uniquePatients = data?.reduce((acc: any, curr: any) => {
        if (!acc.find((p: any) => p.patient_id === curr.patient_id)) {
          acc.push(curr);
        }
        return acc;
      }, []) || [];

      return { success: true, data: uniquePatients };
    } catch (error) {
      console.error('Error searching patients:', error);
      return { success: false, data: [], error: 'Failed to search patients' };
    }
  }
}

export const doctorAppointmentService = new DoctorAppointmentService();
