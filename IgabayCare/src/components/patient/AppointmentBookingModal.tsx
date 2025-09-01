import React, { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { AppointmentService } from '../../features/auth/utils/appointmentService';
import { supabase } from '../../supabaseClient';
import type { CreateAppointmentData, AppointmentType } from '../../types/appointments';
import { PaymentForm } from './PaymentForm';
import { PayMongoGCashPayment } from './PayMongoGCashPayment';
import type { PaymentResponse } from '../../types/payment';

interface AppointmentBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  clinic: {
    id: string;
    clinic_name: string;
    operating_hours?: any;
  };
  patientId: string;
  onAppointmentBooked?: () => void;
}

interface TimeSlot {
  time: string;
  available: boolean;
  formatted: string;
}

export const AppointmentBookingModal: React.FC<AppointmentBookingModalProps> = ({
  isOpen,
  onClose,
  clinic,
  patientId,
  onAppointmentBooked
}) => {
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [availableTimeSlots, setAvailableTimeSlots] = useState<TimeSlot[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [appointmentType, setAppointmentType] = useState<AppointmentType>('consultation');
  const [patientNotes, setPatientNotes] = useState('');
  const [showPayment, setShowPayment] = useState(false);
  const [showGCashPayment, setShowGCashPayment] = useState(false);
  const [appointmentData, setAppointmentData] = useState<any>(null);
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const [patientData, setPatientData] = useState<any>(null);

  // Generate calendar days for current month
  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      
      const isCurrentMonth = date.getMonth() === month;
      const isPastDate = date < today;
      const isToday = date.toDateString() === today.toDateString();
      const dateString = date.toISOString().split('T')[0];
      const isSelected = selectedDate === dateString;
      const isAvailable = isCurrentMonth && !isPastDate && isClinicOpenOnDate(date);

      days.push({
        date,
        dateString,
        day: date.getDate(),
        isCurrentMonth,
        isPastDate,
        isToday,
        isSelected,
        isAvailable
      });
    }

    return days;
  };

  // Check if clinic is open on a specific date
  const isClinicOpenOnDate = (date: Date): boolean => {
    if (!clinic.operating_hours) return true; // Default to available if no hours specified
    
    const dayOfWeek = date.getDay();
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = dayNames[dayOfWeek];
    
    const dayHours = clinic.operating_hours[dayName];
    return dayHours && dayHours.open && dayHours.close;
  };

  // Generate default time slots
  const generateTimeSlots = async (date: string): Promise<TimeSlot[]> => {
    try {
      // Get existing appointments for this date
      const { data: existingAppointments } = await supabase
        .from('appointments')
        .select('appointment_time')
        .eq('clinic_id', clinic.id)
        .eq('appointment_date', date)
        .in('status', ['scheduled', 'confirmed']);

      const bookedTimes = new Set(
        existingAppointments?.map(apt => apt.appointment_time.substring(0, 5)) || []
      );

      // Generate default time slots (9 AM to 5 PM, excluding lunch 12-1 PM)
      const timeSlots: TimeSlot[] = [];
      const slots = [
        '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
        '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00'
      ];

      slots.forEach(time => {
        timeSlots.push({
          time,
          available: !bookedTimes.has(time),
          formatted: new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
          })
        });
      });

      return timeSlots;
    } catch (error) {
      console.error('Error generating time slots:', error);
      return [];
    }
  };

  // Load available time slots for selected date
  const loadTimeSlots = async (date: string) => {
    if (!date) return;
    
    setLoading(true);
    try {
      const slots = await generateTimeSlots(date);
      setAvailableTimeSlots(slots);
    } catch (error) {
      console.error('Error loading time slots:', error);
      setAvailableTimeSlots([]);
    } finally {
      setLoading(false);
    }
  };

  // Create appointment notification
  const createAppointmentNotification = async (
    patientId: string,
    clinicName: string,
    appointmentDate: string,
    appointmentTime: string
  ) => {
    try {
      const formattedDate = new Date(appointmentDate).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      const formattedTime = new Date(`2000-01-01T${appointmentTime}`).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });

      await supabase
        .from('notifications')
        .insert([{
          user_id: patientId,
          user_type: 'patient',
          title: 'Appointment Confirmed',
          message: `Your appointment at ${clinicName} has been scheduled for ${formattedDate} at ${formattedTime}`,
          type: 'appointment_confirmation',
          is_read: false
        }]);

      console.log('✅ Appointment notification created');
    } catch (error) {
      console.error('❌ Error creating notification:', error);
    }
  };

  // Handle date selection
  const handleDateSelect = (dateString: string, isAvailable: boolean) => {
    if (!isAvailable) return;
    
    setSelectedDate(dateString);
    setSelectedTime('');
    loadTimeSlots(dateString);
  };

  // Calculate appointment pricing
  const calculateAppointmentCost = () => {
    const baseFee = 500; // Default consultation fee
    const bookingFee = 50; // Platform booking fee
    const totalAmount = baseFee + bookingFee;
    
    return {
      consultation_fee: baseFee,
      booking_fee: bookingFee,
      total_amount: totalAmount
    };
  };

  // Load patient data
  const loadPatientData = async () => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (user?.user) {
        const { data: patient } = await supabase
          .from('patients')
          .select('*')
          .eq('user_id', user.user.id)
          .single();
        
        if (patient) {
          setPatientData({
            ...patient,
            email: user.user.email
          });
        }
      }
    } catch (error) {
      console.error('Error loading patient data:', error);
    }
  };

  // Handle proceeding to GCash payment
  const handleProceedToGCashPayment = () => {
    if (!selectedDate || !selectedTime) return;

    const appointmentCost = calculateAppointmentCost();
    setAppointmentData({
      appointment_id: `temp_${Date.now()}`, // Temporary ID for payment
      ...appointmentCost
    });
    setShowGCashPayment(true);
  };

  // Handle proceeding to other payment methods
  const handleProceedToPayment = () => {
    if (!selectedDate || !selectedTime) return;

    const appointmentCost = calculateAppointmentCost();
    setAppointmentData({
      appointment_id: `temp_${Date.now()}`, // Temporary ID for payment
      ...appointmentCost
    });
    setShowPayment(true);
  };

  // Handle payment completion
  const handlePaymentComplete = (paymentResponse: PaymentResponse) => {
    console.log('Payment completed:', paymentResponse);
    setPaymentCompleted(true);
    setShowPayment(false);
    // Proceed with actual appointment booking
    handleBookAppointment();
  };

  // Handle GCash payment completion
  const handleGCashPaymentComplete = (paymentIntentId: string) => {
    console.log('GCash payment completed:', paymentIntentId);
    setPaymentCompleted(true);
    setShowGCashPayment(false);
    // Proceed with actual appointment booking
    handleBookAppointment();
  };

  // Handle GCash payment error
  const handleGCashPaymentError = (error: string) => {
    console.error('GCash payment error:', error);
    alert(`Payment failed: ${error}`);
  };

  // Handle appointment booking (after payment)
  const handleBookAppointment = async () => {
    if (!selectedDate || !selectedTime) return;

    setBookingLoading(true);
    try {
      const appointmentData: CreateAppointmentData = {
        patient_id: patientId,
        clinic_id: clinic.id,
        appointment_date: selectedDate,
        appointment_time: selectedTime + ':00',
        appointment_type: appointmentType,
        status: 'scheduled'
      };

      const result = await AppointmentService.createAppointment(appointmentData);

      if (result) {
        // Create notification
        await createAppointmentNotification(
          patientId,
          clinic.clinic_name,
          selectedDate,
          selectedTime
        );

        onAppointmentBooked?.();
        onClose();
        
        // Reset form
        setSelectedDate('');
        setSelectedTime('');
        setPatientNotes('');
      } else {
        alert('Failed to book appointment. Please try again.');
      }
    } catch (error) {
      console.error('Error booking appointment:', error);
      alert('Failed to book appointment. Please try again.');
    } finally {
      setBookingLoading(false);
    }
  };

  // Navigate months
  const navigateMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(currentMonth.getMonth() + (direction === 'next' ? 1 : -1));
    setCurrentMonth(newMonth);
    setSelectedDate('');
    setSelectedTime('');
  };

  useEffect(() => {
    if (selectedDate) {
      loadTimeSlots(selectedDate);
    }
  }, [selectedDate]);

  useEffect(() => {
    if (isOpen) {
      loadPatientData();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const calendarDays = generateCalendarDays();
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Book Appointment</h2>
              <p className="text-gray-600">{clinic.clinic_name}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Calendar Section */}
            <div>
              <div className="mb-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Select Date</h3>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => navigateMonth('prev')}
                      className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <span className="text-lg font-medium min-w-[140px] text-center">
                      {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                    </span>
                    <button
                      onClick={() => navigateMonth('next')}
                      className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
                      {day}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-1">
                  {calendarDays.map((day, index) => (
                    <button
                      key={index}
                      onClick={() => handleDateSelect(day.dateString, day.isAvailable)}
                      disabled={!day.isAvailable}
                      className={`
                        p-3 text-sm rounded-lg transition-all duration-200
                        ${!day.isCurrentMonth ? 'text-gray-300' : ''}
                        ${day.isPastDate ? 'text-gray-300 cursor-not-allowed' : ''}
                        ${day.isToday ? 'ring-2 ring-blue-500' : ''}
                        ${day.isSelected ? 'bg-blue-600 text-white' : ''}
                        ${day.isAvailable && !day.isSelected ? 'hover:bg-blue-100 text-gray-700' : ''}
                        ${!day.isAvailable ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : ''}
                      `}
                    >
                      {day.day}
                    </button>
                  ))}
                </div>

                {/* Legend */}
                <div className="mt-4 flex flex-wrap gap-4 text-xs">
                  <div className="flex items-center space-x-1">
                    <div className="w-3 h-3 bg-blue-600 rounded"></div>
                    <span>Selected</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-3 h-3 bg-gray-100 rounded"></div>
                    <span>Unavailable</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-3 h-3 ring-2 ring-blue-500 rounded"></div>
                    <span>Today</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Time Slots and Booking Details */}
            <div>
              {selectedDate && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-3">
                    Available Times - {new Date(selectedDate).toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </h3>
                  
                  {loading ? (
                    <div className="grid grid-cols-3 gap-2">
                      {[...Array(9)].map((_, i) => (
                        <div key={i} className="h-10 bg-gray-200 rounded animate-pulse"></div>
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                      {availableTimeSlots.map((slot) => (
                        <button
                          key={slot.time}
                          onClick={() => setSelectedTime(slot.time)}
                          disabled={!slot.available}
                          className={`
                            p-2 text-sm rounded-lg border transition-all duration-200
                            ${selectedTime === slot.time 
                              ? 'bg-blue-600 text-white border-blue-600' 
                              : slot.available 
                                ? 'bg-white text-gray-700 border-gray-300 hover:bg-blue-50 hover:border-blue-300'
                                : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                            }
                          `}
                        >
                          {slot.formatted}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Appointment Details Form */}
              {selectedDate && selectedTime && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Appointment Type
                    </label>
                    <select
                      value={appointmentType}
                      onChange={(e) => setAppointmentType(e.target.value as AppointmentType)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="consultation">General Consultation</option>
                      <option value="routine_checkup">Routine Checkup</option>
                      <option value="follow_up">Follow-up Visit</option>
                      <option value="specialist_visit">Specialist Visit</option>
                      <option value="vaccination">Vaccination</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Notes (Optional)
                    </label>
                    <textarea
                      value={patientNotes}
                      onChange={(e) => setPatientNotes(e.target.value)}
                      placeholder="Describe your symptoms or reason for visit..."
                      rows={3}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  {/* Booking Summary */}
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">Appointment Summary</h4>
                    <div className="space-y-1 text-sm text-blue-800">
                      <p><strong>Clinic:</strong> {clinic.clinic_name}</p>
                      <p><strong>Date:</strong> {new Date(selectedDate).toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}</p>
                      <p><strong>Time:</strong> {new Date(`2000-01-01T${selectedTime}`).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true
                      })}</p>
                      <p><strong>Type:</strong> {appointmentType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-3 pt-4">
                    <Button
                      onClick={onClose}
                      variant="outline"
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    {paymentCompleted ? (
                      <Button
                        onClick={handleBookAppointment}
                        disabled={bookingLoading}
                        className="flex-1"
                      >
                        {bookingLoading ? (
                          <div className="flex items-center space-x-2">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span>Booking...</span>
                          </div>
                        ) : (
                          'Confirm Appointment'
                        )}
                      </Button>
                    ) : (
                      <>
                        <Button
                          onClick={handleProceedToGCashPayment}
                          className="flex-1 bg-blue-600 hover:bg-blue-700"
                        >
                          Pay with GCash
                        </Button>
                        <Button
                          onClick={handleProceedToPayment}
                          variant="outline"
                          className="flex-1"
                        >
                          Other Payment
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPayment && appointmentData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-xl font-semibold mb-4">Complete Payment</h3>
              <PaymentForm
                clinicId={clinic.id}
                patientId={patientId}
                appointmentData={appointmentData}
                onPaymentComplete={handlePaymentComplete}
                onBack={() => setShowPayment(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* GCash Payment Modal */}
      {showGCashPayment && appointmentData && patientData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-xl font-semibold mb-4">GCash Payment - {clinic.clinic_name}</h3>
              <PayMongoGCashPayment
                amount={appointmentData.total_amount}
                description={`Medical consultation at ${clinic.clinic_name}`}
                appointmentId={appointmentData.appointment_id}
                clinicId={clinic.id}
                patientName={`${patientData.first_name} ${patientData.last_name}`}
                patientEmail={patientData.email || ''}
                patientPhone={patientData.phone || ''}
                onPaymentSuccess={handleGCashPaymentComplete}
                onPaymentError={handleGCashPaymentError}
                onBack={() => setShowGCashPayment(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
