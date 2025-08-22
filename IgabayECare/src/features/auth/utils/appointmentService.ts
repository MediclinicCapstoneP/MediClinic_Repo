import { supabase } from '../../../lib/supabase';
import { 
  Appointment, 
  CreateAppointmentData, 
  UpdateAppointmentData, 
  AppointmentFilters,
  AppointmentWithDetails,
  AppointmentStats
} from '../../../types/appointments';

export class AppointmentService {
  private static TABLE_NAME = 'appointments';

  /**
   * Create a new appointment
   */
  static async createAppointment(data: CreateAppointmentData): Promise<Appointment | null> {
    try {
      const { data: appointment, error } = await supabase
        .from(this.TABLE_NAME)
        .insert(data)
        .select()
        .single();

      if (error) {
        console.error('Error creating appointment:', error);
        throw error;
      }

      return appointment;
    } catch (error) {
      console.error('Error creating appointment:', error);
      return null;
    }
  }

  /**
   * Get appointment by ID
   */
  static async getAppointmentById(id: string): Promise<Appointment | null> {
    try {
      const { data: appointment, error } = await supabase
        .from(this.TABLE_NAME)
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching appointment:', error);
        return null;
      }

      return appointment;
    } catch (error) {
      console.error('Error fetching appointment:', error);
      return null;
    }
  }

  /**
   * Get appointment with details (patient, clinic, doctor info)
   */
  static async getAppointmentWithDetails(id: string): Promise<AppointmentWithDetails | null> {
    try {
      const { data: appointment, error } = await supabase
        .from(this.TABLE_NAME)
        .select(`
          *,
          patient:patients(id, first_name, last_name, email, phone),
          clinic:clinics(id, clinic_name, address, city, state)
        `)
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching appointment with details:', error);
        return null;
      }

      return appointment;
    } catch (error) {
      console.error('Error fetching appointment with details:', error);
      return null;
    }
  }

  /**
   * Get appointments with filters
   */
  static async getAppointments(filters: AppointmentFilters = {}): Promise<Appointment[]> {
    try {
      let query = supabase
        .from(this.TABLE_NAME)
        .select('*')
        .order('appointment_date', { ascending: true })
        .order('appointment_time', { ascending: true });

      // Apply filters
      if (filters.patient_id) {
        query = query.eq('patient_id', filters.patient_id);
      }

      if (filters.clinic_id) {
        query = query.eq('clinic_id', filters.clinic_id);
      }

      if (filters.doctor_id) {
        query = query.eq('doctor_id', filters.doctor_id);
      }

      if (filters.appointment_date) {
        query = query.eq('appointment_date', filters.appointment_date);
      }

      if (filters.appointment_date_from) {
        query = query.gte('appointment_date', filters.appointment_date_from);
      }

      if (filters.appointment_date_to) {
        query = query.lte('appointment_date', filters.appointment_date_to);
      }

      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      if (filters.appointment_type) {
        query = query.eq('appointment_type', filters.appointment_type);
      }

      if (filters.priority) {
        query = query.eq('priority', filters.priority);
      }

      const { data: appointments, error } = await query;

      if (error) {
        console.error('Error fetching appointments:', error);
        return [];
      }

      return appointments || [];
    } catch (error) {
      console.error('Error fetching appointments:', error);
      return [];
    }
  }

  /**
   * Get appointments with details
   */
  static async getAppointmentsWithDetails(filters: AppointmentFilters = {}): Promise<AppointmentWithDetails[]> {
    try {
      let query = supabase
        .from(this.TABLE_NAME)
        .select(`
          *,
          patient:patients(id, first_name, last_name, email, phone),
          clinic:clinics(id, clinic_name, address, city, state)
        `)
        .order('appointment_date', { ascending: true })
        .order('appointment_time', { ascending: true });

      // Apply filters
      if (filters.patient_id) {
        query = query.eq('patient_id', filters.patient_id);
      }

      if (filters.clinic_id) {
        query = query.eq('clinic_id', filters.clinic_id);
      }

      if (filters.doctor_id) {
        query = query.eq('doctor_id', filters.doctor_id);
      }

      if (filters.appointment_date) {
        query = query.eq('appointment_date', filters.appointment_date);
      }

      if (filters.appointment_date_from) {
        query = query.gte('appointment_date', filters.appointment_date_from);
      }

      if (filters.appointment_date_to) {
        query = query.lte('appointment_date', filters.appointment_date_to);
      }

      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      if (filters.appointment_type) {
        query = query.eq('appointment_type', filters.appointment_type);
      }

      if (filters.priority) {
        query = query.eq('priority', filters.priority);
      }

      const { data: appointments, error } = await query;

      if (error) {
        console.error('Error fetching appointments with details:', error);
        return [];
      }

      return appointments || [];
    } catch (error) {
      console.error('Error fetching appointments with details:', error);
      return [];
    }
  }

  /**
   * Update appointment
   */
  static async updateAppointment(id: string, data: UpdateAppointmentData): Promise<Appointment | null> {
    try {
      const { data: appointment, error } = await supabase
        .from(this.TABLE_NAME)
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating appointment:', error);
        throw error;
      }

      return appointment;
    } catch (error) {
      console.error('Error updating appointment:', error);
      return null;
    }
  }

  /**
   * Delete appointment
   */
  static async deleteAppointment(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from(this.TABLE_NAME)
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting appointment:', error);
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Error deleting appointment:', error);
      return false;
    }
  }

  /**
   * Cancel appointment
   */
  static async cancelAppointment(id: string, reason?: string): Promise<Appointment | null> {
    try {
      const updateData: UpdateAppointmentData = {
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        cancellation_reason: reason
      };

      return await this.updateAppointment(id, updateData);
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      return null;
    }
  }

  /**
   * Confirm appointment
   */
  static async confirmAppointment(id: string): Promise<Appointment | null> {
    try {
      const updateData: UpdateAppointmentData = {
        status: 'confirmed',
        confirmation_sent: true,
        confirmation_sent_at: new Date().toISOString()
      };

      return await this.updateAppointment(id, updateData);
    } catch (error) {
      console.error('Error confirming appointment:', error);
      return null;
    }
  }

  /**
   * Complete appointment
   */
  static async completeAppointment(id: string): Promise<Appointment | null> {
    try {
      const updateData: UpdateAppointmentData = {
        status: 'completed'
      };

      return await this.updateAppointment(id, updateData);
    } catch (error) {
      console.error('Error completing appointment:', error);
      return null;
    }
  }

  /**
   * Get appointment statistics
   */
  static async getAppointmentStats(patientId?: string, clinicId?: string): Promise<AppointmentStats> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const startOfWeek = new Date();
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
      const startOfWeekStr = startOfWeek.toISOString().split('T')[0];
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      const startOfMonthStr = startOfMonth.toISOString().split('T')[0];

      let baseQuery = supabase.from(this.TABLE_NAME).select('status, appointment_date');

      if (patientId) {
        baseQuery = baseQuery.eq('patient_id', patientId);
      }

      if (clinicId) {
        baseQuery = baseQuery.eq('clinic_id', clinicId);
      }

      const { data: appointments, error } = await baseQuery;

      if (error) {
        console.error('Error fetching appointment stats:', error);
        return this.getDefaultStats();
      }

      const stats: AppointmentStats = {
        total: appointments?.length || 0,
        scheduled: appointments?.filter(a => a.status === 'scheduled').length || 0,
        confirmed: appointments?.filter(a => a.status === 'confirmed').length || 0,
        completed: appointments?.filter(a => a.status === 'completed').length || 0,
        cancelled: appointments?.filter(a => a.status === 'cancelled').length || 0,
        no_show: appointments?.filter(a => a.status === 'no_show').length || 0,
        today: appointments?.filter(a => a.appointment_date === today).length || 0,
        this_week: appointments?.filter(a => a.appointment_date >= startOfWeekStr).length || 0,
        this_month: appointments?.filter(a => a.appointment_date >= startOfMonthStr).length || 0
      };

      return stats;
    } catch (error) {
      console.error('Error calculating appointment stats:', error);
      return this.getDefaultStats();
    }
  }

  /**
   * Get available time slots for a specific date and clinic
   */
  static async getAvailableTimeSlots(
    clinicId: string, 
    date: string, 
    durationMinutes: number = 30
  ): Promise<string[]> {
    try {
      // Get existing appointments for the date and clinic
      const { data: existingAppointments, error } = await supabase
        .from(this.TABLE_NAME)
        .select('appointment_time, duration_minutes')
        .eq('clinic_id', clinicId)
        .eq('appointment_date', date)
        .not('status', 'in', ['cancelled', 'no_show']);

      if (error) {
        console.error('Error fetching existing appointments:', error);
        return [];
      }

      // Generate all possible time slots (8 AM to 6 PM, 30-minute intervals)
      const timeSlots: string[] = [];
      const startHour = 8;
      const endHour = 18;

      for (let hour = startHour; hour < endHour; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
          const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:00`;
          timeSlots.push(time);
        }
      }

      // Filter out occupied time slots
      const occupiedSlots = new Set<string>();
      existingAppointments?.forEach(appointment => {
        const startTime = appointment.appointment_time;
        const duration = appointment.duration_minutes || 30;
        
        // Mark all time slots that overlap with this appointment
        for (let i = 0; i < duration; i += 30) {
          const slotTime = new Date(`2000-01-01T${startTime}`);
          slotTime.setMinutes(slotTime.getMinutes() + i);
          const slotTimeStr = slotTime.toTimeString().split(' ')[0];
          occupiedSlots.add(slotTimeStr);
        }
      });

      return timeSlots.filter(slot => !occupiedSlots.has(slot));
    } catch (error) {
      console.error('Error getting available time slots:', error);
      return [];
    }
  }

  /**
   * Check if a time slot is available
   */
  static async isTimeSlotAvailable(
    clinicId: string, 
    date: string, 
    time: string, 
    durationMinutes: number = 30
  ): Promise<boolean> {
    try {
      const { data: conflictingAppointments, error } = await supabase
        .from(this.TABLE_NAME)
        .select('appointment_time, duration_minutes')
        .eq('clinic_id', clinicId)
        .eq('appointment_date', date)
        .not('status', 'in', ['cancelled', 'no_show'])
        .or(`appointment_time.lt.${time},appointment_time.gte.${time}`);

      if (error) {
        console.error('Error checking time slot availability:', error);
        return false;
      }

      // Check for conflicts
      const appointmentStart = new Date(`2000-01-01T${time}`);
      const appointmentEnd = new Date(appointmentStart.getTime() + durationMinutes * 60000);

      for (const appointment of conflictingAppointments || []) {
        const existingStart = new Date(`2000-01-01T${appointment.appointment_time}`);
        const existingEnd = new Date(existingStart.getTime() + (appointment.duration_minutes || 30) * 60000);

        if (appointmentStart < existingEnd && appointmentEnd > existingStart) {
          return false; // Conflict found
        }
      }

      return true;
    } catch (error) {
      console.error('Error checking time slot availability:', error);
      return false;
    }
  }

  private static getDefaultStats(): AppointmentStats {
    return {
      total: 0,
      scheduled: 0,
      confirmed: 0,
      completed: 0,
      cancelled: 0,
      no_show: 0,
      today: 0,
      this_week: 0,
      this_month: 0
    };
  }
} 