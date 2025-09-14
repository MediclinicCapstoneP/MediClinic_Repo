import { supabase } from '../lib/supabase';
import { mlValidationService } from './mlValidationService';
import { adyenPaymentService } from './adyenPaymentService';

// Enhanced Appointment Types
export interface AppointmentBookingRequest {
  patientId: string;
  clinicId: string;
  doctorId?: string;
  appointmentDate: string;
  appointmentTime: string;
  appointmentType: string;
  duration: number;
  consultationFee: number;
  symptoms?: string;
  patientNotes?: string;
  paymentMethod: 'gcash' | 'paymaya' | 'card' | 'grabpay';
  skipMLValidation?: boolean; // For admin overrides
}

export interface AppointmentSlot {
  date: string;
  time: string;
  available: boolean;
  doctorId?: string;
  doctorName?: string;
  consultationFee: number;
  duration: number;
}

export interface ClinicAvailability {
  clinicId: string;
  clinicName: string;
  availableSlots: AppointmentSlot[];
  operatingHours: any;
  bookedSlots: string[];
}

export interface BookingValidationResult {
  isValid: boolean;
  mlScore?: number;
  riskLevel?: 'low' | 'medium' | 'high' | 'critical';
  flags?: string[];
  recommendation?: 'approve' | 'flag' | 'reject' | 'manual_review';
  requiresManualReview: boolean;
  blockers: string[];
  warnings: string[];
}

export interface EnhancedAppointment {
  id: string;
  patientId: string;
  clinicId: string;
  doctorId?: string;
  paymentId?: string;
  appointmentDate: string;
  appointmentTime: string;
  appointmentType: string;
  duration: number;
  status: string;
  paymentStatus: string;
  consultationFee: number;
  mlValidationStatus: string;
  mlScore?: number;
  patientInfo?: any;
  clinicInfo?: any;
  doctorInfo?: any;
  createdAt: string;
  updatedAt: string;
}

export class EnhancedAppointmentService {
  
  /**
   * Book appointment with ML validation and payment processing
   */
  async bookAppointment(request: AppointmentBookingRequest): Promise<{
    success: boolean;
    appointment?: EnhancedAppointment;
    paymentSession?: any;
    validationResult?: BookingValidationResult;
    error?: string;
  }> {
    try {
      console.log('Starting appointment booking process:', request);

      // Step 1: Validate booking request
      const validation = await this.validateBookingRequest(request);
      if (!validation.isValid) {
        return {
          success: false,
          validationResult: validation,
          error: `Booking validation failed: ${validation.blockers.join(', ')}`
        };
      }

      // Step 2: Check availability
      const isAvailable = await this.checkSlotAvailability(
        request.clinicId,
        request.appointmentDate,
        request.appointmentTime,
        request.duration
      );

      if (!isAvailable) {
        return {
          success: false,
          error: 'The selected time slot is no longer available'
        };
      }

      // Step 3: ML Validation (unless skipped)
      let mlValidationResult;
      if (!request.skipMLValidation) {
        mlValidationResult = await mlValidationService.validateBooking(
          request.patientId,
          request.clinicId,
          request
        );

        console.log('ML Validation Result:', mlValidationResult);

        // Handle ML validation results
        if (mlValidationResult.recommendation === 'reject') {
          return {
            success: false,
            validationResult: {
              isValid: false,
              mlScore: mlValidationResult.score,
              riskLevel: mlValidationResult.riskLevel,
              flags: mlValidationResult.flags,
              recommendation: mlValidationResult.recommendation,
              requiresManualReview: false,
              blockers: ['Booking blocked by fraud detection system'],
              warnings: []
            },
            error: 'Booking blocked due to suspicious activity. Please contact support.'
          };
        }
      }

      // Step 4: Create payment session
      const paymentResponse = await adyenPaymentService.createPaymentSession({
        patientId: request.patientId,
        clinicId: request.clinicId,
        amount: request.consultationFee,
        paymentMethod: request.paymentMethod,
        returnUrl: `${window.location.origin}/payment/return`
      });

      if (!paymentResponse.success || !paymentResponse.session) {
        return {
          success: false,
          error: 'Failed to create payment session'
        };
      }

      // Step 5: Create appointment with pending payment status
      const appointmentData = {
        patient_id: request.patientId,
        clinic_id: request.clinicId,
        doctor_id: request.doctorId,
        appointment_date: request.appointmentDate,
        appointment_time: request.appointmentTime,
        appointment_type: request.appointmentType,
        duration_minutes: request.duration,
        consultation_fee: request.consultationFee,
        status: 'pending_payment',
        payment_status: 'pending',
        symptoms: request.symptoms,
        patient_notes: request.patientNotes,
        ml_validation_status: mlValidationResult?.recommendation || 'skipped',
        booking_legitimacy_score: mlValidationResult?.score || 1.0,
        ml_flags: mlValidationResult?.flags || []
      };

      const { data: appointment, error: appointmentError } = await supabase
        .from('appointments')
        .insert(appointmentData)
        .select(`
          *,
          patients:patient_id (first_name, last_name, email, phone),
          clinics:clinic_id (clinic_name, address, phone),
          doctors:doctor_id (full_name, specialization)
        `)
        .single();

      if (appointmentError) {
        console.error('Error creating appointment:', appointmentError);
        return {
          success: false,
          error: 'Failed to create appointment'
        };
      }

      // Step 6: Send notifications
      await this.sendBookingNotifications(appointment.id, 'appointment_pending_payment');

      // Step 7: Schedule payment timeout
      await this.schedulePaymentTimeout(appointment.id);

      const enhancedAppointment: EnhancedAppointment = {
        id: appointment.id,
        patientId: appointment.patient_id,
        clinicId: appointment.clinic_id,
        doctorId: appointment.doctor_id,
        appointmentDate: appointment.appointment_date,
        appointmentTime: appointment.appointment_time,
        appointmentType: appointment.appointment_type,
        duration: appointment.duration_minutes,
        status: appointment.status,
        paymentStatus: appointment.payment_status,
        consultationFee: appointment.consultation_fee,
        mlValidationStatus: appointment.ml_validation_status,
        mlScore: appointment.booking_legitimacy_score,
        patientInfo: appointment.patients,
        clinicInfo: appointment.clinics,
        doctorInfo: appointment.doctors,
        createdAt: appointment.created_at,
        updatedAt: appointment.updated_at
      };

      return {
        success: true,
        appointment: enhancedAppointment,
        paymentSession: paymentResponse.session,
        validationResult: validation
      };

    } catch (error) {
      console.error('Error in bookAppointment:', error);
      return {
        success: false,
        error: 'An unexpected error occurred during booking'
      };
    }
  }

  /**
   * Get real-time clinic availability
   */
  async getClinicAvailability(
    clinicId: string,
    startDate: string,
    endDate: string
  ): Promise<ClinicAvailability> {
    try {
      // Get clinic information and operating hours
      const { data: clinic, error: clinicError } = await supabase
        .from('clinics')
        .select('id, clinic_name, operating_hours')
        .eq('id', clinicId)
        .single();

      if (clinicError || !clinic) {
        throw new Error('Clinic not found');
      }

      // Get existing appointments in date range
      const { data: existingAppointments, error: appointmentError } = await supabase
        .from('appointments')
        .select('appointment_date, appointment_time, duration_minutes, status')
        .eq('clinic_id', clinicId)
        .gte('appointment_date', startDate)
        .lte('appointment_date', endDate)
        .in('status', ['scheduled', 'confirmed', 'payment_confirmed', 'in_progress']);

      if (appointmentError) {
        throw appointmentError;
      }

      // Get doctors and their schedules
      const { data: doctors, error: doctorError } = await supabase
        .from('doctors')
        .select('id, full_name, consultation_fee, working_hours')
        .eq('clinic_id', clinicId)
        .eq('status', 'active');

      if (doctorError) {
        throw doctorError;
      }

      // Generate available slots
      const availableSlots = this.generateAvailableSlots(
        clinic.operating_hours,
        doctors || [],
        existingAppointments || [],
        startDate,
        endDate
      );

      // Get booked slots for reference
      const bookedSlots = (existingAppointments || []).map(apt => 
        `${apt.appointment_date}_${apt.appointment_time}`
      );

      return {
        clinicId: clinic.id,
        clinicName: clinic.clinic_name,
        availableSlots,
        operatingHours: clinic.operating_hours,
        bookedSlots
      };

    } catch (error) {
      console.error('Error getting clinic availability:', error);
      return {
        clinicId,
        clinicName: 'Unknown Clinic',
        availableSlots: [],
        operatingHours: {},
        bookedSlots: []
      };
    }
  }

  /**
   * Confirm payment and update appointment status
   */
  async confirmPayment(appointmentId: string, paymentReference: string): Promise<{
    success: boolean;
    appointment?: EnhancedAppointment;
    error?: string;
  }> {
    try {
      // Update appointment with payment confirmation
      const { data: appointment, error: updateError } = await supabase
        .from('appointments')
        .update({
          status: 'payment_confirmed',
          payment_status: 'paid',
          confirmed_at: new Date().toISOString()
        })
        .eq('id', appointmentId)
        .select(`
          *,
          patients:patient_id (first_name, last_name, email, phone),
          clinics:clinic_id (clinic_name, address, phone),
          doctors:doctor_id (full_name, specialization)
        `)
        .single();

      if (updateError) {
        throw updateError;
      }

      // Send confirmation notifications
      await this.sendBookingNotifications(appointmentId, 'appointment_confirmed');

      // Update clinic appointment count
      await this.updateClinicStats(appointment.clinic_id);

      const enhancedAppointment: EnhancedAppointment = {
        id: appointment.id,
        patientId: appointment.patient_id,
        clinicId: appointment.clinic_id,
        doctorId: appointment.doctor_id,
        paymentId: paymentReference,
        appointmentDate: appointment.appointment_date,
        appointmentTime: appointment.appointment_time,
        appointmentType: appointment.appointment_type,
        duration: appointment.duration_minutes,
        status: appointment.status,
        paymentStatus: appointment.payment_status,
        consultationFee: appointment.consultation_fee,
        mlValidationStatus: appointment.ml_validation_status,
        mlScore: appointment.booking_legitimacy_score,
        patientInfo: appointment.patients,
        clinicInfo: appointment.clinics,
        doctorInfo: appointment.doctors,
        createdAt: appointment.created_at,
        updatedAt: appointment.updated_at
      };

      return {
        success: true,
        appointment: enhancedAppointment
      };

    } catch (error) {
      console.error('Error confirming payment:', error);
      return {
        success: false,
        error: 'Failed to confirm payment'
      };
    }
  }

  /**
   * Cancel appointment with refund handling
   */
  async cancelAppointment(
    appointmentId: string,
    reason: string,
    cancelledBy: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Get appointment details
      const { data: appointment, error: fetchError } = await supabase
        .from('appointments')
        .select('*, payments!appointment_id(*)')
        .eq('id', appointmentId)
        .single();

      if (fetchError || !appointment) {
        return { success: false, error: 'Appointment not found' };
      }

      // Check if appointment can be cancelled
      const appointmentDateTime = new Date(`${appointment.appointment_date}T${appointment.appointment_time}`);
      const now = new Date();
      const hoursUntilAppointment = (appointmentDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

      if (hoursUntilAppointment < 24) {
        return { 
          success: false, 
          error: 'Appointments can only be cancelled 24 hours in advance' 
        };
      }

      // Process refund if payment was made
      if (appointment.payment_status === 'paid' && appointment.payments?.length > 0) {
        const payment = appointment.payments[0];
        if (payment.adyen_psp_reference) {
          const refundResult = await adyenPaymentService.processRefund(
            payment.adyen_psp_reference,
            appointment.consultation_fee,
            reason
          );

          if (!refundResult.success) {
            return { success: false, error: 'Failed to process refund' };
          }
        }
      }

      // Update appointment status
      const { error: updateError } = await supabase
        .from('appointments')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          cancelled_by: cancelledBy,
          cancellation_reason: reason
        })
        .eq('id', appointmentId);

      if (updateError) {
        throw updateError;
      }

      // Send cancellation notifications
      await this.sendBookingNotifications(appointmentId, 'appointment_cancelled');

      return { success: true };

    } catch (error) {
      console.error('Error cancelling appointment:', error);
      return { success: false, error: 'Failed to cancel appointment' };
    }
  }

  /**
   * Get appointments with enhanced filtering and pagination
   */
  async getAppointments(filters: {
    patientId?: string;
    clinicId?: string;
    doctorId?: string;
    status?: string[];
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    appointments: EnhancedAppointment[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      const page = filters.page || 1;
      const limit = filters.limit || 10;
      const offset = (page - 1) * limit;

      let query = supabase
        .from('appointments')
        .select(`
          *,
          patients:patient_id (first_name, last_name, email, phone),
          clinics:clinic_id (clinic_name, address, phone),
          doctors:doctor_id (full_name, specialization)
        `, { count: 'exact' });

      // Apply filters
      if (filters.patientId) {
        query = query.eq('patient_id', filters.patientId);
      }
      if (filters.clinicId) {
        query = query.eq('clinic_id', filters.clinicId);
      }
      if (filters.doctorId) {
        query = query.eq('doctor_id', filters.doctorId);
      }
      if (filters.status && filters.status.length > 0) {
        query = query.in('status', filters.status);
      }
      if (filters.dateFrom) {
        query = query.gte('appointment_date', filters.dateFrom);
      }
      if (filters.dateTo) {
        query = query.lte('appointment_date', filters.dateTo);
      }

      // Apply pagination and ordering
      query = query
        .order('appointment_date', { ascending: true })
        .order('appointment_time', { ascending: true })
        .range(offset, offset + limit - 1);

      const { data: appointments, error, count } = await query;

      if (error) {
        throw error;
      }

      const enhancedAppointments: EnhancedAppointment[] = (appointments || []).map(apt => ({
        id: apt.id,
        patientId: apt.patient_id,
        clinicId: apt.clinic_id,
        doctorId: apt.doctor_id,
        paymentId: apt.payment_id,
        appointmentDate: apt.appointment_date,
        appointmentTime: apt.appointment_time,
        appointmentType: apt.appointment_type,
        duration: apt.duration_minutes,
        status: apt.status,
        paymentStatus: apt.payment_status,
        consultationFee: apt.consultation_fee,
        mlValidationStatus: apt.ml_validation_status,
        mlScore: apt.booking_legitimacy_score,
        patientInfo: apt.patients,
        clinicInfo: apt.clinics,
        doctorInfo: apt.doctors,
        createdAt: apt.created_at,
        updatedAt: apt.updated_at
      }));

      return {
        appointments: enhancedAppointments,
        total: count || 0,
        page,
        totalPages: Math.ceil((count || 0) / limit)
      };

    } catch (error) {
      console.error('Error getting appointments:', error);
      return {
        appointments: [],
        total: 0,
        page: 1,
        totalPages: 0
      };
    }
  }

  /**
   * Private helper methods
   */

  private async validateBookingRequest(request: AppointmentBookingRequest): Promise<BookingValidationResult> {
    const blockers: string[] = [];
    const warnings: string[] = [];

    // Basic validation
    if (!request.patientId) blockers.push('Patient ID is required');
    if (!request.clinicId) blockers.push('Clinic ID is required');
    if (!request.appointmentDate) blockers.push('Appointment date is required');
    if (!request.appointmentTime) blockers.push('Appointment time is required');
    if (!request.consultationFee || request.consultationFee <= 0) {
      blockers.push('Valid consultation fee is required');
    }

    // Date validation
    const appointmentDateTime = new Date(`${request.appointmentDate}T${request.appointmentTime}`);
    const now = new Date();
    
    if (appointmentDateTime <= now) {
      blockers.push('Appointment must be in the future');
    }

    // Check if too far in advance (e.g., more than 6 months)
    const sixMonthsFromNow = new Date(now.getTime() + 6 * 30 * 24 * 60 * 60 * 1000);
    if (appointmentDateTime > sixMonthsFromNow) {
      warnings.push('Appointment is more than 6 months in advance');
    }

    // Verify clinic exists and is active
    try {
      const { data: clinic, error } = await supabase
        .from('clinics')
        .select('status')
        .eq('id', request.clinicId)
        .single();

      if (error || !clinic) {
        blockers.push('Clinic not found');
      } else if (clinic.status !== 'approved') {
        blockers.push('Clinic is not currently accepting appointments');
      }
    } catch (error) {
      blockers.push('Unable to verify clinic status');
    }

    // Verify patient exists
    try {
      const { data: patient, error } = await supabase
        .from('patients')
        .select('account_status')
        .eq('id', request.patientId)
        .single();

      if (error || !patient) {
        blockers.push('Patient not found');
      } else if (patient.account_status === 'suspended') {
        blockers.push('Patient account is suspended');
      }
    } catch (error) {
      blockers.push('Unable to verify patient status');
    }

    return {
      isValid: blockers.length === 0,
      requiresManualReview: warnings.length > 0,
      blockers,
      warnings
    };
  }

  private async checkSlotAvailability(
    clinicId: string,
    date: string,
    time: string,
    duration: number
  ): Promise<boolean> {
    try {
      const startTime = new Date(`${date}T${time}`);
      const endTime = new Date(startTime.getTime() + duration * 60000);

      // Check for overlapping appointments
      const { data: conflictingAppointments, error } = await supabase
        .from('appointments')
        .select('appointment_time, duration_minutes')
        .eq('clinic_id', clinicId)
        .eq('appointment_date', date)
        .in('status', ['scheduled', 'confirmed', 'payment_confirmed', 'in_progress']);

      if (error) {
        console.error('Error checking availability:', error);
        return false;
      }

      // Check for time conflicts
      for (const apt of conflictingAppointments || []) {
        const existingStart = new Date(`${date}T${apt.appointment_time}`);
        const existingEnd = new Date(existingStart.getTime() + apt.duration_minutes * 60000);

        if (
          (startTime >= existingStart && startTime < existingEnd) ||
          (endTime > existingStart && endTime <= existingEnd) ||
          (startTime <= existingStart && endTime >= existingEnd)
        ) {
          return false; // Conflict found
        }
      }

      return true;

    } catch (error) {
      console.error('Error in checkSlotAvailability:', error);
      return false;
    }
  }

  private generateAvailableSlots(
    operatingHours: any,
    doctors: any[],
    existingAppointments: any[],
    startDate: string,
    endDate: string
  ): AppointmentSlot[] {
    const slots: AppointmentSlot[] = [];
    const current = new Date(startDate);
    const end = new Date(endDate);

    while (current <= end) {
      const dateStr = current.toISOString().split('T')[0];
      const dayOfWeek = current.getDay();
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const dayName = dayNames[dayOfWeek];

      // Check if clinic is open on this day
      const dayHours = operatingHours?.[dayName];
      if (dayHours && dayHours.open && dayHours.close) {
        // Generate slots for this day
        const daySlots = this.generateDaySlots(
          dateStr,
          dayHours,
          doctors,
          existingAppointments
        );
        slots.push(...daySlots);
      }

      current.setDate(current.getDate() + 1);
    }

    return slots.sort((a, b) => {
      const dateCompare = a.date.localeCompare(b.date);
      return dateCompare !== 0 ? dateCompare : a.time.localeCompare(b.time);
    });
  }

  private generateDaySlots(
    date: string,
    dayHours: any,
    doctors: any[],
    existingAppointments: any[]
  ): AppointmentSlot[] {
    const slots: AppointmentSlot[] = [];
    const slotDuration = 30; // 30-minute slots

    // Get appointments for this date
    const dayAppointments = existingAppointments.filter(apt => apt.appointment_date === date);

    // Generate time slots
    const startTime = this.timeStringToMinutes(dayHours.open);
    const endTime = this.timeStringToMinutes(dayHours.close);

    for (let time = startTime; time < endTime; time += slotDuration) {
      const timeStr = this.minutesToTimeString(time);
      const slotStart = new Date(`${date}T${timeStr}`);
      const slotEnd = new Date(slotStart.getTime() + slotDuration * 60000);

      // Check if this slot conflicts with existing appointments
      const isConflict = dayAppointments.some(apt => {
        const aptStart = new Date(`${date}T${apt.appointment_time}`);
        const aptEnd = new Date(aptStart.getTime() + apt.duration_minutes * 60000);
        
        return (slotStart < aptEnd && slotEnd > aptStart);
      });

      // Determine available doctors and consultation fee
      const availableDoctor = doctors.length > 0 ? doctors[0] : null;
      const consultationFee = availableDoctor?.consultation_fee || 500;

      slots.push({
        date,
        time: timeStr,
        available: !isConflict,
        doctorId: availableDoctor?.id,
        doctorName: availableDoctor ? `${availableDoctor.first_name} ${availableDoctor.last_name}` : undefined,
        consultationFee,
        duration: slotDuration
      });
    }

    return slots;
  }

  private timeStringToMinutes(timeStr: string): number {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private minutesToTimeString(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }

  private async sendBookingNotifications(appointmentId: string, type: string) {
    try {
      // Get appointment details for notification
      const { data: appointment, error } = await supabase
        .from('appointments')
        .select(`
          *,
          patients:patient_id (user_id, first_name, last_name, email),
          clinics:clinic_id (user_id, clinic_name)
        `)
        .eq('id', appointmentId)
        .single();

      if (error || !appointment) {
        console.error('Error fetching appointment for notifications:', error);
        return;
      }

      // Create notifications for patient and clinic
      const notifications = [
        {
          user_id: appointment.patients.user_id,
          user_type: 'patient',
          title: this.getNotificationTitle(type, 'patient'),
          message: this.getNotificationMessage(type, 'patient', appointment),
          notification_type: type,
          appointment_id: appointmentId,
          priority: 'normal'
        },
        {
          user_id: appointment.clinics.user_id,
          user_type: 'clinic',
          title: this.getNotificationTitle(type, 'clinic'),
          message: this.getNotificationMessage(type, 'clinic', appointment),
          notification_type: type,
          appointment_id: appointmentId,
          priority: 'normal'
        }
      ];

      await supabase
        .from('notifications')
        .insert(notifications);

    } catch (error) {
      console.error('Error sending notifications:', error);
    }
  }

  private getNotificationTitle(type: string, userType: string): string {
    const titles: { [key: string]: { [key: string]: string } } = {
      'appointment_pending_payment': {
        'patient': 'Complete Your Payment',
        'clinic': 'New Appointment - Pending Payment'
      },
      'appointment_confirmed': {
        'patient': 'Appointment Confirmed',
        'clinic': 'Appointment Payment Confirmed'
      },
      'appointment_cancelled': {
        'patient': 'Appointment Cancelled',
        'clinic': 'Appointment Cancelled'
      }
    };

    return titles[type]?.[userType] || 'Appointment Update';
  }

  private getNotificationMessage(type: string, userType: string, appointment: any): string {
    const date = new Date(appointment.appointment_date).toLocaleDateString();
    const time = appointment.appointment_time;

    switch (type) {
      case 'appointment_pending_payment':
        return userType === 'patient' 
          ? `Please complete payment for your appointment on ${date} at ${time} to confirm your booking.`
          : `New appointment request for ${date} at ${time}. Payment is pending.`;
          
      case 'appointment_confirmed':
        return userType === 'patient'
          ? `Your appointment on ${date} at ${time} has been confirmed. Payment received.`
          : `Appointment on ${date} at ${time} has been confirmed. Payment received.`;
          
      case 'appointment_cancelled':
        return userType === 'patient'
          ? `Your appointment on ${date} at ${time} has been cancelled. Refund will be processed if applicable.`
          : `Appointment on ${date} at ${time} has been cancelled by the patient.`;
          
      default:
        return `Appointment update for ${date} at ${time}`;
    }
  }

  private async schedulePaymentTimeout(appointmentId: string) {
    // In a real application, this would integrate with a job queue like Redis/Bull
    // For now, we'll set a database flag for cleanup processes
    setTimeout(async () => {
      try {
        const { data: appointment, error } = await supabase
          .from('appointments')
          .select('status')
          .eq('id', appointmentId)
          .single();

        if (!error && appointment && appointment.status === 'pending_payment') {
          // Cancel appointment due to payment timeout
          await supabase
            .from('appointments')
            .update({
              status: 'cancelled',
              cancelled_at: new Date().toISOString(),
              cancellation_reason: 'Payment timeout'
            })
            .eq('id', appointmentId);
        }
      } catch (error) {
        console.error('Error handling payment timeout:', error);
      }
    }, 15 * 60 * 1000); // 15 minutes timeout
  }

  private async updateClinicStats(clinicId: string) {
    try {
      const { error } = await supabase.rpc('increment_clinic_appointments', {
        clinic_id: clinicId
      });

      if (error) {
        console.error('Error updating clinic stats:', error);
      }
    } catch (error) {
      console.error('Error in updateClinicStats:', error);
    }
  }
}

// Export singleton instance
export const enhancedAppointmentService = new EnhancedAppointmentService();
