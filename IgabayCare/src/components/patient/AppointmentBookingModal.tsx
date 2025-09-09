import React, { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { appointmentBookingService } from '../../features/auth/utils/appointmentBookingService';
import { appointmentManagementAPI } from '../../features/auth/utils/appointmentManagementAPI';
import { supabase } from '../../supabaseClient';
import type { AppointmentType } from '../../types/appointments';
import { PaymentForm } from './PaymentForm';
import { PayMongoGCashPayment } from './PayMongoGCashPayment';
import type { PaymentResponse } from '../../types/payment';
import { X, ChevronLeft, ChevronRight, Clock, CheckCircle } from 'lucide-react';

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
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [availableTimeSlots, setAvailableTimeSlots] = useState<TimeSlot[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [appointmentType, setAppointmentType] = useState<AppointmentType>('consultation');
  const [patientNotes, setPatientNotes] = useState('');
  const [showPayment, setShowPayment] = useState(false);
  const [showGCashPayment, setShowGCashPayment] = useState(false);
  const [appointmentData, setAppointmentData] = useState<any>(null);
  const [patientData, setPatientData] = useState<any>(null);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  // Services selection state
  const [servicesOptions, setServicesOptions] = useState<string[]>([]);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);

  // -------- Calendar helpers ----------
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
      const isSelected =
        selectedDate && date.toDateString() === selectedDate.toDateString();
      const isAvailable = isCurrentMonth && !isPastDate && isClinicOpenOnDate(date);

      days.push({
        date,
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

  const isClinicOpenOnDate = (date: Date): boolean => {
    if (!clinic.operating_hours) return true;
    const dayOfWeek = date.getDay();
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = dayNames[dayOfWeek];
    const dayHours = clinic.operating_hours[dayName];
    return dayHours && dayHours.open && dayHours.close;
  };

  // -------- Time slots ----------
  const loadTimeSlots = async (date: Date) => {
    if (!(date instanceof Date) || isNaN(date.getTime())) {
      console.error("Invalid date in loadTimeSlots:", date);
      setAvailableTimeSlots([]);
      return;
    }

    setLoading(true);
    try {
      const dateStr = date.toISOString().split('T')[0];
      const slots = await appointmentBookingService.getAvailableTimeSlots(clinic.id, dateStr);
      setAvailableTimeSlots(slots);
    } catch (error) {
      console.error('Error loading time slots:', error);
      setAvailableTimeSlots([]);
    } finally {
      setLoading(false);
    }
  };

  // -------- Appointment handlers ----------
  const handleDateSelect = (date: Date, isAvailable: boolean) => {
    if (!isAvailable) return;
    const validDate = new Date(date);
    if (isNaN(validDate.getTime())) return;

    setSelectedDate(validDate);
    setSelectedTime('');
    loadTimeSlots(validDate);
  };

  const handleBookAppointment = async () => {
    if (!selectedDate || !selectedTime) return;

    setLoading(true);
    try {
      const dateStr = selectedDate.toISOString().split('T')[0];
      
      const composedNotes = buildComposedNotes(patientNotes, selectedServices);

      const result = await appointmentBookingService.createAppointment({
        patient_id: patientId,
        clinic_id: clinic.id,
        appointment_date: dateStr,
        appointment_time: selectedTime + ':00',
        appointment_type: appointmentType,
        patient_notes: composedNotes,
        status: 'scheduled'
      });

      if (result.success) {
        // Create notification
        await appointmentBookingService.createAppointmentNotification(
          patientId,
          clinic.clinic_name,
          dateStr,
          selectedTime
        );

        setBookingSuccess(true);
        onAppointmentBooked?.();
        
        // Reset form after short delay to show success
        setTimeout(() => {
          onClose();
          setSelectedDate(null);
          setSelectedTime('');
          setPatientNotes('');
          setBookingSuccess(false);
        }, 2000);
      } else {
        alert(`Failed to book appointment: ${result.error}`);
      }
    } catch (error) {
      console.error('Error booking appointment:', error);
      alert('Failed to book appointment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // -------- Payments ----------
  const calculateAppointmentCost = () => {
    const baseFee = 500, bookingFee = 50;
    return { consultation_fee: baseFee, booking_fee: bookingFee, total_amount: baseFee + bookingFee };
  };

  const handleProceedToGCashPayment = () => {
    if (!selectedDate || !selectedTime) return;
    setAppointmentData({ appointment_id: `temp_${Date.now()}`, ...calculateAppointmentCost() });
    setShowGCashPayment(true);
  };


  const handlePaymentComplete = async (paymentResponse: PaymentResponse) => {
    setShowPayment(false);
    
    if (!selectedDate || !selectedTime) return;
    
    // Use the comprehensive appointment booking API with payment
    const dateStr = selectedDate.toISOString().split('T')[0];
    const composedNotes = buildComposedNotes(patientNotes, selectedServices);
    const result = await appointmentManagementAPI.completeAppointmentBooking({
      patientId,
      clinicId: clinic.id,
      appointmentDate: dateStr,
      appointmentTime: selectedTime + ':00',
      appointmentType,
      patientNotes: composedNotes,
      paymentMethod: 'credit_card',
      paymentProvider: 'paymongo',
      externalPaymentId: (paymentResponse as any).payment_id || 'manual_payment',
      totalAmount: calculateAppointmentCost().total_amount,
      consultationFee: calculateAppointmentCost().consultation_fee,
      bookingFee: calculateAppointmentCost().booking_fee
    });

    if (result.success) {
      setBookingSuccess(true);
      onAppointmentBooked?.();
      setTimeout(() => {
        onClose();
        setSelectedDate(null);
        setSelectedTime('');
        setPatientNotes('');
        setBookingSuccess(false);
      }, 2000);
    } else {
      alert(`Payment confirmation failed: ${result.error}`);
    }
  };

  const handleGCashPaymentComplete = async (paymentIntentId: string) => {
    setShowGCashPayment(false);
    
    if (!selectedDate || !selectedTime) return;
    
    // Use the comprehensive appointment booking API with GCash payment
    const dateStr = selectedDate.toISOString().split('T')[0];
    const composedNotes = buildComposedNotes(patientNotes, selectedServices);
    const result = await appointmentManagementAPI.completeAppointmentBooking({
      patientId,
      clinicId: clinic.id,
      appointmentDate: dateStr,
      appointmentTime: selectedTime + ':00',
      appointmentType,
      patientNotes: composedNotes,
      paymentMethod: 'gcash',
      paymentProvider: 'paymongo',
      externalPaymentId: paymentIntentId,
      totalAmount: calculateAppointmentCost().total_amount,
      consultationFee: calculateAppointmentCost().consultation_fee,
      bookingFee: calculateAppointmentCost().booking_fee
    });

    if (result.success) {
      setBookingSuccess(true);
      onAppointmentBooked?.();
      setTimeout(() => {
        onClose();
        setSelectedDate(null);
        setSelectedTime('');
        setPatientNotes('');
        setBookingSuccess(false);
      }, 2000);
    } else {
      alert(`Payment confirmation failed: ${result.error}`);
    }
  };

  const handleGCashPaymentError = (error: string) => {
    alert(`Payment failed: ${error}`);
  };

  // -------- Month nav ----------
  const navigateMonth = (dir: 'prev' | 'next') => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(currentMonth.getMonth() + (dir === 'next' ? 1 : -1));
    setCurrentMonth(newMonth);
    setSelectedDate(null);
    setSelectedTime('');
  };

  // -------- Effects ----------
  useEffect(() => {
    if (selectedDate) loadTimeSlots(selectedDate);
  }, [selectedDate]);

  useEffect(() => {
    if (isOpen) {
      // Load patient data for payment modal
      supabase.auth.getUser().then(({ data: user }) => {
        if (user?.user) {
          supabase.from('patients').select('*').eq('user_id', user.user.id).single().then(({ data: patient }) => {
            if (patient) setPatientData({ ...patient, email: user.user.email });
          });
        }
      });

      // Load clinic services to offer as selectable options
      if (clinic?.id) {
        supabase
          .from('clinics')
          .select('services, custom_services')
          .eq('id', clinic.id)
          .single()
          .then(({ data }) => {
            const combined = [
              ...(Array.isArray(data?.services) ? data!.services : []),
              ...(Array.isArray(data?.custom_services) ? data!.custom_services : []),
            ]
              .map((s: any) => (typeof s === 'string' ? s : String(s)))
              .filter(Boolean);
            setServicesOptions(Array.from(new Set(combined)).sort());
          })
          .catch(() => setServicesOptions([]));
      }

      // Reset selections when opening
      setSelectedServices([]);
    }
  }, [isOpen, clinic?.id]);

  if (!isOpen) return null;

  const calendarDays = generateCalendarDays();
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  // Helpers
  const toggleServiceSelection = (service: string) => {
    setSelectedServices((prev) => (
      prev.includes(service) ? prev.filter((s) => s !== service) : [...prev, service]
    ));
  };

  const buildComposedNotes = (notes: string, services: string[]) => {
    if (!services || services.length === 0) return notes || '';
    const header = 'Requested services: ' + services.join(', ');
    return notes ? `${header}\n${notes}` : header;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="px-3 sm:px-6 py-3 sm:py-4 border-b border-gray-200 flex justify-between items-center">
            <div>
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Book Appointment</h2>
              <p className="text-xs sm:text-sm text-gray-600">{clinic?.clinic_name}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1"
            >
              <X className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Calendar Section */}
              <div className="bg-white border rounded-xl shadow-sm p-4 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base sm:text-lg font-semibold">Select Date</h3>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => navigateMonth('prev')}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <ChevronLeft className="h-5 w-5 text-gray-600" />
                    </button>
                    <span className="font-medium text-gray-900 min-w-[120px] text-center">
                      {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                    </span>
                    <button
                      onClick={() => navigateMonth('next')}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <ChevronRight className="h-5 w-5 text-gray-600" />
                    </button>
                  </div>
                </div>

                {/* Weekdays */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="text-center text-xs font-medium text-gray-500 py-1">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Dates */}
                <div className="grid grid-cols-7 gap-1">
                  {calendarDays.map((day, index) => {
                    const isToday = day.date.toDateString() === new Date().toDateString();
                    const isSelected = selectedDate && day.date.toDateString() === selectedDate.toDateString();
                    const isPast = day.date < new Date(new Date().setHours(0, 0, 0, 0));
                    const isAvailable = !isPast && day.isCurrentMonth;

                    return (
                      <button
                        key={index}
                        onClick={() => handleDateSelect(day.date, day.isAvailable)}
                        disabled={!day.isAvailable}
                        className={`
                h-10 w-10 flex items-center justify-center rounded-lg text-sm transition-colors
                ${isToday ? 'bg-blue-100 text-blue-600 font-semibold' : ''}
                ${isSelected ? 'bg-blue-600 text-white font-semibold' : ''}
                ${isPast || !isAvailable ? 'text-gray-300 cursor-not-allowed' : 'hover:bg-gray-100'}
              `}
                      >
                        {day.date.getDate()}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Time Slots + Details */}
              <div className="bg-white border rounded-xl shadow-sm p-4 sm:p-6">
                {selectedDate ? (
                  <>
                    {/* Times */}
                    <h3 className="text-base sm:text-lg font-semibold mb-3 flex items-center">
                      <Clock className="h-5 w-5 mr-2 text-gray-600" />
                      {selectedDate.toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </h3>

                    {loading ? (
                      <div className="grid grid-cols-3 gap-2 mb-4">
                        {[...Array(6)].map((_, i) => (
                          <div key={i} className="h-10 bg-gray-200 rounded animate-pulse"></div>
                        ))}
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4 max-h-40 overflow-y-auto">
                        {availableTimeSlots.map(slot => (
                          <button
                            key={slot.time}
                            onClick={() => setSelectedTime(slot.time)}
                            disabled={!slot.available}
                            className={`
                    px-3 py-2 text-sm border rounded-lg transition-colors
                    ${selectedTime === slot.time
                                ? 'bg-blue-600 text-white border-blue-600'
                                : slot.available
                                  ? 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                                  : 'border-gray-200 text-gray-400 cursor-not-allowed bg-gray-50'
                              }
                  `}
                          >
                            {slot.formatted}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Appointment Form */}
                    {selectedTime && (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Appointment Type
                          </label>
                          <select
                            value={appointmentType}
                            onChange={e => setAppointmentType(e.target.value as AppointmentType)}
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                            Services Needed (select all that apply)
                          </label>
                          {servicesOptions.length > 0 ? (
                            <div className="flex flex-wrap gap-2 mb-3">
                              {servicesOptions.map((svc) => {
                                const selected = selectedServices.includes(svc);
                                return (
                                  <button
                                    type="button"
                                    key={svc}
                                    onClick={() => toggleServiceSelection(svc)}
                                    className={`px-3 py-1 rounded-full border text-xs sm:text-sm transition-colors ${
                                      selected ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-blue-50'
                                    }`}
                                  >
                                    {svc}
                                  </button>
                                );
                              })}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500 mb-3">No specific services listed by the clinic. You may describe your needs below.</p>
                          )}

                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Notes (Optional)
                          </label>
                          <textarea
                            value={patientNotes}
                            onChange={e => setPatientNotes(e.target.value)}
                            placeholder="Describe your symptoms..."
                            rows={3}
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        {/* Summary */}
                        <div className="bg-gray-50 p-3 rounded-lg text-sm">
                          <h4 className="font-semibold mb-2">Appointment Summary</h4>
                          <div className="space-y-1">
                            <div className="flex justify-between">
                              <span>Clinic:</span>
                              <span className="font-medium">{clinic?.clinic_name}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Date:</span>
                              <span className="font-medium">{selectedDate.toLocaleDateString('en-US')}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Time:</span>
                              <span className="font-medium">{selectedTime}</span>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end space-x-3">
                          <Button variant="outline" onClick={onClose}>
                            Cancel
                          </Button>
                          {bookingSuccess ? (
                            <div className="flex items-center text-green-600">
                              <CheckCircle className="h-5 w-5 mr-2" />
                              <span>Appointment Booked!</span>
                            </div>
                          ) : (
                            <>
                              <Button
                                onClick={handleProceedToGCashPayment}
                                disabled={!selectedDate || !selectedTime || loading}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                Pay with GCash (₱{calculateAppointmentCost().total_amount})
                              </Button>
                              <Button
                                onClick={handleBookAppointment}
                                disabled={!selectedDate || !selectedTime || loading}
                                loading={loading}
                                className="bg-blue-600 hover:bg-blue-700"
                              >
                                Book Without Payment
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-gray-500 text-sm">Select a date to view available times.</p>
                )}
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
      </div>
    </div>
  );
};
