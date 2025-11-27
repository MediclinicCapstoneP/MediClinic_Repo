import { supabase } from '../../../supabaseClient';

export interface DoctorSchedule {
  id: string;
  doctor_id: string;
  day_of_week: number; // 0 = Sunday, 1 = Monday, etc.
  start_time: string;
  end_time: string;
  is_available: boolean;
  break_start?: string;
  break_end?: string;
  max_appointments?: number;
  appointment_duration?: number; // in minutes
  created_at: string;
  updated_at: string;
}

export interface TimeSlot {
  time: string;
  available: boolean;
  booked: boolean;
  appointmentId?: string;
}

export interface DaySchedule {
  date: string;
  dayOfWeek: number;
  isAvailable: boolean;
  timeSlots: TimeSlot[];
  totalSlots: number;
  bookedSlots: number;
  availableSlots: number;
}

export interface ScheduleSettings {
  doctor_id: string;
  default_appointment_duration: number;
  buffer_time: number;
  advance_booking_days: number;
  allow_weekend_appointments: boolean;
  auto_confirm_appointments: boolean;
  working_days: number[]; // Array of day numbers (0-6)
  working_hours: {
    start: string;
    end: string;
  };
  break_times: {
    start: string;
    end: string;
  }[];
  blocked_dates: string[]; // Array of blocked dates in YYYY-MM-DD format
}

class DoctorScheduleService {
  /**
   * Get doctor's weekly schedule
   */
  async getDoctorSchedule(doctorId: string): Promise<{
    success: boolean;
    schedule?: DoctorSchedule[];
    error?: string;
  }> {
    try {
      const { data: schedule, error } = await supabase
        .from('doctor_schedules')
        .select('*')
        .eq('doctor_id', doctorId)
        .order('day_of_week', { ascending: true });

      if (error) {
        console.error('Error fetching doctor schedule:', error);
        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: true,
        schedule: schedule || []
      };
    } catch (error) {
      console.error('Error fetching doctor schedule:', error);
      return {
        success: false,
        error: 'Failed to fetch schedule'
      };
    }
  }

  /**
   * Update doctor's weekly schedule
   */
  async updateDoctorSchedule(
    doctorId: string,
    scheduleData: Omit<DoctorSchedule, 'id' | 'doctor_id' | 'created_at' | 'updated_at'>[]
  ): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      // Delete existing schedule
      await supabase
        .from('doctor_schedules')
        .delete()
        .eq('doctor_id', doctorId);

      // Insert new schedule
      const scheduleToInsert = scheduleData.map(schedule => ({
        ...schedule,
        doctor_id: doctorId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));

      const { error } = await supabase
        .from('doctor_schedules')
        .insert(scheduleToInsert);

      if (error) {
        console.error('Error updating doctor schedule:', error);
        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: true
      };
    } catch (error) {
      console.error('Error updating doctor schedule:', error);
      return {
        success: false,
        error: 'Failed to update schedule'
      };
    }
  }

  /**
   * Get available time slots for a specific date
   */
  async getAvailableTimeSlots(
    doctorId: string,
    date: string,
    appointmentDuration: number = 30
  ): Promise<{
    success: boolean;
    timeSlots?: TimeSlot[];
    error?: string;
  }> {
    try {
      const dayOfWeek = new Date(date).getDay();

      // Get doctor's schedule for this day
      const { data: daySchedule, error: scheduleError } = await supabase
        .from('doctor_schedules')
        .select('*')
        .eq('doctor_id', doctorId)
        .eq('day_of_week', dayOfWeek)
        .eq('is_available', true)
        .single();

      if (scheduleError || !daySchedule) {
        return {
          success: true,
          timeSlots: [] // No availability for this day
        };
      }

      // Get existing appointments for this date
      const { data: appointments, error: appointmentsError } = await supabase
        .from('appointments')
        .select('appointment_time, status')
        .eq('doctor_id', doctorId)
        .eq('appointment_date', date)
        .in('status', ['confirmed', 'scheduled', 'in-progress']);

      if (appointmentsError) {
        console.error('Error fetching appointments:', appointmentsError);
        return {
          success: false,
          error: appointmentsError.message
        };
      }

      // Generate time slots
      const timeSlots = this.generateTimeSlots(
        daySchedule.start_time,
        daySchedule.end_time,
        appointmentDuration,
        daySchedule.break_start,
        daySchedule.break_end,
        appointments || []
      );

      return {
        success: true,
        timeSlots
      };
    } catch (error) {
      console.error('Error getting available time slots:', error);
      return {
        success: false,
        error: 'Failed to get available time slots'
      };
    }
  }

  /**
   * Get doctor's schedule for a date range
   */
  async getDoctorScheduleRange(
    doctorId: string,
    startDate: string,
    endDate: string
  ): Promise<{
    success: boolean;
    schedule?: DaySchedule[];
    error?: string;
  }> {
    try {
      const schedule: DaySchedule[] = [];
      const currentDate = new Date(startDate);
      const end = new Date(endDate);

      while (currentDate <= end) {
        const dateStr = currentDate.toISOString().split('T')[0];

        // Get time slots for this date
        const timeSlotsResult = await this.getAvailableTimeSlots(doctorId, dateStr);
        const timeSlots = timeSlotsResult.timeSlots || [];

        const daySchedule: DaySchedule = {
          date: dateStr,
          dayOfWeek: currentDate.getDay(),
          isAvailable: timeSlots.length > 0,
          timeSlots,
          totalSlots: timeSlots.length,
          bookedSlots: timeSlots.filter(slot => slot.booked).length,
          availableSlots: timeSlots.filter(slot => slot.available && !slot.booked).length
        };

        schedule.push(daySchedule);
        currentDate.setDate(currentDate.getDate() + 1);
      }

      return {
        success: true,
        schedule
      };
    } catch (error) {
      console.error('Error getting doctor schedule range:', error);
      return {
        success: false,
        error: 'Failed to get schedule range'
      };
    }
  }

  /**
   * Block/unblock a specific date
   */
  async toggleDateAvailability(
    doctorId: string,
    date: string,
    isBlocked: boolean
  ): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      // This would typically be stored in a separate table for blocked dates
      // For now, we'll use a simple approach with the doctor_schedules table

      if (isBlocked) {
        // Create a blocked entry for this specific date
        const { error } = await supabase
          .from('doctor_blocked_dates')
          .insert({
            doctor_id: doctorId,
            blocked_date: date,
            reason: 'Manually blocked',
            created_at: new Date().toISOString()
          });

        if (error) {
          console.error('Error blocking date:', error);
          return {
            success: false,
            error: error.message
          };
        }
      } else {
        // Remove blocked entry
        const { error } = await supabase
          .from('doctor_blocked_dates')
          .delete()
          .eq('doctor_id', doctorId)
          .eq('blocked_date', date);

        if (error) {
          console.error('Error unblocking date:', error);
          return {
            success: false,
            error: error.message
          };
        }
      }

      return {
        success: true
      };
    } catch (error) {
      console.error('Error toggling date availability:', error);
      return {
        success: false,
        error: 'Failed to update date availability'
      };
    }
  }

  /**
   * Get doctor's schedule settings
   */
  async getScheduleSettings(doctorId: string): Promise<{
    success: boolean;
    settings?: ScheduleSettings;
    error?: string;
  }> {
    try {
      const { data: settings, error } = await supabase
        .from('doctor_schedule_settings')
        .select('*')
        .eq('doctor_id', doctorId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        console.error('Error fetching schedule settings:', error);
        return {
          success: false,
          error: error.message
        };
      }

      // Return default settings if none found
      const defaultSettings: ScheduleSettings = {
        doctor_id: doctorId,
        default_appointment_duration: 30,
        buffer_time: 5,
        advance_booking_days: 30,
        allow_weekend_appointments: false,
        auto_confirm_appointments: true,
        working_days: [1, 2, 3, 4, 5], // Monday to Friday
        working_hours: {
          start: '09:00',
          end: '17:00'
        },
        break_times: [
          {
            start: '12:00',
            end: '13:00'
          }
        ],
        blocked_dates: []
      };

      return {
        success: true,
        settings: settings || defaultSettings
      };
    } catch (error) {
      console.error('Error fetching schedule settings:', error);
      return {
        success: false,
        error: 'Failed to fetch schedule settings'
      };
    }
  }

  /**
   * Update doctor's schedule settings
   */
  async updateScheduleSettings(
    doctorId: string,
    settings: Partial<ScheduleSettings>
  ): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const { error } = await supabase
        .from('doctor_schedule_settings')
        .upsert({
          ...settings,
          doctor_id: doctorId,
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error updating schedule settings:', error);
        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: true
      };
    } catch (error) {
      console.error('Error updating schedule settings:', error);
      return {
        success: false,
        error: 'Failed to update schedule settings'
      };
    }
  }

  /**
   * Generate time slots for a given time range
   */
  private generateTimeSlots(
    startTime: string,
    endTime: string,
    duration: number,
    breakStart?: string,
    breakEnd?: string,
    existingAppointments: any[] = []
  ): TimeSlot[] {
    const slots: TimeSlot[] = [];
    const start = this.timeToMinutes(startTime);
    const end = this.timeToMinutes(endTime);
    const breakStartMinutes = breakStart ? this.timeToMinutes(breakStart) : null;
    const breakEndMinutes = breakEnd ? this.timeToMinutes(breakEnd) : null;

    // Create a set of booked times for quick lookup
    const bookedTimes = new Set(
      existingAppointments.map(apt => apt.appointment_time)
    );

    for (let minutes = start; minutes < end; minutes += duration) {
      const timeStr = this.minutesToTime(minutes);
      
      // Skip if this slot is during break time
      if (breakStartMinutes && breakEndMinutes && 
          minutes >= breakStartMinutes && minutes < breakEndMinutes) {
        continue;
      }

      // Check if this slot extends past the end time
      if (minutes + duration > end) {
        break;
      }

      const isBooked = bookedTimes.has(timeStr);
      
      slots.push({
        time: timeStr,
        available: !isBooked,
        booked: isBooked,
        appointmentId: isBooked ? 
          existingAppointments.find(apt => apt.appointment_time === timeStr)?.id : 
          undefined
      });
    }

    return slots;
  }

  /**
   * Convert time string (HH:MM) to minutes since midnight
   */
  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  /**
   * Convert minutes since midnight to time string (HH:MM)
   */
  private minutesToTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }
}

export const doctorScheduleService = new DoctorScheduleService();
export default doctorScheduleService;
