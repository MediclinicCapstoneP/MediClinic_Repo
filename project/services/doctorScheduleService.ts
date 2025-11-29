import { supabase } from '../lib/supabase';

export interface TimeSlot {
  id: string;
  doctor_id: string;
  day_of_week: number; // 0 = Sunday, 1 = Monday, etc.
  start_time: string;
  end_time: string;
  is_available: boolean;
  max_appointments: number;
  created_at: string;
  updated_at: string;
}

export interface BlockedDate {
  id: string;
  doctor_id: string;
  date: string;
  reason?: string;
  created_at: string;
}

export interface ScheduleSettings {
  id: string;
  doctor_id: string;
  consultation_duration: number; // in minutes
  buffer_time: number; // in minutes between appointments
  advance_booking_days: number;
  auto_confirm: boolean;
  working_days: number[]; // Array of day numbers
  created_at: string;
  updated_at: string;
}

export interface AvailableSlot {
  date: string;
  time: string;
  available: boolean;
}

class DoctorScheduleService {
  async getTimeSlots(doctorId: string): Promise<{ success: boolean; data: TimeSlot[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('doctor_time_slots')
        .select('*')
        .eq('doctor_id', doctorId)
        .order('day_of_week', { ascending: true });

      if (error) throw error;

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error fetching time slots:', error);
      return { success: false, data: [], error: 'Failed to fetch time slots' };
    }
  }

  async createTimeSlot(
    timeSlot: Omit<TimeSlot, 'id' | 'created_at' | 'updated_at'>
  ): Promise<{ success: boolean; data?: TimeSlot; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('doctor_time_slots')
        .insert({
          ...timeSlot,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      console.error('Error creating time slot:', error);
      return { success: false, error: 'Failed to create time slot' };
    }
  }

  async updateTimeSlot(
    slotId: string,
    updates: Partial<TimeSlot>,
    doctorId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('doctor_time_slots')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', slotId)
        .eq('doctor_id', doctorId);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Error updating time slot:', error);
      return { success: false, error: 'Failed to update time slot' };
    }
  }

  async deleteTimeSlot(
    slotId: string,
    doctorId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('doctor_time_slots')
        .delete()
        .eq('id', slotId)
        .eq('doctor_id', doctorId);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Error deleting time slot:', error);
      return { success: false, error: 'Failed to delete time slot' };
    }
  }

  async getBlockedDates(doctorId: string): Promise<{ success: boolean; data: BlockedDate[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('doctor_blocked_dates')
        .select('*')
        .eq('doctor_id', doctorId)
        .order('date', { ascending: true });

      if (error) throw error;

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error fetching blocked dates:', error);
      return { success: false, data: [], error: 'Failed to fetch blocked dates' };
    }
  }

  async addBlockedDate(
    blockedDate: Omit<BlockedDate, 'id' | 'created_at'>
  ): Promise<{ success: boolean; data?: BlockedDate; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('doctor_blocked_dates')
        .insert({
          ...blockedDate,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      console.error('Error adding blocked date:', error);
      return { success: false, error: 'Failed to add blocked date' };
    }
  }

  async removeBlockedDate(
    dateId: string,
    doctorId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('doctor_blocked_dates')
        .delete()
        .eq('id', dateId)
        .eq('doctor_id', doctorId);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Error removing blocked date:', error);
      return { success: false, error: 'Failed to remove blocked date' };
    }
  }

  async getScheduleSettings(doctorId: string): Promise<{ success: boolean; data: ScheduleSettings | null; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('doctor_schedule_settings')
        .select('*')
        .eq('doctor_id', doctorId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
        throw error;
      }

      return { success: true, data: data || null };
    } catch (error) {
      console.error('Error fetching schedule settings:', error);
      return { success: false, data: null, error: 'Failed to fetch schedule settings' };
    }
  }

  async updateScheduleSettings(
    settings: Partial<ScheduleSettings>,
    doctorId: string
  ): Promise<{ success: boolean; data?: ScheduleSettings; error?: string }> {
    try {
      // Check if settings exist
      const { data: existingSettings } = await supabase
        .from('doctor_schedule_settings')
        .select('id')
        .eq('doctor_id', doctorId)
        .single();

      let result;
      if (existingSettings) {
        // Update existing
        const { data, error } = await supabase
          .from('doctor_schedule_settings')
          .update({
            ...settings,
            updated_at: new Date().toISOString()
          })
          .eq('doctor_id', doctorId)
          .select()
          .single();

        if (error) throw error;
        result = data;
      } else {
        // Create new
        const { data, error } = await supabase
          .from('doctor_schedule_settings')
          .insert({
            ...settings,
            doctor_id: doctorId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (error) throw error;
        result = data;
      }

      return { success: true, data: result };
    } catch (error) {
      console.error('Error updating schedule settings:', error);
      return { success: false, error: 'Failed to update schedule settings' };
    }
  }

  async getAvailableSlots(
    doctorId: string,
    date: string
  ): Promise<{ success: boolean; data: AvailableSlot[]; error?: string }> {
    try {
      const targetDate = new Date(date);
      const dayOfWeek = targetDate.getDay(); // 0 = Sunday, 1 = Monday, etc.

      // Get time slots for this day of week
      const { data: timeSlots, error: slotsError } = await supabase
        .from('doctor_time_slots')
        .select('*')
        .eq('doctor_id', doctorId)
        .eq('day_of_week', dayOfWeek)
        .eq('is_available', true);

      if (slotsError) throw slotsError;

      // Check if date is blocked
      const { data: blockedDates } = await supabase
        .from('doctor_blocked_dates')
        .select('id')
        .eq('doctor_id', doctorId)
        .eq('date', date);

      if (blockedDates && blockedDates.length > 0) {
        return { success: true, data: [] }; // Date is blocked
      }

      // Get existing appointments for this date
      const { data: appointments, error: apptError } = await supabase
        .from('appointments')
        .select('appointment_time')
        .eq('doctor_id', doctorId)
        .eq('appointment_date', date)
        .in('status', ['scheduled', 'confirmed', 'payment_confirmed', 'in_progress']);

      if (apptError) throw apptError;

      // Get schedule settings
      const { data: settings } = await this.getScheduleSettings(doctorId);
      const consultationDuration = settings?.consultation_duration || 30; // Default 30 minutes
      const bufferTime = settings?.buffer_time || 0;

      const bookedTimes = new Set(appointments?.map(apt => apt.appointment_time) || []);
      const availableSlots: AvailableSlot[] = [];

      // Generate time slots
      for (const slot of timeSlots || []) {
        const startTime = new Date(`2000-01-01T${slot.start_time}`);
        const endTime = new Date(`2000-01-01T${slot.end_time}`);
        
        let currentTime = new Date(startTime);
        let appointmentCount = 0;

        while (currentTime < endTime) {
          const timeString = currentTime.toTimeString().slice(0, 5); // HH:MM format
          
          if (!bookedTimes.has(timeString) && appointmentCount < (slot.max_appointments || 1)) {
            availableSlots.push({
              date: date,
              time: timeString,
              available: true
            });
          }
          
          // Move to next slot
          currentTime.setMinutes(currentTime.getMinutes() + consultationDuration + bufferTime);
          appointmentCount++;
        }
      }

      return { success: true, data: availableSlots };
    } catch (error) {
      console.error('Error fetching available slots:', error);
      return { success: false, data: [], error: 'Failed to fetch available slots' };
    }
  }

  async getWeeklySchedule(
    doctorId: string,
    startDate: string
  ): Promise<{ success: boolean; data: { [date: string]: AvailableSlot[] }; error?: string }> {
    try {
      const weeklySchedule: { [date: string]: AvailableSlot[] } = {};
      const start = new Date(startDate);

      // Get schedule for the next 7 days
      for (let i = 0; i < 7; i++) {
        const currentDate = new Date(start);
        currentDate.setDate(start.getDate() + i);
        const dateString = currentDate.toISOString().split('T')[0];

        const { data: slots } = await this.getAvailableSlots(doctorId, dateString);
        weeklySchedule[dateString] = slots || [];
      }

      return { success: true, data: weeklySchedule };
    } catch (error) {
      console.error('Error fetching weekly schedule:', error);
      return { success: false, data: {}, error: 'Failed to fetch weekly schedule' };
    }
  }

  async isTimeAvailable(
    doctorId: string,
    date: string,
    time: string
  ): Promise<{ success: boolean; available: boolean; error?: string }> {
    try {
      const { data: slots } = await this.getAvailableSlots(doctorId, date);
      const available = slots?.some(slot => slot.time === time && slot.available) || false;

      return { success: true, available };
    } catch (error) {
      console.error('Error checking time availability:', error);
      return { success: false, available: false, error: 'Failed to check time availability' };
    }
  }

  async getWorkingDays(doctorId: string): Promise<{ success: boolean; data: number[]; error?: string }> {
    try {
      const { data: settings } = await this.getScheduleSettings(doctorId);
      
      if (settings?.working_days) {
        return { success: true, data: settings.working_days };
      }

      // Fallback to time slots if no settings
      const { data: timeSlots } = await this.getTimeSlots(doctorId);
      const workingDays = [...new Set(timeSlots?.map(slot => slot.day_of_week) || [])];

      return { success: true, data: workingDays };
    } catch (error) {
      console.error('Error fetching working days:', error);
      return { success: false, data: [], error: 'Failed to fetch working days' };
    }
  }
}

export const doctorScheduleService = new DoctorScheduleService();
