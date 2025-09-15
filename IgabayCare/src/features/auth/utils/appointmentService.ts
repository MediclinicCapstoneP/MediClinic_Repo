import { supabase } from '../../../supabaseClient';
import { 
  Appointment, 
  CreateAppointmentData, 
  UpdateAppointmentData, 
  AppointmentFilters,
  AppointmentWithDetails,
  AppointmentStats
} from '../../../types/appointments';
import googleCalendarService from '../../../services/googleCalendarService';

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

      // Try to create Google Calendar event
      if (appointment) {
        try {
          // Get patient and doctor details for the calendar event
          const patientQuery = supabase
            .from('patients')
            .select('first_name, last_name, email')
            .eq('id', appointment.patient_id)
            .single();

          const doctorQuery = appointment.doctor_id 
            ? supabase
                .from('doctors')
                .select('full_name, email')
                .eq('id', appointment.doctor_id)
                .single()
            : null;

          const [patientResult, doctorResult] = await Promise.all([
            patientQuery,
            doctorQuery
          ]);

          const patient = patientResult.data;
          const doctor = doctorResult?.data;

          const googleCalendarEventId = await googleCalendarService.createAppointmentEvent({
            patientName: patient ? `${patient.first_name} ${patient.last_name}` : 'Unknown Patient',
            doctorName: doctor ? `Dr. ${doctor.full_name}` : 'Unknown Doctor',
            service: appointment.appointment_type || 'Medical Consultation',
            date: appointment.appointment_date,
            time: appointment.appointment_time,
            duration: appointment.duration_minutes || 30,
            patientEmail: patient?.email,
            doctorEmail: doctor?.email,
            notes: appointment.patient_notes || appointment.notes
          });

          // Update appointment with Google Calendar event ID if created successfully
          if (googleCalendarEventId) {
            await supabase
              .from(this.TABLE_NAME)
              .update({ google_calendar_event_id: googleCalendarEventId })
              .eq('id', appointment.id);
            
            // Update the returned appointment object
            appointment.google_calendar_event_id = googleCalendarEventId;
            console.log('Google Calendar event created:', googleCalendarEventId);
          }
        } catch (calendarError) {
          console.warn('Failed to create Google Calendar event (appointment still created):', calendarError);
          // Don't fail the appointment creation if calendar creation fails
        }
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
   * Get appointments with details for clinics (enhanced with patient info)
   */
  static async getClinicAppointmentsWithPatientDetails(filters: AppointmentFilters = {}): Promise<AppointmentWithDetails[]> {
    try {
      console.log('🔍 Fetching clinic appointments with patient details for filters:', filters);
      
      // Try the direct join approach first (most efficient)
      const joinResult = await this.getAppointmentsWithDirectJoin(filters);
      if (joinResult && joinResult.length > 0) {
        // Check if we got meaningful patient data
        const hasValidPatientData = joinResult.some(apt => 
          apt.patient && (apt.patient.first_name || apt.patient.last_name)
        );
        
        if (hasValidPatientData) {
          console.log('✅ Successfully fetched appointments with direct join');
          return joinResult;
        }
        
        console.log('⚠️ Join returned appointments but no valid patient data, trying manual lookup...');
      }
      
      // Fallback to manual patient lookup for better reliability
      return await this.getAppointmentsWithManualPatientLookup(filters);
    } catch (error) {
      console.error('💥 Unexpected error fetching clinic appointments with patient details:', error);
      // Ultimate fallback to basic appointments
      return await this.getAppointments(filters);
    }
  }

  /**
   * Direct join method to fetch appointments with patient details
   */
  private static async getAppointmentsWithDirectJoin(filters: AppointmentFilters = {}): Promise<AppointmentWithDetails[]> {
    try {
      console.log('🔗 Using direct join method for appointments with patient details...');
      
      let query = supabase
        .from(this.TABLE_NAME)
        .select(`
          *,
          patient:patients(
            id, 
            first_name, 
            last_name, 
            email, 
            phone,
            date_of_birth
          ),
          clinic:clinics(
            id, 
            clinic_name, 
            address, 
            city, 
            state,
            phone,
            email
          ),
          doctor:doctors(
            id,
            full_name,
            specialization,
            email
          )
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
        console.error('❌ Error in direct join query:', error);
        throw error;
      }

      console.log('📋 Direct join query returned', appointments?.length || 0, 'appointments');
      if (appointments && appointments.length > 0) {
        console.log('👤 Sample patient data from join:', appointments[0].patient);
      }

      return appointments || [];
      
    } catch (error) {
      console.error('💥 Error in direct join method:', error);
      throw error;
    }
  }

  /**
   * Fallback method to manually fetch patient details for appointments
   */
  private static async getAppointmentsWithManualPatientLookup(filters: AppointmentFilters = {}): Promise<AppointmentWithDetails[]> {
    try {
      console.log('🔄 Using manual patient lookup method...');
      
      // First get the basic appointments
      const appointments = await this.getAppointments(filters);
      
      if (!appointments || appointments.length === 0) {
        return [];
      }

      console.log('📝 Found', appointments.length, 'appointments, fetching patient details...');

      // Get unique patient IDs
      const patientIds = [...new Set(appointments.map(apt => apt.patient_id).filter(Boolean))];
      console.log('👥 Unique patient IDs:', patientIds);

      if (patientIds.length === 0) {
        return appointments;
      }

      // Fetch patient details for all patient IDs
      const { data: patients, error: patientError } = await supabase
        .from('patients')
        .select('id, first_name, last_name, email, phone')
        .in('id', patientIds);

      if (patientError) {
        console.error('❌ Error fetching patient details:', patientError);
        return appointments; // Return appointments without patient details
      }

      console.log('✅ Fetched', patients?.length || 0, 'patient records');
      console.log('👤 Sample patient data:', patients?.[0]);

      // Create a map of patient ID to enhanced patient data
      const patientMap = new Map();
      patients?.forEach(patient => {
        // Construct full_name from first_name and last_name since full_name column doesn't exist
        const enhancedPatient = {
          ...patient,
          full_name: patient.first_name && patient.last_name 
                     ? `${patient.first_name} ${patient.last_name}` 
                     : patient.first_name || patient.last_name || 'Unknown Patient'
        };
        patientMap.set(patient.id, enhancedPatient);
      });

      // Enhance appointments with patient data
      const enhancedAppointments = appointments.map(appointment => ({
        ...appointment,
        patient: patientMap.get(appointment.patient_id) || null
      }));

      console.log('🎯 Enhanced appointments with patient data');
      return enhancedAppointments;
      
    } catch (error) {
      console.error('💥 Error in manual patient lookup:', error);
      return await this.getAppointments(filters);
    }
  }

  /**
   * Comprehensive patient name resolution function
   */
  static resolvePatientName(appointment: any): string {
    console.log('🔍 Resolving patient name for appointment:', appointment.id?.substring(0, 8));
    
    // Priority 1: Use patient_name from appointment table (if properly populated)
    if (appointment.patient_name && 
        appointment.patient_name.trim() && 
        !appointment.patient_name.startsWith('Patient ID:') &&
        appointment.patient_name !== 'Unknown Patient') {
      console.log('✅ Using appointment.patient_name:', appointment.patient_name);
      return appointment.patient_name.trim();
    }

    // Priority 2: Use patient object from join (if available)
    if (appointment.patient && typeof appointment.patient === 'object') {
      console.log('🔍 Found patient object:', appointment.patient);
      
      // Try full_name from patient object
      if (appointment.patient.full_name?.trim()) {
        const fullName = appointment.patient.full_name.trim();
        console.log('✅ Using patient.full_name:', fullName);
        return fullName;
      }
      
      // Try constructing from first_name and last_name
      const firstName = appointment.patient.first_name?.trim();
      const lastName = appointment.patient.last_name?.trim();
      
      if (firstName && lastName) {
        const constructedName = `${firstName} ${lastName}`;
        console.log('✅ Constructed name from first + last:', constructedName);
        return constructedName;
      }
      
      if (firstName) {
        console.log('✅ Using first name only:', firstName);
        return firstName;
      }
      
      if (lastName) {
        console.log('✅ Using last name only:', lastName);
        return lastName;
      }
      
      // Try email local part if available
      if (appointment.patient.email) {
        const emailLocal = appointment.patient.email.split('@')[0];
        const emailName = `User (${emailLocal})`;
        console.log('📞 Using email-based name:', emailName);
        return emailName;
      }
    }
    
    // Priority 3: Try to use patient_id to create a meaningful fallback
    if (appointment.patient_id) {
      // For UUIDs, take the last 8 characters for readability
      const shortId = appointment.patient_id.length > 8 ? 
        appointment.patient_id.slice(-8) : 
        appointment.patient_id;
      const fallbackName = `Patient (${shortId})`;
      console.log('🆔 Using patient ID fallback:', fallbackName);
      return fallbackName;
    }
    
    // Ultimate fallback
    console.log('⚠️ Using ultimate fallback: Unknown Patient');
    return 'Unknown Patient';
  }

  /**
   * Simple method to populate patient names in appointments
   */
  static async populatePatientNames(appointments: Appointment[]): Promise<Appointment[]> {
    if (!appointments || appointments.length === 0) {
      return appointments;
    }

    try {
      // Get unique patient IDs
      const patientIds = [...new Set(appointments.map(apt => apt.patient_id).filter(Boolean))];
      
      if (patientIds.length === 0) {
        return appointments;
      }

      // Fetch comprehensive patient data
      const { data: patients, error } = await supabase
        .from('patients')
        .select('id, first_name, last_name, email')
        .in('id', patientIds);

      if (error) {
        console.error('Error fetching patient names:', error);
        return appointments;
      }

      // Create patient data map
      const patientMap = new Map();
      patients?.forEach(patient => {
        // Create enhanced patient object
        const enhancedPatient = {
          ...patient,
          // Construct full_name from first_name and last_name since full_name column doesn't exist
          full_name: patient.first_name && patient.last_name 
                     ? `${patient.first_name} ${patient.last_name}`.trim()
                     : patient.first_name || patient.last_name || null
        };
        patientMap.set(patient.id, enhancedPatient);
      });

      // Enhance appointments with patient data and resolve names
      return appointments.map(appointment => {
        const patient = patientMap.get(appointment.patient_id);
        const enhancedAppointment = {
          ...appointment,
          patient: patient,
          patient_name: patient ? this.resolvePatientName({ ...appointment, patient }) : this.resolvePatientName(appointment)
        };
        return enhancedAppointment;
      });

    } catch (error) {
      console.error('Error populating patient names:', error);
      return appointments;
    }
  }

  /**
   * Get appointments with details
   */
  static async getAppointmentsWithDetails(filters: AppointmentFilters = {}): Promise<AppointmentWithDetails[]> {
    try {
      // First, try to get appointments with patient and clinic joins
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

      let { data: appointments, error } = await query;

      // If the query fails (possibly due to missing patients table or join issues),
      // fallback to a simple query without joins
      if (error) {
        console.warn('Failed to fetch appointments with joins, trying fallback query:', error.message);
        
        let fallbackQuery = supabase
          .from(this.TABLE_NAME)
          .select('*')
          .order('appointment_date', { ascending: true })
          .order('appointment_time', { ascending: true });

        // Apply same filters to fallback query
        if (filters.patient_id) {
          fallbackQuery = fallbackQuery.eq('patient_id', filters.patient_id);
        }
        if (filters.clinic_id) {
          fallbackQuery = fallbackQuery.eq('clinic_id', filters.clinic_id);
        }
        if (filters.doctor_id) {
          fallbackQuery = fallbackQuery.eq('doctor_id', filters.doctor_id);
        }
        if (filters.appointment_date) {
          fallbackQuery = fallbackQuery.eq('appointment_date', filters.appointment_date);
        }
        if (filters.appointment_date_from) {
          fallbackQuery = fallbackQuery.gte('appointment_date', filters.appointment_date_from);
        }
        if (filters.appointment_date_to) {
          fallbackQuery = fallbackQuery.lte('appointment_date', filters.appointment_date_to);
        }
        if (filters.status) {
          fallbackQuery = fallbackQuery.eq('status', filters.status);
        }
        if (filters.appointment_type) {
          fallbackQuery = fallbackQuery.eq('appointment_type', filters.appointment_type);
        }
        if (filters.priority) {
          fallbackQuery = fallbackQuery.eq('priority', filters.priority);
        }

        const fallbackResult = await fallbackQuery;
        appointments = fallbackResult.data;
        error = fallbackResult.error;
      }

      if (error) {
        console.error('Error fetching appointments:', error);
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
      // Create a copy of the data to avoid mutating the original
      const updateData = { ...data };
      
      const { data: appointment, error } = await supabase
        .from(this.TABLE_NAME)
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
    
      if (error) {
        console.error('Error updating appointment:', error);
        throw error;
      }

      // Try to update Google Calendar event if it exists
      if (appointment && appointment.google_calendar_event_id) {
        try {
          // Get patient and doctor details if they're being updated
          let patientName, doctorName, patientEmail, doctorEmail;
          
          if (data.patient_id || data.doctor_id) {
            const patientQuery = data.patient_id 
              ? supabase
                  .from('patients')
                  .select('first_name, last_name, email')
                  .eq('id', data.patient_id)
                  .single()
              : null;

            const doctorQuery = data.doctor_id 
              ? supabase
                  .from('doctors')
                  .select('first_name, last_name, email')
                  .eq('id', data.doctor_id)
                  .single()
              : null;

            if (patientQuery || doctorQuery) {
              const [patientResult, doctorResult] = await Promise.all([
                patientQuery,
                doctorQuery
              ]);

              const patient = patientResult?.data;
              const doctor = doctorResult?.data;
              
              patientName = patient ? `${patient.first_name} ${patient.last_name}` : undefined;
              doctorName = doctor ? `Dr. ${doctor.first_name} ${doctor.last_name}` : undefined;
              patientEmail = patient?.email;
              doctorEmail = doctor?.email;
            }
          }

          await googleCalendarService.updateAppointmentEvent(appointment.google_calendar_event_id, {
            patientName,
            doctorName,
            service: data.appointment_type,
            date: data.appointment_date,
            time: data.appointment_time,
            duration: data.duration_minutes,
            patientEmail,
            doctorEmail,
            notes: data.patient_notes || data.notes
          });
          
          console.log('Google Calendar event updated:', appointment.google_calendar_event_id);
        } catch (calendarError) {
          console.warn('Failed to update Google Calendar event:', calendarError);
          // Don't fail the appointment update if calendar update fails
        }
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
      // First, get the appointment to check if it has a Google Calendar event
      const { data: appointment, error: fetchError } = await supabase
        .from(this.TABLE_NAME)
        .select('google_calendar_event_id')
        .eq('id', id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = not found
        console.error('Error fetching appointment for deletion:', fetchError);
      }

      // Delete from database
      const { error } = await supabase
        .from(this.TABLE_NAME)
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting appointment:', error);
        throw error;
      }

      // Try to delete Google Calendar event if it exists
      if (appointment?.google_calendar_event_id) {
        try {
          await googleCalendarService.deleteAppointmentEvent(appointment.google_calendar_event_id);
          console.log('Google Calendar event deleted:', appointment.google_calendar_event_id);
        } catch (calendarError) {
          console.warn('Failed to delete Google Calendar event:', calendarError);
          // Don't fail the appointment deletion if calendar deletion fails
        }
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